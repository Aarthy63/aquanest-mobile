import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { Check, CheckCircle2, MapPin, PackageX, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Screen, Section, EmptyState } from "@/components/app/Screen";
import { RequireLogin } from "@/components/app/RequireLogin";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Row } from "@/components/app/Row";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatINR } from "@/lib/catalog";
import { canCancel, orderStatus, useApp, type OrderStatus } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders/$id")({
  validateSearch: z.object({ placed: z.boolean().optional() }),
  head: ({ params }) => ({
    meta: [
      { title: `Order #${params.id} — AquaNest` },
      { name: "description", content: "Order details and live delivery tracking." },
      { property: "og:title", content: `Order #${params.id} — AquaNest` },
      { property: "og:description", content: "Order details and live delivery tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Screen title="Order details" back>
      <RequireLogin>
        <OrderDetail />
      </RequireLogin>
    </Screen>
  ),
});

const steps: { key: OrderStatus; label: string }[] = [
  { key: "placed", label: "Order placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "out-for-delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

function OrderDetail() {
  const { id } = Route.useParams();
  const { placed } = Route.useSearch();
  const order = useApp((s) => s.orders.find((o) => o.id === id));
  const cancelOrder = useApp((s) => s.cancelOrder);
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  if (!order)
    return <EmptyState icon={<PackageX className="size-8" />} title="Order not found" action={<Button asChild variant="outline"><Link to="/orders">My orders</Link></Button>} />;

  const status = orderStatus(order);
  const current = steps.findIndex((s) => s.key === status);

  return (
    <div className="pb-6">
      {placed && (
        <div className="m-4 flex items-center gap-3 rounded-2xl bg-success/15 p-4 text-success animate-rise">
          <CheckCircle2 className="size-8 shrink-0" />
          <div>
            <p className="font-semibold">Order placed successfully!</p>
            <p className="text-xs">Payment ref {order.paymentRef}</p>
          </div>
        </div>
      )}

      <Section>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">#{order.id}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "d MMM yyyy, h:mm a")}</p>
          </div>
          <StatusBadge status={status} />
        </div>
      </Section>

      <Section title="Tracking">
        {status === "cancelled" ? (
          <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">This order was cancelled. Any payment will be refunded in 5–7 working days.</p>
        ) : (
          <ol className="relative ml-3 space-y-5 border-l-2 border-border pl-6">
            {steps.map((s, i) => {
              const done = i <= current;
              return (
                <li key={s.key} className="relative">
                  <span className={cn("absolute -left-[33px] grid size-5 place-items-center rounded-full border-2", done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
                    {done && <Check className="size-3" />}
                  </span>
                  <p className={cn("text-sm font-semibold", !done && "text-muted-foreground")}>{s.label}</p>
                  {i === current && <p className="text-xs text-primary">Current status</p>}
                </li>
              );
            })}
          </ol>
        )}
      </Section>

      <Section title={`Items (${order.items.length})`}>
        <div className="space-y-2">
          {order.items.map((it) => (
            <Link key={it.productId} to="/product/$id" params={{ id: it.productId }} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2 text-sm">
              <img src={it.image} alt="" width={56} height={56} className="size-14 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-medium">{it.name}</p>
                <p className="text-xs text-muted-foreground">{it.qty} × {formatINR(it.unitPrice)}</p>
              </div>
              <p className="font-semibold">{formatINR(it.qty * it.unitPrice)}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Delivery address">
        <div className="flex gap-3 rounded-xl bg-muted/60 p-3 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">{order.address.name} · {order.address.phone}</p>
            <p className="text-muted-foreground">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city}, {order.address.state} – {order.address.pincode}</p>
          </div>
        </div>
      </Section>

      <Section title="Payment">
        <div className="space-y-2 rounded-xl border border-border p-3 text-sm">
          <Row label="Method" value={order.paymentMethod} />
          <Row label="Items" value={formatINR(order.subtotal)} />
          <Row label="Delivery" value={order.delivery ? formatINR(order.delivery) : "FREE"} />
          <Row label="Total paid" value={formatINR(order.total)} bold />
          <p className="flex items-center gap-1 pt-1 text-xs text-muted-foreground"><Receipt className="size-3" /> Ref {order.paymentRef}</p>
        </div>
      </Section>

      {canCancel(order) && (
        <Section>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full border-destructive/40 text-destructive">Cancel order</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[340px] rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                <AlertDialogDescription>Your payment of {formatINR(order.total)} will be refunded in 5–7 working days.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep order</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    cancelOrder(order.id);
                    toast("Order cancelled");
                  }}
                >
                  Yes, cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>
      )}
    </div>
  );
}
