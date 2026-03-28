import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(phone, password)
      navigate('/map', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] flex-1">
      <div
        className="hidden w-2/5 bg-linear-to-br from-brand-600 via-brand-700 to-teal-800 lg:flex lg:flex-col lg:justify-end lg:p-12"
        aria-hidden
      >
        <p className="font-serif text-3xl font-semibold leading-tight text-white">Welcome back.</p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-emerald-100/90">
          Pick up where you left off—browse the live map and claim surplus food near you.
        </p>
      </div>
      <main className="flex flex-1 items-center justify-center px-4 py-12 lg:w-3/5 lg:py-16">
        <div className="fb-card w-full max-w-md border-0 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)]">
          <h1 className="font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">Log in</h1>
          <p className="mt-2 text-sm text-stone-500">
            Demo: <code className="rounded-md bg-stone-100 px-1.5 py-0.5 text-xs font-semibold text-stone-700">+919876543211</code>{' '}
            · see README for password
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                {error}
              </div>
            )}
            <div>
              <label className="fb-label" htmlFor="phone">
                Phone
              </label>
              <input id="phone" className="fb-input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required />
            </div>
            <div>
              <label className="fb-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="fb-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={busy} className="fb-btn-primary w-full py-3.5">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-stone-500">
            No account?{' '}
            <Link to="/register" className="font-bold text-brand-700 hover:text-brand-800 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
