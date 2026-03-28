import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Live map',
    desc: 'See surplus food near you with pickup windows and safety notes.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    title: 'Instant updates',
    desc: 'New listings push over WebSocket so the map stays fresh.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Trusted handoff',
    desc: 'Claim with one tap, show a QR code, and confirm pickup with the provider.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
]

export function HomePage() {
  return (
    <>
      <main className="relative flex-1 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.18),transparent)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-32 top-40 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-24 bottom-20 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
          <div className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-brand-700 via-brand-600 to-teal-600 p-8 shadow-2xl shadow-brand-900/20 sm:p-12 md:p-16">
            <div
              className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-90"
              aria-hidden
            />
            <div className="relative z-10 max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-100/90">Real-time · Chennai-ready</p>
              <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl">
                Turn surplus food into shared meals,{' '}
                <span className="text-amber-200">in minutes.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-emerald-50/95 sm:text-lg">
                List what you have, notify nearby recipients instantly, and complete pickups with a simple QR handoff—built
                for hackathon demos and real community impact.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/map"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-brand-800 shadow-xl shadow-black/10 transition-all hover:bg-stone-50 hover:shadow-2xl active:scale-[0.98]"
                >
                  Explore live map
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center rounded-xl border-2 border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
                  Join FoodBridge
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 hover:border-brand-200/60 hover:shadow-[0_12px_40px_-12px_rgba(5,150,105,0.2)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-stone-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 px-6 py-8 text-center sm:px-10">
            <p className="font-serif text-xl font-semibold text-brand-900 sm:text-2xl">Ready when you are</p>
            <p className="mx-auto mt-2 max-w-lg text-sm text-stone-600">
              Providers post in under a minute. Recipients browse the map, claim, and meet with directions in one flow.
            </p>
            <Link
              to="/map"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800"
            >
              Open the map
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </main>
      <footer className="border-t border-stone-200 bg-white py-8 text-center">
        <p className="text-xs font-medium text-stone-400">FoodBridge · Vercel · Railway · Supabase</p>
      </footer>
    </>
  )
}
