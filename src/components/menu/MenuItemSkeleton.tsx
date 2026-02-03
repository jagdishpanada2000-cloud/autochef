export function MenuItemSkeleton() {
  return (
    <div className="glass-card p-4 flex gap-4">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-4 shimmer rounded" />
        <div className="h-5 w-3/4 shimmer rounded" />
        <div className="h-4 w-16 shimmer rounded" />
        <div className="h-3 w-full shimmer rounded" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-24 h-24 shimmer rounded-lg" />
        <div className="h-8 w-16 shimmer rounded-lg" />
      </div>
    </div>
  );
}
