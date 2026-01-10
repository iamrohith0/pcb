import Skeleton from "@/components/ui/skeleton";

export default function PageSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-12 gap-3">
        <Skeleton className="col-span-6 md:col-span-3 h-24" />
        <Skeleton className="col-span-6 md:col-span-3 h-24" />
        <Skeleton className="col-span-6 md:col-span-3 h-24" />
        <Skeleton className="col-span-6 md:col-span-3 h-24" />
      </div>

      {/* Filters skeleton */}
      <Skeleton className="h-16 w-full" />

      {/* List skeleton */}
      <div className="grid grid-cols-12 gap-3">
        <Skeleton className="col-span-12 xl:col-span-6 h-64" />
        <Skeleton className="col-span-12 xl:col-span-6 h-64" />
      </div>
    </div>
  );
}