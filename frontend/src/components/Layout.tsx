import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-all ${
      isActive
        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
    }`

  return (
    <div className="flex min-h-dvh flex-col bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="group flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-lg shadow-brand-600/30 transition-transform group-hover:scale-105"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3c-4 4-7 7.5-7 11a7 7 0 1014 0c0-3.5-3-7-7-11z"
                />
              </svg>
            </span>
            <div className="text-left leading-tight">
              <p className="font-serif text-lg font-semibold tracking-tight text-stone-900">FoodBridge</p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-brand-600">Share surplus · Feed locals</p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-1.5">
            {user && (
              <NavLink to="/map" className={linkClass}>
                Live map
              </NavLink>
            )}
            {(user?.role === 'provider' || user?.role === 'admin') && (
              <NavLink to="/donate" className={linkClass}>
                Donate
              </NavLink>
            )}
            {!user && (
              <NavLink
                to="/login"
                className="rounded-full bg-linear-to-r from-accent-500 to-amber-500 px-5 py-2 text-sm font-bold text-stone-900 shadow-md shadow-amber-500/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign in
              </NavLink>
            )}
            {user && (
              <>
                <span className="hidden max-w-[140px] truncate rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600 sm:inline">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
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
