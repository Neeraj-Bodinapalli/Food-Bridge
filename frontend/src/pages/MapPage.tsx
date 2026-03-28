import QRCode from 'react-qr-code'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'
import { useAuth } from '../auth/AuthContext'
import { FoodMap } from '../components/FoodMap'
import type { Listing } from '../types'

function mapsDir(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

type Impact = {
  kg_saved: number
  meals_served_estimate: number
  co2_offset_kg_estimate: number
  completed_listings: number
}

export function MapPage() {
  const { token, user } = useAuth()
  const [center, setCenter] = useState<[number, number]>([13.0827, 80.2707])
  const [listings, setListings] = useState<Listing[]>([])
  const [foodType, setFoodType] = useState<string>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Listing | null>(null)
  const [impact, setImpact] = useState<Impact | null>(null)
  const [handoffToken, setHandoffToken] = useState<string | null>(null)
  const [confirmInput, setConfirmInput] = useState('')
  const [panelError, setPanelError] = useState<string | null>(null)
  const [claimBusy, setClaimBusy] = useState(false)

  const loadNearby = useCallback(async () => {
    const q = new URLSearchParams({
      lat: String(center[0]),
      lng: String(center[1]),
      radius_km: '8',
    })
    if (foodType) q.set('food_type', foodType)
    const r = await apiFetch(`/api/listings/nearby?${q}`)
    if (!r.ok) return
    const j = (await r.json()) as { listings: Listing[] }
    setListings(j.listings ?? [])
  }, [center, foodType])

  const loadNearbyRef = useRef(loadNearby)
  loadNearbyRef.current = loadNearby

  const loadImpact = useCallback(async () => {
    const r = await apiFetch('/api/dashboard/impact')
    if (r.ok) {
      setImpact((await r.json()) as Impact)
    }
  }, [])

  useEffect(() => {
    void loadNearby()
  }, [loadNearby])

  useEffect(() => {
    void loadImpact()
  }, [loadImpact])

  useEffect(() => {
    const configured = import.meta.env.VITE_WS_URL as string | undefined
    const wsUrl =
      configured && configured.length > 0
        ? configured
        : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
    const ws = new WebSocket(wsUrl)
    ws.onmessage = () => {
      void loadNearbyRef.current()
      void loadImpact()
    }
    return () => ws.close()
  }, [loadImpact])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    setHandoffToken(null)
    setPanelError(null)
    setConfirmInput('')
    void (async () => {
      const r = await apiFetch(`/api/listings/${selectedId}`)
      if (!r.ok) {
        setDetail(null)
        return
      }
      const j = (await r.json()) as { listing: Listing }
      setDetail(j.listing)
    })()
  }, [selectedId])

  function handleSelect(id: string) {
    setSelectedId(id)
    const hit = listings.find((l) => l.id === id)
    if (hit) {
      setCenter([hit.lat, hit.lng])
    }
  }

  async function claim() {
    if (!token || !selectedId) return
    setClaimBusy(true)
    setPanelError(null)
    const r = await apiFetch(`/api/listings/${selectedId}/claim`, {
      method: 'PATCH',
      token,
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      setPanelError((data as { error?: string }).error ?? 'Claim failed')
      setClaimBusy(false)
      return
    }
    setHandoffToken((data as { qr_token: string }).qr_token)
    await loadNearby()
    const refresh = await apiFetch(`/api/listings/${selectedId}`)
    if (refresh.ok) {
      const j = (await refresh.json()) as { listing: Listing }
      setDetail(j.listing)
    }
    setClaimBusy(false)
  }

  async function confirmHandoff() {
    if (!token || !selectedId || !confirmInput.trim()) return
    setPanelError(null)
    const r = await apiFetch(`/api/listings/${selectedId}/confirm`, {
      method: 'POST',
      token,
      body: JSON.stringify({ qr_token: confirmInput.trim() }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      setPanelError((data as { error?: string }).error ?? 'Confirm failed')
      return
    }
    setConfirmInput('')
    await loadNearby()
    const refresh = await apiFetch(`/api/listings/${selectedId}`)
    if (refresh.ok) {
      const j = (await refresh.json()) as { listing: Listing }
      setDetail(j.listing)
    }
    await loadImpact()
  }

  const isOwner = Boolean(user && detail && user.id === detail.provider_id)
  const canClaim =
    Boolean(token && user && detail?.status === 'active') &&
    ['recipient', 'volunteer', 'admin'].includes(user?.role ?? '') &&
    !isOwner

  return (
    <main className="mx-auto grid max-w-6xl flex-1 gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        {impact && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-brand-100 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Food recovered</p>
              <p className="mt-1 text-2xl font-semibold text-brand-800">{impact.kg_saved.toFixed(1)} kg</p>
            </div>
            <div className="rounded-xl border border-brand-100 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Meals (est.)</p>
              <p className="mt-1 text-2xl font-semibold text-brand-800">{impact.meals_served_estimate}</p>
            </div>
            <div className="rounded-xl border border-brand-100 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Completed</p>
              <p className="mt-1 text-2xl font-semibold text-brand-800">{impact.completed_listings}</p>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-neutral-600">
            Filter
            <select
              className="ml-2 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-sm"
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
            >
              <option value="">All types</option>
              <option value="cooked">Cooked</option>
              <option value="packaged">Packaged</option>
              <option value="produce">Produce</option>
              <option value="bakery">Bakery</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void loadNearby()}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Refresh
          </button>
          <p className="text-xs text-neutral-500">
            Live updates via WebSocket (no FCM). Pan the map to search a new area.
          </p>
        </div>
        <FoodMap
          center={center}
          listings={listings}
          onSelect={handleSelect}
          reportMoves
          onMapCenter={(c) => setCenter(c)}
        />
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
        <h2 className="text-lg font-semibold text-neutral-900">Listing detail</h2>
        {!detail && <p className="text-sm text-neutral-600">Select a pin on the map.</p>}
        {detail && (
          <div className="space-y-3 text-sm">
            {detail.photo_url && (
              <img
                src={detail.photo_url}
                alt=""
                className="max-h-40 w-full rounded-lg object-cover"
              />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium capitalize text-brand-800">
                {detail.food_type}
              </span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                {detail.status}
              </span>
            </div>
            <p className="text-neutral-800">{detail.description}</p>
            <p className="text-xs text-neutral-500">
              Pickup {new Date(detail.pickup_window_start).toLocaleString()}–
              {new Date(detail.pickup_window_end).toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500">
              Expires {new Date(detail.expires_at).toLocaleString()}
            </p>
            {detail.provider_name && (
              <p className="text-xs text-neutral-500">Provider: {detail.provider_name}</p>
            )}
            {detail.allergen_flags.length > 0 && (
              <p className="text-xs text-amber-800">
                Allergens: {detail.allergen_flags.join(', ')}
              </p>
            )}
            {detail.safety_note && <p className="text-xs text-neutral-600">{detail.safety_note}</p>}
            <a
              href={mapsDir(detail.lat, detail.lng)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-medium text-brand-700 hover:underline"
            >
              Open directions (Google Maps)
            </a>

            {panelError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {panelError}
              </div>
            )}

            {canClaim && (
              <button
                type="button"
                disabled={claimBusy}
                onClick={() => void claim()}
                className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {claimBusy ? 'Claiming…' : 'Claim this listing'}
              </button>
            )}

            {!token && detail.status === 'active' && (
              <p className="text-xs text-neutral-600">
                <Link to="/login" className="font-medium text-brand-700 hover:underline">
                  Log in
                </Link>{' '}
                as a recipient to claim.
              </p>
            )}

            {handoffToken && (
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-center">
                <p className="text-xs font-medium text-brand-900">Show this QR to the provider</p>
                <div className="mt-3 flex justify-center">
                  <QRCode value={handoffToken} size={168} />
                </div>
                <p className="mt-2 break-all text-[10px] text-neutral-500">{handoffToken}</p>
              </div>
            )}

            {detail.status === 'claimed' && isOwner && (
              <div className="space-y-2 border-t border-neutral-100 pt-3">
                <p className="text-xs font-medium text-neutral-700">Confirm handoff</p>
                <p className="text-xs text-neutral-500">
                  Scan the recipient&apos;s QR or paste the token you see on their screen.
                </p>
                <input
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="Handoff token"
                />
                <button
                  type="button"
                  onClick={() => void confirmHandoff()}
                  className="w-full rounded-xl border border-brand-600 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                >
                  Confirm pickup
                </button>
              </div>
            )}

            {detail.status === 'claimed' && !isOwner && (
              <p className="text-xs text-neutral-600">This listing is claimed and awaiting confirmation.</p>
            )}

            {detail.status === 'completed' && (
              <p className="text-xs font-medium text-brand-800">Pickup completed — impact counters updated.</p>
            )}
          </div>
        )}
      </aside>
    </main>
  )
}
