import { Skeleton } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex h-[calc(100dvh-15rem)] min-h-[440px] overflow-hidden rounded-xl border border-border bg-card sm:h-[calc(100dvh-13rem)] lg:h-[calc(100dvh-12rem)] lg:min-h-[520px]">
        <div className="flex w-full flex-col gap-4 border-r border-border p-3 lg:w-80 lg:shrink-0">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden flex-1 items-center justify-center lg:flex">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
}
