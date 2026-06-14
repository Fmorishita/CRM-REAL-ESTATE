import { Badge } from "@/components/ui/badge";
import { statusLabel, statusTone } from "@/config/properties";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusTone(status))}>
      {statusLabel(status)}
    </Badge>
  );
}
