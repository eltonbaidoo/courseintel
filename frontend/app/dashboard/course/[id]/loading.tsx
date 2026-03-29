import { SkeletonCard, SkeletonHero } from "@/components/ui/LoadingSkeleton";

export default function CourseLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-4 w-32 animate-pulse rounded bg-almond-cream-100" />
        <div className="h-8 w-48 animate-pulse rounded-lg bg-almond-cream-100 mt-2" />
      </div>
      <SkeletonHero />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
