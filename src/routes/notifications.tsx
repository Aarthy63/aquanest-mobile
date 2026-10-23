import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Package, Store, Tag, Wrench } from "lucide-react";
import { Screen, EmptyState } from "@/components/app/Screen";
import { RequireLogin } from "@/components/app/RequireLogin";
import { useApp, type AppNotification } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — AquaNest" },
      { name: "description", content: "Order, service and dealer updates." },
      { property: "og:title", content: "Notifications — AquaNest" },
      { property: "og:description", content: "Order, service and dealer updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Screen title="Notifications" back>
      <RequireLogin>
        <Notifications />
      </RequireLogin>
    </Screen>
  ),
});

const icons: Record<AppNotification["kind"], typeof Bell> = { order: Package, service: Wrench, dealer: Store, offer: Tag };

function Notifications() {
  const items = useApp((s) => s.notifications);
  const markAllRead = useApp((s) => s.markAllRead);
  useEffect(() => {
    const t = setTimeout(markAllRead, 1500);
    return () => clearTimeout(t);
  }, [markAllRead]);

  if (items.length === 0) return <EmptyState icon={<Bell className="size-8" />} title="You're all caught up" body="Order and service updates will show up here." />;
  return (
    <ul className="divide-y divide-border">
      {items.map((n) => {
        const Icon = icons[n.kind];
        return (
          <li key={n.id} className={cn("flex gap-3 px-4 py-4", !n.read && "bg-secondary/60")}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-primary shadow-soft">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
            </div>
            {!n.read && <span className="mt-1.5 size-2 rounded-full bg-primary" />}
          </li>
        );
      })}
    </ul>
  );
}
