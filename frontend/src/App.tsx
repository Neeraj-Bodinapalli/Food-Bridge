function App() {
  return (
    <div className="min-h-dvh bg-linear-to-b from-brand-50 to-white text-neutral-900">
      <header className="border-b border-brand-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white"
              aria-hidden
            >
              FB
            </span>
            <div className="text-left">
              <p className="text-base font-semibold tracking-tight">FoodBridge</p>
              <p className="text-xs text-neutral-500">Surplus food, shared locally</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm font-medium">
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-neutral-600 hover:bg-brand-50 hover:text-brand-900"
            >
              Map
            </button>
            <button
              type="button"
              className="rounded-lg bg-brand-600 px-4 py-2 text-white shadow-sm hover:bg-brand-700"
            >
              Donate food
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 text-center sm:py-16 sm:text-left">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
          Real-time redistribution
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Post surplus food in minutes. Nearby recipients get notified instantly.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-neutral-600 sm:mx-0">
          FoodBridge connects restaurants, households, and stores with people and organisations
          who can use extra food—maps, claims, and verified handoffs in one flow.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
          <button
            type="button"
            className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
          >
            Browse nearby
          </button>
          <button
            type="button"
            className="rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 hover:border-brand-200 hover:bg-brand-50"
          >
            I&apos;m a provider
          </button>
        </div>
      </main>

      <footer className="mt-auto border-t border-neutral-100 py-6 text-center text-xs text-neutral-500">
        FoodBridge · Hackathon build · API status wired in next step
      </footer>
    </div>
  )
}

export default App
