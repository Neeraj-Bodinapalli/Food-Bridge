import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, getWebSocketUrl } from '../api'
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

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent: 'emerald' | 'amber' | 'teal'
}) {
  const rings = {
    emerald: 'from-brand-400/20 to-brand-600/5 ring-brand-200/60',
    amber: 'from-amber-400/20 to-amber-500/5 ring-amber-200/60',
    teal: 'from-teal-400/20 to-teal-600/5 ring-teal-200/60',
  }
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-linear-to-br p-5 ring-1 ${rings[accent]} shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]`}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-stone-500">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-stone-500">{sub}</p>}
    </div>
  )
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
    const wsUrl = getWebSocketUrl()
    const ws = new WebSocket(wsUrl)
    ws.onmessage = () => {
      void loadNearbyRef.current()
      void loadImpact()
    }
    ws.onerror = () => {
      /* dev: ignore noisy proxy resets */
    }
    return () => {
      try {
        ws.close()
      } catch {
        /* ignore */
      }
    }
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
    try {
      const r = await apiFetch(`/api/listings/${selectedId}/claim`, {
        method: 'PATCH',
        token,
      })
      const data = (await r.json().catch(() => ({}))) as { qr_token?: unknown; error?: string }
      if (!r.ok) {
        setPanelError(data.error ?? 'Claim failed')
        return
      }
      const qr =
        typeof data.qr_token === 'string' && data.qr_token.length > 0 ? data.qr_token : null
      if (!qr) {
        setPanelError('Invalid response from server (missing token).')
        return
      }
      setHandoffToken(qr)
      await loadNearby()
      const refresh = await apiFetch(`/api/listings/${selectedId}`)
      if (refresh.ok) {
        const j = (await refresh.json()) as { listing: Listing }
        setDetail(j.listing)
      }
    } catch {
      setPanelError('Network error — is the API running on port 4000?')
    } finally {
      setClaimBusy(false)
    }
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
    <main className="relative flex-1">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(16,185,129,0.08),transparent)]" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Live feed</p>
            <h1 className="font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">Nearby surplus</h1>
            <p className="mt-1 text-sm text-stone-500">Pan the map to search. Updates stream over WebSocket.</p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            Live
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-5">
            {impact && (
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Food recovered"
                  value={`${impact.kg_saved.toFixed(1)} kg`}
                  sub="Completed pickups"
                  accent="emerald"
                />
                <StatCard
                  label="Meals (est.)"
                  value={String(impact.meals_served_estimate)}
                  sub="Rough equivalent"
                  accent="amber"
                />
                <StatCard
                  label="Handoffs"
                  value={String(impact.completed_listings)}
                  sub="Total completed"
                  accent="teal"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
              <label className="flex items-center gap-2 text-sm font-semibold text-stone-600">
                <span className="text-xs uppercase tracking-wide text-stone-400">Type</span>
                <select
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  value={foodType}
                  onChange={(e) => setFoodType(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="cooked">Cooked</option>
                  <option value="packaged">Packaged</option>
                  <option value="produce">Produce</option>
                  <option value="bakery">Bakery</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => void loadNearby()}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50/50"
              >
                Refresh
              </button>
            </div>

            <FoodMap
              center={center}
              listings={listings}
              onSelect={handleSelect}
              reportMoves
              onMapCenter={(c) => setCenter(c)}
            />
          </div>

          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            <div className="fb-card border-stone-200/60 p-0 overflow-hidden">
              <div className="border-b border-stone-100 bg-linear-to-r from-brand-50/80 to-white px-5 py-4">
                <h2 className="font-serif text-lg font-semibold text-stone-900">Listing detail</h2>
                <p className="text-xs text-stone-500">Tap a map pin to preview</p>
              </div>
              <div className="p-5">
                {!detail && (
                  <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/80 py-12 text-center text-sm text-stone-500">
                    Select a pin on the map
                  </div>
                )}
                {detail && (
                  <div className="space-y-4 text-sm">
                    {detail.photo_url && (
                      <div className="overflow-hidden rounded-xl ring-1 ring-stone-200/80 shadow-md">
                        <img src={detail.photo_url} alt="" className="aspect-video w-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold capitalize text-brand-800">
                        {detail.food_type}
                      </span>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold capitalize text-stone-600">
                        {detail.status}
                      </span>
                    </div>
                    <p className="leading-relaxed text-stone-800">{detail.description}</p>
                    <div className="space-y-1 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-600">
                      <p>
                        <span className="font-semibold text-stone-700">Pickup</span>{' '}
                        {new Date(detail.pickup_window_start).toLocaleString()} –{' '}
                        {new Date(detail.pickup_window_end).toLocaleString()}
                      </p>
                      <p>
                        <span className="font-semibold text-stone-700">Expires</span>{' '}
                        {new Date(detail.expires_at).toLocaleString()}
                      </p>
                      {detail.provider_name && (
                        <p>
                          <span className="font-semibold text-stone-700">Provider</span> {detail.provider_name}
                        </p>
                      )}
                    </div>
                    {detail.allergen_flags.length > 0 && (
                      <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                        Allergens: {detail.allergen_flags.join(', ')}
                      </p>
                    )}
                    {detail.safety_note && (
                      <p className="text-xs leading-relaxed text-stone-600">{detail.safety_note}</p>
                    )}
                    <a
                      href={mapsDir(detail.lat, detail.lng)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-800"
                    >
                      Directions in Google Maps →
                    </a>

                    {panelError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
                        {panelError}
                      </div>
                    )}

                    {canClaim && (
                      <button
                        type="button"
                        disabled={claimBusy}
                        onClick={() => void claim()}
                        className="fb-btn-primary w-full py-3"
                      >
                        {claimBusy ? 'Claiming…' : 'Claim this listing'}
                      </button>
                    )}

                    {!token && detail.status === 'active' && (
                      <p className="text-center text-xs text-stone-500">
                        <Link to="/login" className="font-bold text-brand-700 hover:underline">
                          Log in
                        </Link>{' '}
                        as a recipient to claim.
                      </p>
                    )}

                    {handoffToken != null && handoffToken.length > 0 && (
                      <div className="rounded-2xl border border-brand-200 bg-linear-to-b from-brand-50 to-white p-4 text-center shadow-inner">
                        <p className="text-xs font-bold uppercase tracking-wide text-brand-800">Show to provider</p>
                        <div className="mt-4 flex justify-center rounded-xl bg-white p-3 shadow-sm ring-1 ring-stone-100">
                          <QRCodeSVG value={handoffToken} size={168} fgColor="#065f46" bgColor="#ffffff" />
                        </div>
                        <p className="mt-3 break-all font-mono text-[10px] text-stone-400">{handoffToken}</p>
                      </div>
                    )}

                    {detail.status === 'claimed' && isOwner && (
                      <div className="space-y-3 border-t border-stone-100 pt-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Confirm handoff</p>
                        <p className="text-xs text-stone-500">Paste the token from the recipient&apos;s screen.</p>
                        <input
                          className="fb-input font-mono text-xs"
                          value={confirmInput}
                          onChange={(e) => setConfirmInput(e.target.value)}
                          placeholder="Handoff token"
                        />
                        <button
                          type="button"
                          onClick={() => void confirmHandoff()}
                          className="fb-btn-secondary w-full border-brand-300 py-3 font-bold text-brand-800 hover:bg-brand-50"
                        >
                          Confirm pickup
                        </button>
                      </div>
                    )}

                    {detail.status === 'claimed' && !isOwner && (
                      <p className="text-xs text-stone-500">Claimed — awaiting provider confirmation.</p>
                    )}

                    {detail.status === 'completed' && (
                      <p className="rounded-lg bg-brand-100 px-3 py-2 text-xs font-bold text-brand-900">
                        Completed — impact updated.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
