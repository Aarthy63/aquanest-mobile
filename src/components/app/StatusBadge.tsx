import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  placed: "bg-secondary text-secondary-foreground",
  confirmed: "bg-secondary text-secondary-foreground",
  shipped: "bg-accent text-accent-foreground",
  "out-for-delivery": "bg-warning text-warning-foreground",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-destructive/15 text-destructive",
  requested: "bg-secondary text-secondary-foreground",
  "technician-assigned": "bg-accent text-accent-foreground",
  completed: "bg-success text-success-foreground",
  pending: "bg-warning text-warning-foreground",
  approved: "bg-success text-success-foreground",
  rejected: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", styles[status] ?? "bg-muted")}>
      {status.replace(/-/g, " ")}
    </span>
  );
}
