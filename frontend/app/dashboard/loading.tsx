import { SkeletonCard } from "@/components/ui/LoadingSkeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-honeydew-100" />
        <div className="h-4 w-24 animate-pulse rounded bg-honeydew-100 mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
