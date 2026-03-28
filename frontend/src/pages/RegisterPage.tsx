import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<'provider' | 'recipient' | 'volunteer'>('recipient')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await register({
        role,
        name,
        phone,
        password,
        lat: 13.0827,
        lng: 80.2707,
      })
      navigate('/map', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] flex-1">
      <div
        className="hidden w-2/5 bg-linear-to-br from-amber-400 via-orange-400 to-brand-600 lg:flex lg:flex-col lg:justify-end lg:p-12"
        aria-hidden
      >
        <p className="font-serif text-3xl font-semibold leading-tight text-stone-900">Join the bridge.</p>
        <p className="mt-3 max-w-sm text-sm font-medium leading-relaxed text-stone-800/80">
          Providers list surplus in seconds. Recipients find meals on the map. Everyone wins.
        </p>
      </div>
      <main className="flex flex-1 items-center justify-center px-4 py-12 lg:w-3/5 lg:py-16">
        <div className="fb-card w-full max-w-md border-0 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)]">
          <h1 className="font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">Create account</h1>
          <p className="mt-2 text-sm text-stone-500">Map defaults to Chennai centre for nearby listings.</p>
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                {error}
              </div>
            )}
            <div>
              <label className="fb-label" htmlFor="role">
                I am a
              </label>
              <select
                id="role"
                className="fb-input"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
              >
                <option value="recipient">Recipient</option>
                <option value="provider">Provider</option>
                <option value="volunteer">Volunteer</option>
              </select>
            </div>
            <div>
              <label className="fb-label" htmlFor="name">
                Name
              </label>
              <input id="name" className="fb-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="fb-label" htmlFor="rphone">
                Phone
              </label>
              <input
                id="rphone"
                className="fb-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                required
              />
            </div>
            <div>
              <label className="fb-label" htmlFor="rpass">
                Password (min 8)
              </label>
              <input
                id="rpass"
                type="password"
                className="fb-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <button type="submit" disabled={busy} className="fb-btn-primary w-full py-3.5">
              {busy ? 'Creating…' : 'Create account'}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-stone-500">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-brand-700 hover:text-brand-800 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
