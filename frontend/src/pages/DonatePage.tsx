import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { apiFetch } from '../api'
import { useAuth } from '../auth/AuthContext'

const FOOD_TYPES = ['cooked', 'packaged', 'produce', 'bakery'] as const

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function DonatePage() {
  const { token, user } = useAuth()
  const [foodType, setFoodType] = useState<(typeof FOOD_TYPES)[number]>('cooked')
  const [description, setDescription] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [quantityKg, setQuantityKg] = useState('5')
  const [servings, setServings] = useState('10')
  const now = new Date()
  const [pickupStart, setPickupStart] = useState(toLocalInput(new Date(now.getTime() + 45 * 60 * 1000)))
  const [pickupEnd, setPickupEnd] = useState(toLocalInput(new Date(now.getTime() + 4 * 60 * 60 * 1000)))
  const [expiresAt, setExpiresAt] = useState(toLocalInput(new Date(now.getTime() + 8 * 60 * 60 * 1000)))
  const [lat, setLat] = useState('13.0827')
  const [lng, setLng] = useState('80.2707')
  const [allergens, setAllergens] = useState('')
  const [safetyNote, setSafetyNote] = useState('Cooked today; maintain chill chain if applicable.')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }
  if (user.role !== 'provider' && user.role !== 'admin') {
    return (
      <main className="mx-auto max-w-lg flex-1 px-4 py-12">
        <p className="text-neutral-700">Only providers can post food. Switch account or register as a provider.</p>
        <Link to="/register" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">
          Register
        </Link>
      </main>
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    const allergen_flags = allergens
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const body = {
      food_type: foodType,
      description,
      photo_url: photoUrl.trim() || null,
      quantity_kg: quantityKg ? Number(quantityKg) : null,
      servings_est: servings ? Number(servings) : null,
      pickup_window_start: new Date(pickupStart).toISOString(),
      pickup_window_end: new Date(pickupEnd).toISOString(),
      expires_at: new Date(expiresAt).toISOString(),
      lat: Number(lat),
      lng: Number(lng),
      allergen_flags,
      safety_note: safetyNote,
    }
    const r = await apiFetch('/api/listings', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      setMessage((data as { error?: string }).error ?? 'Could not create listing')
      setBusy(false)
      return
    }
    setMessage('Listing published. Recipients on the map will see it shortly.')
    setBusy(false)
  }

  return (
    <main className="mx-auto max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900">Donate food</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Photos: paste an image URL or leave blank — MVP uses placeholders only (no Cloudinary).
      </p>
      <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
        {message && (
          <div className="sm:col-span-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900">
            {message}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-neutral-700">Food type</label>
          <select
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            value={foodType}
            onChange={(e) => setFoodType(e.target.value as (typeof FOOD_TYPES)[number])}
          >
            {FOOD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Optional image URL</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="https://picsum.photos/seed/myfood/480/360"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-neutral-700">Description</label>
          <textarea
            className="mt-1 min-h-[88px] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Quantity (kg)</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            type="number"
            step="0.1"
            min="0"
            value={quantityKg}
            onChange={(e) => setQuantityKg(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Servings (est.)</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            type="number"
            min="1"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Pickup start</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            type="datetime-local"
            value={pickupStart}
            onChange={(e) => setPickupStart(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Pickup end</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            type="datetime-local"
            value={pickupEnd}
            onChange={(e) => setPickupEnd(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Listing expires</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Allergens (comma separated)</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            value={allergens}
            onChange={(e) => setAllergens(e.target.value)}
            placeholder="dairy, gluten"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Latitude</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Longitude</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-neutral-700">Safety note</label>
          <textarea
            className="mt-1 min-h-[72px] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            value={safetyNote}
            onChange={(e) => setSafetyNote(e.target.value)}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? 'Publishing…' : 'Publish listing'}
          </button>
        </div>
      </form>
    </main>
  )
}
