import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-100 text-brand-900' : 'text-neutral-600 hover:bg-brand-50 hover:text-brand-900'}`

  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-b from-brand-50 to-white text-neutral-900">
      <header className="border-b border-brand-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white"
              aria-hidden
            >
              FB
            </span>
            <div className="text-left leading-tight">
              <p className="text-base font-semibold tracking-tight">FoodBridge</p>
              <p className="text-xs text-neutral-500">Chennai demo · local surplus</p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/map" className={linkClass}>
              Map
            </NavLink>
            {(user?.role === 'provider' || user?.role === 'admin') && (
              <NavLink to="/donate" className={linkClass}>
                Donate
              </NavLink>
            )}
            {!user && (
              <>
                <NavLink to="/login" className={linkClass}>
                  Log in
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                >
                  Sign up
                </NavLink>
              </>
            )}
            {user && (
              <>
                <span className="hidden px-2 text-xs text-neutral-500 sm:inline">
                  {user.name} · {user.role}
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  Log out
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
