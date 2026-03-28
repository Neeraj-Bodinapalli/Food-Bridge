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
      <main className="mx-auto max-w-lg flex-1 px-4 py-16 text-center">
        <div className="fb-card">
          <p className="text-stone-700">Only providers can post food.</p>
          <Link to="/register" className="mt-4 inline-block text-sm font-bold text-brand-700 hover:underline">
            Register as provider
          </Link>
        </div>
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
    <main className="mx-auto max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Provider</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">Donate food</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-500">
          Add a photo URL or skip it—listings go live on the map with WebSocket updates.
        </p>
      </div>
      <div className="fb-card">
        <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
          {message && (
            <div
              className={`sm:col-span-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                message.includes('published')
                  ? 'border-brand-200 bg-brand-50 text-brand-900'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {message}
            </div>
          )}
          <div>
            <label className="fb-label">Food type</label>
            <select
              className="fb-input"
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
            <label className="fb-label">Image URL (optional)</label>
            <input
              className="fb-input"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://picsum.photos/seed/myfood/480/360"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="fb-label">Description</label>
            <textarea
              className="fb-input min-h-[100px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="fb-label">Quantity (kg)</label>
            <input
              className="fb-input"
              type="number"
              step="0.1"
              min="0"
              value={quantityKg}
              onChange={(e) => setQuantityKg(e.target.value)}
            />
          </div>
          <div>
            <label className="fb-label">Servings (est.)</label>
            <input
              className="fb-input"
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>
          <div>
            <label className="fb-label">Pickup start</label>
            <input
              className="fb-input"
              type="datetime-local"
              value={pickupStart}
              onChange={(e) => setPickupStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="fb-label">Pickup end</label>
            <input
              className="fb-input"
              type="datetime-local"
              value={pickupEnd}
              onChange={(e) => setPickupEnd(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="fb-label">Listing expires</label>
            <input
              className="fb-input"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="fb-label">Allergens (comma)</label>
            <input
              className="fb-input"
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              placeholder="dairy, gluten"
            />
          </div>
          <div>
            <label className="fb-label">Latitude</label>
            <input className="fb-input" value={lat} onChange={(e) => setLat(e.target.value)} required />
          </div>
          <div>
            <label className="fb-label">Longitude</label>
            <input className="fb-input" value={lng} onChange={(e) => setLng(e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <label className="fb-label">Safety note</label>
            <textarea
              className="fb-input min-h-[80px]"
              value={safetyNote}
              onChange={(e) => setSafetyNote(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2 pt-2">
            <button type="submit" disabled={busy} className="fb-btn-primary px-8 py-3.5">
              {busy ? 'Publishing…' : 'Publish listing'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
