import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Droplets, Loader2, Store, User } from "lucide-react";
import { toast } from "sonner";
import { Screen } from "@/components/app/Screen";
import { Field } from "@/components/app/AddressForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  validateSearch: z.object({ type: z.enum(["customer", "dealer"]).optional() }),
  head: () => ({
    meta: [
      { title: "Create account — AquaNest" },
      { name: "description", content: "Create a customer or dealer account to shop water purifiers and parts." },
      { property: "og:title", content: "Create account — AquaNest" },
      { property: "og:description", content: "Create a customer or dealer account to shop water purifiers and parts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

const base = {
  name: z.string().trim().min(2, "Enter your full name").max(60),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  password: z.string().min(8, "Use at least 8 characters"),
};
const schema = z
  .object({
    ...base,
    businessName: z.string().trim().max(80).optional(),
    gstin: z.string().trim().toUpperCase().optional(),
    city: z.string().trim().max(40).optional(),
    businessType: z.string().optional(),
    isDealer: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.isDealer) return;
    if (!v.businessName || v.businessName.length < 2) ctx.addIssue({ code: "custom", path: ["businessName"], message: "Enter business name" });
    if (!v.gstin || !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(v.gstin)) ctx.addIssue({ code: "custom", path: ["gstin"], message: "Enter a valid 15-character GSTIN" });
    if (!v.city || v.city.length < 2) ctx.addIssue({ code: "custom", path: ["city"], message: "Enter city" });
  });

type Values = z.infer<typeof schema>;

function Register() {
  const { type } = Route.useSearch();
  const navigate = useNavigate({ from: "/register" });
  const doRegister = useApp((s) => s.register);
  const isDealer = type === "dealer";
  const { register, handleSubmit, formState, setValue } = useForm<Values>({
    resolver: zodResolver(schema),
    values: { isDealer, businessType: "Retail shop" } as Values,
    resetOptions: { keepDirtyValues: true },
  });
  const e = formState.errors;

  const onSubmit = async (v: Values) => {
    await new Promise((r) => setTimeout(r, 700));
    doRegister(
      { name: v.name, email: v.email, phone: v.phone, role: v.isDealer ? "dealer" : "customer" },
      v.isDealer ? { businessName: v.businessName!, gstin: v.gstin!, city: v.city!, businessType: v.businessType ?? "Retail shop" } : undefined,
    );
    toast.success(v.isDealer ? "Application submitted" : "Account created");
    navigate({ to: v.isDealer ? "/dealer" : "/", replace: true });
  };

  return (
    <Screen hideNav header={null}>
      <div className="bg-ocean px-6 pb-14 pt-10 text-primary-foreground">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold"><Droplets className="size-6" /> AquaNest</Link>
        <h1 className="mt-6 text-3xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm opacity-85">{isDealer ? "Apply for wholesale prices and bulk orders." : "Pure water, delivered and installed."}</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="-mt-8 space-y-4 rounded-t-3xl bg-background px-6 pb-10 pt-6">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
          {[
            { v: "customer" as const, label: "Customer", icon: User },
            { v: "dealer" as const, label: "Dealer", icon: Store },
          ].map(({ v, label, icon: Icon }) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setValue("isDealer", v === "dealer");
                navigate({ search: { type: v === "dealer" ? "dealer" : undefined }, replace: true });
              }}
              className={cn("flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-colors", (v === "dealer") === isDealer ? "bg-card shadow-soft" : "text-muted-foreground")}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        <Field label="Full name" error={e.name?.message}><Input autoComplete="name" {...register("name")} /></Field>
        <Field label="Email" error={e.email?.message}><Input type="email" autoComplete="email" {...register("email")} /></Field>
        <Field label="Mobile number" error={e.phone?.message}><Input inputMode="numeric" maxLength={10} autoComplete="tel" {...register("phone")} /></Field>
        <Field label="Password" error={e.password?.message}><Input type="password" autoComplete="new-password" {...register("password")} /></Field>

        {isDealer && (
          <div className="space-y-4 rounded-2xl border border-border bg-mist p-4 animate-rise">
            <p className="text-sm font-semibold">Business details</p>
            <Field label="Business name" error={e.businessName?.message}><Input {...register("businessName")} /></Field>
            <Field label="GSTIN" error={e.gstin?.message}><Input placeholder="22AAAAA0000A1Z5" maxLength={15} className="uppercase" {...register("gstin")} /></Field>
            <Field label="City" error={e.city?.message}><Input {...register("city")} /></Field>
            <Field label="Business type">
              <select {...register("businessType")} className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm">
                <option>Retail shop</option>
                <option>Distributor</option>
                <option>Service centre</option>
                <option>Plumbing contractor</option>
              </select>
            </Field>
            <p className="text-xs text-muted-foreground">Wholesale prices unlock after our team approves your application.</p>
          </div>
        )}

        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Loader2 className="animate-spin" />} {isDealer ? "Submit application" : "Create account"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="font-semibold text-primary">Sign in</Link>
        </p>
      </form>
    </Screen>
  );
}
