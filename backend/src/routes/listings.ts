import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import type { PoolClient } from 'pg'
import { z } from 'zod'
import { asyncHandler } from '../asyncHandler.js'
import { requireAuth, requireRole, type JwtUser } from '../auth.js'
import { query, withTransaction } from '../db.js'
import { broadcast } from '../realtime.js'

const createListingSchema = z.object({
  food_type: z.enum(['cooked', 'packaged', 'produce', 'bakery']),
  description: z.string().min(1).max(2000),
  photo_url: z.string().max(2000).optional().nullable(),
  quantity_kg: z.number().positive().optional().nullable(),
  servings_est: z.number().int().positive().optional().nullable(),
  pickup_window_start: z.string().datetime(),
  pickup_window_end: z.string().datetime(),
  expires_at: z.string().datetime(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  allergen_flags: z.array(z.string()).optional().default([]),
  safety_note: z.string().min(1).max(1000),
})

type ListingRow = {
  id: string
  provider_id: string
  food_type: string
  description: string | null
  photo_url: string | null
  quantity_kg: string | null
  servings_est: number | null
  pickup_window_start: string
  pickup_window_end: string
  expires_at: string
  status: string
  allergen_flags: string[]
  safety_note: string | null
  created_at: string
  lat: number
  lng: number
  distance_m?: string
  provider_name?: string
}

function toListingPayload(row: ListingRow) {
  return {
    id: row.id,
    provider_id: row.provider_id,
    food_type: row.food_type,
    description: row.description,
    photo_url: row.photo_url,
    quantity_kg: row.quantity_kg,
    servings_est: row.servings_est,
    pickup_window_start: row.pickup_window_start,
    pickup_window_end: row.pickup_window_end,
    expires_at: row.expires_at,
    status: row.status,
    allergen_flags: row.allergen_flags,
    safety_note: row.safety_note,
    created_at: row.created_at,
    lat: row.lat,
    lng: row.lng,
    distance_m: row.distance_m,
    provider_name: row.provider_name,
  }
}

export const listingsRouter = Router()

listingsRouter.get(
  '/nearby',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      lat: z.coerce.number().min(-90).max(90),
      lng: z.coerce.number().min(-180).max(180),
      radius_km: z.coerce.number().min(0.5).max(50).optional().default(3),
      food_type: z.enum(['cooked', 'packaged', 'produce', 'bakery']).optional(),
    })
    const parsed = schema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query', details: parsed.error.flatten() })
      return
    }
    const { lat, lng, radius_km, food_type } = parsed.data
    const radiusM = radius_km * 1000
    const params: unknown[] = [lng, lat, radiusM]
    let typeFilter = ''
    if (food_type) {
      typeFilter = 'AND l.food_type = $4'
      params.push(food_type)
    }
    const r = await query<ListingRow>(
      `SELECT l.id, l.provider_id, l.food_type, l.description, l.photo_url, l.quantity_kg, l.servings_est,
              l.pickup_window_start, l.pickup_window_end, l.expires_at, l.status, l.allergen_flags,
              l.safety_note, l.created_at,
              ST_Y(l.location::geometry) AS lat, ST_X(l.location::geometry) AS lng,
              ST_Distance(l.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_m
       FROM listings l
       WHERE l.status = 'active'
         AND l.expires_at > now()
         AND ST_DWithin(l.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
         ${typeFilter}
       ORDER BY distance_m ASC
       LIMIT 100`,
      params,
    )
    res.json({ listings: r.rows.map(toListingPayload) })
  }),
)

listingsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const idParse = z.string().uuid().safeParse(req.params.id)
    if (!idParse.success) {
      res.status(400).json({ error: 'Invalid listing id' })
      return
    }
    const id = idParse.data
    const r = await query<ListingRow>(
      `SELECT l.id, l.provider_id, l.food_type, l.description, l.photo_url, l.quantity_kg, l.servings_est,
              l.pickup_window_start, l.pickup_window_end, l.expires_at, l.status, l.allergen_flags,
              l.safety_note, l.created_at,
              ST_Y(l.location::geometry) AS lat, ST_X(l.location::geometry) AS lng,
              u.name AS provider_name
       FROM listings l
       JOIN users u ON u.id = l.provider_id
       WHERE l.id = $1`,
      [id],
    )
    const row = r.rows[0]
    if (!row) {
      res.status(404).json({ error: 'Listing not found' })
      return
    }
    res.json({ listing: toListingPayload(row) })
  }),
)

