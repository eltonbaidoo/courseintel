function Pulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-almond-cream-100 ${className ?? ""}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <Pulse className="h-4 w-2/3" />
      <Pulse className="h-3 w-1/2" />
      <Pulse className="h-2 w-full mt-4" />
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="card p-6 text-center space-y-2">
      <Pulse className="h-12 w-24 mx-auto" />
      <Pulse className="h-5 w-16 mx-auto" />
    </div>
  );
}

export function SkeletonTable({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Pulse className="h-3 flex-1" />
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}
