export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="h-8 w-48 animate-pulse rounded bg-navy-100" />
      <div className="mt-6 h-11 animate-pulse rounded-lg bg-navy-100" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl bg-white ring-1 ring-navy-100">
            <div className="h-36 animate-pulse bg-navy-100" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-navy-100" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-navy-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
