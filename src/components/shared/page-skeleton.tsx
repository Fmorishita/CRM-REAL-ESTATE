import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic route skeleton shown by Next while a server page streams in, so a
 * click gives instant feedback instead of a blank wait. `cards` renders a top
 * stat row; `rows` renders the main list/table placeholder.
 */
export function PageSkeleton({ rows = 6, cards = 0 }: { rows?: number; cards?: number }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {cards > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: cards }).map((_, i) => (
            <Card key={i}>
              <div className="space-y-2 p-5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            </Card>
          ))}
        </div>
      ) : null}
      <Card>
        <div className="space-y-3 p-5">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
