import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { BadgeCheck, Clock, Loader2, Package, PackageCheck, ShieldX, Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { Screen, Section } from "@/components/app/Screen";
import { RequireLogin } from "@/components/app/RequireLogin";
import { Field } from "@/components/app/AddressForm";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/catalog";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/dealer")({
  head: () => ({
    meta: [
      { title: "Dealer Program — Wholesale Water Purifiers | AquaNest" },
      { name: "description", content: "Apply as a dealer for wholesale prices and bulk orders on purifiers, filters and spare parts." },
      { property: "og:title", content: "Dealer Program — Wholesale Water Purifiers | AquaNest" },
      { property: "og:description", content: "Apply as a dealer for wholesale prices and bulk orders on purifiers, filters and spare parts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Screen title="Dealer program" back>
      <RequireLogin message="Sign in to apply as a dealer">
        <Dealer />
      </RequireLogin>
    </Screen>
  ),
});

const schema = z.object({
  businessName: z.string().trim().min(2, "Enter business name").max(80),
  gstin: z.string().trim().toUpperCase().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/, "Enter a valid 15-character GSTIN"),
  city: z.string().trim().min(2, "Enter city").max(40),
  businessType: z.string(),
});

function Dealer() {
  const dealer = useApp((s) => s.dealer);
  const submit = useApp((s) => s.submitDealerApplication);
  const setStatus = useApp((s) => s.setDealerStatus);
  const dealerOrders = useApp((s) => s.orders.filter((o) => o.isDealerOrder));
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { businessType: "Retail shop" },
  });

  if (dealer.status === "none" || dealer.status === "rejected")
    return (
      <div className="pb-6">
        <div className="m-4 rounded-2xl bg-ocean p-5 text-primary-foreground shadow-lift">
          <Store className="mb-2 size-7" />
          <p className="font-display text-xl font-semibold">Grow with AquaNest</p>
          <ul className="mt-3 space-y-1.5 text-sm opacity-90">
            <li>• Up to 28% lower wholesale prices</li>
            <li>• Bulk ordering with minimum quantities</li>
            <li>• Priority dispatch & dedicated support</li>
          </ul>
        </div>
        {dealer.status === "rejected" && (
          <p className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"><ShieldX className="size-4" /> Your previous application was not approved. You can apply again.</p>
        )}
        <form
          onSubmit={handleSubmit(async (v) => {
            await new Promise((r) => setTimeout(r, 700));
            submit(v);
            toast.success("Application submitted");
          })}
          className="space-y-4 px-4"
        >
          <Field label="Business name" error={formState.errors.businessName?.message}><Input {...register("businessName")} /></Field>
          <Field label="GSTIN" error={formState.errors.gstin?.message}><Input maxLength={15} className="uppercase" placeholder="22AAAAA0000A1Z5" {...register("gstin")} /></Field>
          <Field label="City" error={formState.errors.city?.message}><Input {...register("city")} /></Field>
          <Field label="Business type">
            <select {...register("businessType")} className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm">
              <option>Retail shop</option>
              <option>Distributor</option>
              <option>Service centre</option>
              <option>Plumbing contractor</option>
            </select>
          </Field>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting && <Loader2 className="animate-spin" />} Submit application
          </Button>
        </form>
      </div>
    );

  if (dealer.status === "pending")
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-soft">
          <div className="relative mx-auto mb-4 grid size-16 place-items-center rounded-full bg-warning/20 text-warning-foreground">
            <span className="absolute inset-0 rounded-full bg-warning/30 animate-ripple" />
            <Clock className="size-7" />
          </div>
          <p className="font-display text-lg font-semibold">Application under review</p>
          <p className="mt-1 text-sm text-muted-foreground">We usually respond within 24–48 hours. Wholesale prices unlock once approved.</p>
          <div className="mt-4 space-y-1 rounded-xl bg-muted/60 p-3 text-left text-sm">
            <p><span className="text-muted-foreground">Business:</span> {dealer.businessName}</p>
            <p><span className="text-muted-foreground">GSTIN:</span> {dealer.gstin}</p>
            <p><span className="text-muted-foreground">City:</span> {dealer.city}</p>
            {dealer.submittedAt && <p><span className="text-muted-foreground">Submitted:</span> {format(new Date(dealer.submittedAt), "d MMM yyyy")}</p>}
          </div>
          <div className="mt-2 flex justify-center"><StatusBadge status="pending" /></div>
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground">Preview only — simulate the admin decision</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => { setStatus("approved"); toast.success("Dealer approved"); }}>Approve</Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setStatus("rejected")}>Reject</Button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="pb-6">
      <div className="m-4 rounded-2xl bg-ocean p-5 text-primary-foreground shadow-lift">
        <div className="flex items-center gap-2"><BadgeCheck className="size-5" /><span className="text-xs font-bold uppercase tracking-wide">Approved dealer</span></div>
        <p className="mt-2 font-display text-xl font-semibold">{dealer.businessName}</p>
        <p className="text-sm opacity-85">{dealer.city} · GSTIN {dealer.gstin}</p>
      </div>
      <Section>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { icon: Package, v: dealerOrders.length, l: "Bulk orders" },
            { icon: PackageCheck, v: formatINR(dealerOrders.reduce((s, o) => s + o.total, 0)), l: "Purchased" },
            { icon: Truck, v: "48h", l: "Dispatch" },
          ].map(({ icon: Icon, v, l }) => (
            <div key={l} className="rounded-2xl border border-border bg-card p-3">
              <Icon className="mx-auto mb-1 size-4 text-primary" />
              <p className="text-sm font-bold">{v}</p>
              <p className="text-[10px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section>
        <div className="space-y-2">
          <Button asChild variant="hero" size="lg" className="w-full"><Link to="/shop">Shop at wholesale prices</Link></Button>
          <Button asChild variant="outline" size="lg" className="w-full"><Link to="/orders">Dealer order history</Link></Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Each product has a minimum order quantity (shown on the product). Your cart checks this before checkout.</p>
      </Section>
    </div>
  );
}
