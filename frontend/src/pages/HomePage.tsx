import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <>
      <main className="mx-auto max-w-5xl flex-1 px-4 py-12 text-center sm:py-16 sm:text-left">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
          Real-time redistribution
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Post surplus food in minutes. Nearby recipients get notified over WebSocket.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-neutral-600 sm:mx-0">
          FoodBridge connects providers with people and organisations who can use extra food. MVP
          uses optional image URLs (no Cloudinary), in-memory WebSocket fan-out (no Redis or FCM),
          and Chennai seed data for judges.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
          <Link
            to="/map"
            className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
          >
            Browse nearby
          </Link>
          <Link
            to="/register"
            className="rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 hover:border-brand-200 hover:bg-brand-50"
          >
            Create an account
          </Link>
        </div>
      </main>
      <footer className="border-t border-neutral-100 py-6 text-center text-xs text-neutral-500">
        Deploy targets: Vercel · Railway · Supabase (PostgreSQL)
      </footer>
    </>
  )
}
