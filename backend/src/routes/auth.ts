import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../asyncHandler.js'
import {
  findUserByPhoneHash,
  hashPassword,
  hashPhone,
  requireAuth,
  signToken,
  verifyPassword,
  type JwtUser,
} from '../auth.js'
import { query } from '../db.js'

const registerSchema = z.object({
  role: z.enum(['provider', 'recipient', 'volunteer', 'admin']),
  name: z.string().min(1).max(200),
  phone: z.string().min(8).max(32),
  password: z.string().min(8).max(128),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
})

const loginSchema = z.object({
  phone: z.string().min(8).max(32),
  password: z.string().min(1).max(128),
})

export const authRouter = Router()

authRouter.post('/register', asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
    return
  }
  const { role, name, phone, password, lat, lng } = parsed.data
  const phoneHash = hashPhone(phone)
  const existing = await findUserByPhoneHash(phoneHash)
  if (existing) {
    res.status(409).json({ error: 'Phone already registered' })
    return
  }
  const passwordHash = await hashPassword(password)
  let result
  if (lat !== undefined && lng !== undefined) {
    result = await query<{ id: string; role: string; name: string; created_at: string }>(
      `INSERT INTO users (role, name, phone_hash, password_hash, location)
       VALUES ($1::user_role, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography)
       RETURNING id, role, name, created_at`,
      [role, name, phoneHash, passwordHash, lng, lat],
    )
  } else {
    result = await query<{ id: string; role: string; name: string; created_at: string }>(
      `INSERT INTO users (role, name, phone_hash, password_hash)
       VALUES ($1::user_role, $2, $3, $4)
       RETURNING id, role, name, created_at`,
      [role, name, phoneHash, passwordHash],
    )
  }
  const user = result.rows[0]
  const token = signToken({ id: user.id, role: user.role })
  res.status(201).json({ user, token })
}))

authRouter.post('/login', asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
    return
  }
  const { phone, password } = parsed.data
  const phoneHash = hashPhone(phone)
  const row = await findUserByPhoneHash(phoneHash)
  if (!row) {
    res.status(401).json({ error: 'Invalid phone or password' })
    return
  }
  const ok = await verifyPassword(password, row.password_hash)
  if (!ok) {
    res.status(401).json({ error: 'Invalid phone or password' })
    return
  }
  const token = signToken({ id: row.id, role: row.role })
  res.json({
    user: { id: row.id, role: row.role, name: row.name },
    token,
  })
}))

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const u = (req as typeof req & { user: JwtUser }).user
  const r = await query<{ id: string; role: string; name: string; rating_avg: string; created_at: string }>(
    `SELECT id, role, name, rating_avg, created_at FROM users WHERE id = $1`,
    [u.id],
  )
  const user = r.rows[0]
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({ user })
}))
