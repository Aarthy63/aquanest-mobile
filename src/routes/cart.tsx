import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Trash2, AlertTriangle, Truck } from "lucide-react";
import { Screen, EmptyState } from "@/components/app/Screen";
import { PageSkeleton } from "@/components/app/RequireLogin";
import { useDealerPricing } from "@/components/app/ProductCard";
import { QtyStepper } from "@/components/app/QtyStepper";
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
import { formatINR, getProduct } from "@/lib/catalog";
import { cartTotals, FREE_DELIVERY_THRESHOLD, moqShortfalls, unitPrice } from "@/lib/pricing";
import { useApp } from "@/store/app-store";
import { Row } from "@/components/app/Row";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — AquaNest" },
      { name: "description", content: "Review the purifiers, filters and spare parts in your cart." },
      { property: "og:title", content: "Your Cart — AquaNest" },
      { property: "og:description", content: "Review the purifiers, filters and spare parts in your cart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const hydrated = useApp((s) => s.hydrated);
  const cart = useApp((s) => s.cart);
  const user = useApp((s) => s.user);
  const setQty = useApp((s) => s.setQty);
  const remove = useApp((s) => s.removeFromCart);
  const dealer = useDealerPricing();
  const navigate = useNavigate();

  const lines = cart.map((l) => ({ product: getProduct(l.productId)!, qty: l.qty })).filter((l) => l.product);
  const totals = cartTotals(lines, dealer);
  const short = moqShortfalls(lines, dealer);
  const toFree = FREE_DELIVERY_THRESHOLD - totals.subtotal;

  if (!hydrated) return <Screen title="Cart"><PageSkeleton /></Screen>;

  if (lines.length === 0)
    return (
      <Screen title="Cart">
        <EmptyState
          icon={<ShoppingCart className="size-8" />}
          title="Your cart is empty"
          body="Add purifiers, filters or spare parts to get started."
          action={<Button asChild variant="hero" size="lg"><Link to="/shop">Start shopping</Link></Button>}
        />
      </Screen>
    );

  return (
    <Screen
      title={`Cart (${totals.itemCount})`}
      footer={
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{formatINR(totals.total)}</p>
          </div>
          <Button
            variant="hero"
            size="lg"
            className="ml-auto flex-1"
            disabled={short.length > 0}
            onClick={() => navigate({ to: user ? "/checkout" : "/login", search: user ? undefined : { redirect: "/checkout" } })}
          >
            {user ? "Proceed to checkout" : "Sign in to checkout"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 p-4">
        {toFree > 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">
            <Truck className="size-4" /> Add {formatINR(toFree)} more for free delivery
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-success/15 px-3 py-2 text-xs font-semibold text-success">
            <Truck className="size-4" /> You get free delivery!
          </div>
        )}

        {lines.map(({ product, qty }) => {
          const below = dealer && qty < product.moq;
          return (
            <div key={product.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft animate-rise">
              <Link to="/product/$id" params={{ id: product.id }} className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                <img src={product.image} alt={product.name} loading="lazy" width={816} height={816} className="size-full object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</p>
                <p className="mt-0.5 text-sm font-bold">
                  {formatINR(unitPrice(product, dealer))}
                  <span className="ml-1 text-[11px] font-normal text-muted-foreground">each</span>
                </p>
                {below && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-destructive">
                    <AlertTriangle className="size-3" /> Minimum {product.moq} units for dealers
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <QtyStepper value={qty} onChange={(n) => setQty(product.id, n)} max={product.stock} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button aria-label="Remove item" className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted">
                        <Trash2 className="size-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[340px] rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove item?</AlertDialogTitle>
                        <AlertDialogDescription>{product.name} will be removed from your cart.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(product.id)}>Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}

        <div className="space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="font-semibold">Price details</p>
          <Row label={`Items (${totals.itemCount})`} value={formatINR(totals.subtotal)} />
          <Row label="Delivery" value={totals.delivery === 0 ? "FREE" : formatINR(totals.delivery)} />
          <div className="border-t border-dashed border-border pt-2">
            <Row label="Total" value={formatINR(totals.total)} bold />
          </div>
          {totals.savings > 0 && <p className="text-xs font-semibold text-success">You save {formatINR(totals.savings)} on this order</p>}
        </div>
      </div>
    </Screen>
  );
}
