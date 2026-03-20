export default function StudyLoading() {
  return (
    <div className="space-y-8">
      <section className="panel-surface overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <div className="h-3 w-28 rounded-full bg-white/8" />
            <div className="h-10 w-52 rounded-full bg-white/10" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-[1.4rem] p-4" style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}>
                <div className="study-loading-shimmer h-20 rounded-[1rem]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="panel-surface rounded-[1.75rem] p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-8 w-24 rounded-full bg-white/8" />
              <div className="h-6 w-14 rounded-full bg-white/8" />
            </div>
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="study-loading-shimmer h-10 rounded-xl" />
              ))}
            </div>
          </div>
        </aside>

        <section className="panel-surface rounded-[1.9rem] p-6 sm:p-8">
          <div className="study-loading-pulse flex items-center gap-3 text-sm text-[var(--color-muted)]">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-gold)]" />
            <span>Loading...</span>
          </div>
          <div className="mt-6 space-y-4">
            <div className="study-loading-shimmer h-10 w-72 rounded-full" />
            <div className="study-loading-shimmer h-5 w-full rounded-full" />
            <div className="study-loading-shimmer h-5 w-[92%] rounded-full" />
            <div className="study-loading-shimmer h-5 w-[88%] rounded-full" />
            <div className="study-loading-shimmer h-64 w-full rounded-[1.4rem]" />
          </div>
        </section>
      </div>
    </div>
  );
}

