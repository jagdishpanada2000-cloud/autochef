export function RestaurantCardSkeleton() {
  return (
    <article className="glass-card overflow-hidden">
      <div className="h-44 shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 shimmer rounded" />
        <div className="h-4 w-full shimmer rounded" />
        <div className="h-3 w-1/2 shimmer rounded" />
        <div className="flex gap-2">
          <div className="h-5 w-16 shimmer rounded-full" />
          <div className="h-5 w-16 shimmer rounded-full" />
        </div>
      </div>
    </article>
  );
}
