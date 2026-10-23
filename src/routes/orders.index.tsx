import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Package } from "lucide-react";
import { format } from "date-fns";
import { Screen, EmptyState } from "@/components/app/Screen";
import { RequireLogin } from "@/components/app/RequireLogin";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/catalog";
import { orderStatus, useApp } from "@/store/app-store";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "My Orders — AquaNest" },
      { name: "description", content: "View your order history and track deliveries." },
      { property: "og:title", content: "My Orders — AquaNest" },
      { property: "og:description", content: "View your order history and track deliveries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Screen title="My orders" back>
      <RequireLogin message="Sign in to see your orders">
        <Orders />
      </RequireLogin>
    </Screen>
  ),
});

function Orders() {
  const orders = useApp((s) => s.orders);
  if (orders.length === 0)
    return (
      <EmptyState
        icon={<Package className="size-8" />}
        title="No orders yet"
        body="Your orders and their tracking will appear here."
        action={<Button asChild variant="hero" size="lg"><Link to="/shop">Start shopping</Link></Button>}
      />
    );
  return (
    <div className="space-y-3 p-4">
      {orders.map((o) => (
        <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="block rounded-2xl border border-border bg-card p-3 shadow-soft animate-rise">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">#{o.id} · {format(new Date(o.createdAt), "d MMM yyyy")}</p>
            <StatusBadge status={orderStatus(o)} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex -space-x-3">
              {o.items.slice(0, 3).map((it) => (
                <img key={it.productId} src={it.image} alt="" width={48} height={48} className="size-12 rounded-xl border-2 border-card object-cover" />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-semibold">{o.items[0].name}{o.items.length > 1 ? ` +${o.items.length - 1} more` : ""}</p>
              <p className="text-sm font-bold">{formatINR(o.total)} {o.isDealerOrder && <span className="ml-1 text-[10px] font-semibold text-primary">DEALER</span>}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  );
}