listingsRouter.post(
  '/',
  requireAuth,
  requireRole('provider', 'admin'),
  asyncHandler(async (req, res) => {
    const parsed = createListingSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
      return
    }
    const u = (req as typeof req & { user: JwtUser }).user
    const b = parsed.data
    const pws = new Date(b.pickup_window_start)
    const pwe = new Date(b.pickup_window_end)
    const exp = new Date(b.expires_at)
    if (pwe.getTime() <= pws.getTime()) {
      res.status(400).json({ error: 'pickup_window_end must be after pickup_window_start' })
      return
    }
    if (exp.getTime() <= Date.now()) {
      res.status(400).json({ error: 'expires_at must be in the future' })
      return
    }
    const photoUrl = b.photo_url?.trim() || null
    const ins = await query<ListingRow>(
      `INSERT INTO listings (
         provider_id, food_type, description, photo_url, quantity_kg, servings_est,
         pickup_window_start, pickup_window_end, expires_at, location, allergen_flags, safety_note
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         ST_SetSRID(ST_MakePoint($10, $11), 4326)::geography,
         $12, $13
       )
       RETURNING id, provider_id, food_type, description, photo_url, quantity_kg, servings_est,
                 pickup_window_start, pickup_window_end, expires_at, status, allergen_flags,
                 safety_note, created_at,
                 ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng`,
      [
        u.id,
        b.food_type,
        b.description,
        photoUrl,
        b.quantity_kg ?? null,
        b.servings_est ?? null,
        pws.toISOString(),
        pwe.toISOString(),
        exp.toISOString(),
        b.lng,
        b.lat,
        b.allergen_flags ?? [],
        b.safety_note,
      ],
    )
    const row = ins.rows[0]
    const payload = toListingPayload(row)
    broadcast({ type: 'listing:new', listing: payload })
    res.status(201).json({ listing: payload })
  }),
)

listingsRouter.patch(
  '/:id/claim',
  requireAuth,
  requireRole('recipient', 'volunteer', 'admin'),
  asyncHandler(async (req, res) => {
    const idParse = z.string().uuid().safeParse(req.params.id)
    if (!idParse.success) {
      res.status(400).json({ error: 'Invalid listing id' })
      return
    }
    const listingId = idParse.data
    const u = (req as typeof req & { user: JwtUser }).user

    const qrToken = randomBytes(24).toString('base64url')

    try {
      const result = await withTransaction(async (client: PoolClient) => {
        const lock = await client.query<{ id: string; provider_id: string; status: string }>(
          `SELECT id, provider_id, status FROM listings WHERE id = $1 FOR UPDATE`,
          [listingId],
        )
        const listing = lock.rows[0]
        if (!listing) {
          return { error: 'not_found' as const }
        }
        if (listing.provider_id === u.id) {
          return { error: 'self_claim' as const }
        }
        if (listing.status !== 'active') {
          return { error: 'not_active' as const }
        }
        const claimIns = await client.query<{ id: string; qr_token: string }>(
          `INSERT INTO claims (listing_id, recipient_id, qr_token)
           VALUES ($1, $2, $3)
           RETURNING id, qr_token`,
          [listingId, u.id, qrToken],
        )
        await client.query(`UPDATE listings SET status = 'claimed' WHERE id = $1`, [listingId])
        return { ok: true as const, claim: claimIns.rows[0] }
      })

      if ('error' in result) {
        if (result.error === 'not_found') res.status(404).json({ error: 'Listing not found' })
        else if (result.error === 'self_claim') res.status(400).json({ error: 'You cannot claim your own listing' })
        else if (result.error === 'not_active') res.status(409).json({ error: 'Listing is not available' })
        return
      }

      broadcast({ type: 'listing:claimed', listing_id: listingId })
      res.json({ claim: result.claim, qr_token: result.claim.qr_token })
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err.code === '23505') {
        res.status(409).json({ error: 'Listing already claimed' })
        return
      }
      throw e
    }
  }),
)

listingsRouter.post(
  '/:id/confirm',
  requireAuth,
  requireRole('provider', 'admin'),
  asyncHandler(async (req, res) => {
    const idParse = z.string().uuid().safeParse(req.params.id)
    if (!idParse.success) {
      res.status(400).json({ error: 'Invalid listing id' })
      return
    }
    const listingId = idParse.data
    const body = z.object({ qr_token: z.string().min(10) }).safeParse(req.body)
    if (!body.success) {
      res.status(400).json({ error: 'Invalid body', details: body.error.flatten() })
      return
    }
    const u = (req as typeof req & { user: JwtUser }).user
    const token = body.data.qr_token

    const out = await withTransaction(async (client: PoolClient) => {
      const l = await client.query<{ id: string; provider_id: string; status: string }>(
        `SELECT id, provider_id, status FROM listings WHERE id = $1 FOR UPDATE`,
        [listingId],
      )
      const listing = l.rows[0]
      if (!listing) {
        return { error: 'not_found' as const }
      }
      if (listing.provider_id !== u.id && u.role !== 'admin') {
        return { error: 'forbidden' as const }
      }
      if (listing.status !== 'claimed') {
        return { error: 'bad_state' as const }
      }
      const upd = await client.query(
        `UPDATE claims
         SET status = 'confirmed', confirmed_at = now()
         WHERE listing_id = $1 AND qr_token = $2 AND status = 'pending'
         RETURNING id`,
        [listingId, token],
      )
      if (upd.rowCount === 0) {
        return { error: 'bad_token' as const }
      }
      await client.query(`UPDATE listings SET status = 'completed' WHERE id = $1`, [listingId])
      return { ok: true as const }
    })

    if ('error' in out) {
      if (out.error === 'not_found') res.status(404).json({ error: 'Listing not found' })
      else if (out.error === 'forbidden') res.status(403).json({ error: 'Forbidden' })
      else if (out.error === 'bad_state') res.status(409).json({ error: 'Listing must be claimed to confirm' })
      else if (out.error === 'bad_token') res.status(400).json({ error: 'Invalid or expired handoff token' })
      return
    }

    broadcast({ type: 'listing:completed', listing_id: listingId })
    res.json({ ok: true })
  }),
)
