import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Address } from "@/store/app-store";

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Add a label like Home or Shop").max(20),
  name: z.string().trim().min(2, "Enter full name").max(60),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1: z.string().trim().min(5, "Enter house / street").max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, "Enter city").max(40),
  state: z.string().trim().min(2, "Enter state").max(40),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
});

export type AddressInput = z.infer<typeof addressSchema>;

export function AddressForm({ initial, onSubmit, submitLabel = "Save address" }: { initial?: Partial<Address>; onSubmit: (a: AddressInput) => void; submitLabel?: string }) {
  const { register, handleSubmit, formState } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: "Home", ...initial },
  });
  const e = formState.errors;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Field label="Label" error={e.label?.message}><Input {...register("label")} placeholder="Home" /></Field>
      <Field label="Full name" error={e.name?.message}><Input {...register("name")} autoComplete="name" /></Field>
      <Field label="Mobile number" error={e.phone?.message}><Input {...register("phone")} inputMode="numeric" maxLength={10} autoComplete="tel" /></Field>
      <Field label="House no., street" error={e.line1?.message}><Input {...register("line1")} autoComplete="address-line1" /></Field>
      <Field label="Area, landmark (optional)" error={e.line2?.message}><Input {...register("line2")} autoComplete="address-line2" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="City" error={e.city?.message}><Input {...register("city")} autoComplete="address-level2" /></Field>
        <Field label="PIN code" error={e.pincode?.message}><Input {...register("pincode")} inputMode="numeric" maxLength={6} autoComplete="postal-code" /></Field>
      </div>
      <Field label="State" error={e.state?.message}><Input {...register("state")} autoComplete="address-level1" /></Field>
      <Button type="submit" variant="hero" size="lg" className="w-full">{submitLabel}</Button>
    </form>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
