import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, Landmark, Loader2, MapPin, Plus, ShieldCheck, Smartphone, Wallet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Screen, Section } from "@/components/app/Screen";
import { RequireLogin } from "@/components/app/RequireLogin";
import { BottomSheet } from "@/components/app/BottomSheet";
import { AddressForm } from "@/components/app/AddressForm";
import { Row } from "@/components/app/Row";
import { useDealerPricing } from "@/components/app/ProductCard";
import { Button } from "@/components/ui/button";
import { formatINR, getProduct } from "@/lib/catalog";
import { cartTotals, moqShortfalls } from "@/lib/pricing";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — AquaNest" },
      { name: "description", content: "Choose a delivery address and pay securely." },
      { property: "og:title", content: "Checkout — AquaNest" },
      { property: "og:description", content: "Choose a delivery address and pay securely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Screen title="Checkout" back hideNav>
      <RequireLogin message="Sign in to checkout">
        <Checkout />
      </RequireLogin>
    </Screen>
  ),
});

const methods = [
  { id: "upi", label: "UPI", sub: "GPay, PhonePe, Paytm", icon: Smartphone },
  { id: "card", label: "Credit / Debit card", sub: "Visa, Mastercard, RuPay", icon: CreditCard },
  { id: "netbanking", label: "Net banking", sub: "All major banks", icon: Landmark },
  { id: "wallet", label: "Wallets", sub: "Paytm, Amazon Pay", icon: Wallet },
];

function Checkout() {
  const navigate = useNavigate();
  const cart = useApp((s) => s.cart);
  const addresses = useApp((s) => s.addresses);
  const saveAddress = useApp((s) => s.saveAddress);
  const placeOrder = useApp((s) => s.placeOrder);
  const dealer = useDealerPricing();
  const [addressId, setAddressId] = useState<string | undefined>(addresses[0]?.id);
  const [method, setMethod] = useState("upi");
  const [addOpen, setAddOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState<"idle" | "processing" | "success">("idle");

  useEffect(() => {
    if (!addressId && addresses.length) setAddressId(addresses[addresses.length - 1].id);
  }, [addresses, addressId]);

  const lines = cart.map((l) => ({ product: getProduct(l.productId)!, qty: l.qty })).filter((l) => l.product);
  const totals = cartTotals(lines, dealer);
  const blocked = moqShortfalls(lines, dealer).length > 0;

  if (lines.length === 0 && paying === "idle")
    return (
      <div className="p-8 text-center">
        <p className="font-semibold">Your cart is empty</p>
        <Link to="/shop" className="mt-2 inline-block text-sm font-semibold text-primary">Go shopping</Link>
      </div>
    );

  const pay = (outcome: "success" | "failed") => {
    setPaying("processing");
    setTimeout(() => {
      if (outcome === "failed") {
        setPaying("idle");
        setPayOpen(false);
        toast.error("Payment failed", { description: "No money was deducted. Please try again." });
        return;
      }
      const ref = `pay_${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
      const order = placeOrder(addressId!, methods.find((m) => m.id === method)!.label, ref);
      setPaying("success");
      setTimeout(() => {
        setPayOpen(false);
        if (order) navigate({ to: "/orders/$id", params: { id: order.id }, search: { placed: true }, replace: true });
      }, 900);
    }, 1300);
  };

  return (
    <div className="pb-28">
      <Section title="Delivery address" action={<button onClick={() => setAddOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-primary"><Plus className="size-3.5" />Add new</button>}>
        {addresses.length === 0 ? (
          <button onClick={() => setAddOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-border p-4 text-left text-sm">
            <MapPin className="size-5 text-primary" /> Add a delivery address
          </button>
        ) : (
          <div className="space-y-2">
            {addresses.map((a) => (
              <label key={a.id} className={cn("flex cursor-pointer gap-3 rounded-2xl border bg-card p-3 text-sm transition-colors", addressId === a.id ? "border-primary ring-1 ring-primary" : "border-border")}>
                <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 accent-primary" />
                <div>
                  <p className="font-semibold">{a.name} <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-secondary-foreground">{a.label}</span></p>
                  <p className="text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} – {a.pincode}</p>
                  <p className="text-muted-foreground">{a.phone}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Order summary (${totals.itemCount})`}>
        <div className="space-y-2">
          {lines.map(({ product, qty }) => (
            <div key={product.id} className="flex items-center gap-3 text-sm">
              <img src={product.image} alt="" width={48} height={48} className="size-12 rounded-lg object-cover" />
              <p className="line-clamp-1 flex-1">{product.name}</p>
              <span className="text-muted-foreground">×{qty}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Payment method">
        <div className="space-y-2">
          {methods.map(({ id, label, sub, icon: Icon }) => (
            <label key={id} className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border bg-card p-3 text-sm", method === id ? "border-primary ring-1 ring-primary" : "border-border")}>
              <Icon className="size-5 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
              <input type="radio" name="method" checked={method === id} onChange={() => setMethod(id)} className="accent-primary" />
            </label>
          ))}
        </div>
      </Section>

      <Section>
        <div className="space-y-2 rounded-2xl bg-muted/60 p-4 text-sm">
          <Row label="Items" value={formatINR(totals.subtotal)} />
          <Row label="Delivery" value={totals.delivery ? formatINR(totals.delivery) : "FREE"} />
          <Row label="Amount payable" value={formatINR(totals.total)} bold />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-success" />Secured by Razorpay · Test mode</p>
      </Section>

      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-card px-4 py-3 pb-safe">
        <Button variant="hero" size="lg" className="w-full" disabled={!addressId || blocked} onClick={() => setPayOpen(true)}>
          {addressId ? `Pay ${formatINR(totals.total)}` : "Add an address to continue"}
        </Button>
      </div>

      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="New address">
        <AddressForm
          onSubmit={(a) => {
            saveAddress(a);
            setAddOpen(false);
            toast.success("Address saved");
          }}
        />
      </BottomSheet>

      <BottomSheet open={payOpen} onClose={() => paying === "idle" && setPayOpen(false)} title="Razorpay Checkout">
        <div className="space-y-4 text-center">
          <span className="inline-block rounded-full bg-warning px-2.5 py-0.5 text-[10px] font-bold uppercase text-warning-foreground">Test mode</span>
          <div>
            <p className="text-xs text-muted-foreground">AquaNest · {methods.find((m) => m.id === method)?.label}</p>
            <p className="font-display text-3xl font-semibold">{formatINR(totals.total)}</p>
          </div>
          {paying === "processing" && (
            <p className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Processing payment…</p>
          )}
          {paying === "success" && (
            <p className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-success animate-rise"><CheckCircle2 className="size-5" /> Payment successful</p>
          )}
          {paying === "idle" && (
            <div className="space-y-2">
              <Button variant="hero" size="lg" className="w-full" onClick={() => pay("success")}>Pay now</Button>
              <Button variant="outline" size="lg" className="w-full" onClick={() => pay("failed")}>Simulate failed payment</Button>
              <p className="text-[11px] text-muted-foreground">No real money is charged in test mode.</p>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
