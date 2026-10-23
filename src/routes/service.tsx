import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDays, format } from "date-fns";
import { CalendarClock, Droplet, Hammer, Loader2, Settings2, Wrench, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { Screen, Section, EmptyState } from "@/components/app/Screen";
import { RequireLogin } from "@/components/app/RequireLogin";
import { Field } from "@/components/app/AddressForm";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useApp, type ServiceType } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/service")({
  head: () => ({
    meta: [
      { title: "Book Purifier Service & Installation — AquaNest" },
      { name: "description", content: "Book installation, maintenance, repair or filter replacement for your water purifier." },
      { property: "og:title", content: "Book Purifier Service & Installation — AquaNest" },
      { property: "og:description", content: "Book installation, maintenance, repair or filter replacement for your water purifier." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ServicePage,
});

const types: { id: ServiceType; label: string; sub: string; icon: typeof Wrench; price: string }[] = [
  { id: "installation", label: "Installation", sub: "New purifier setup", icon: Settings2, price: "Free*" },
  { id: "maintenance", label: "Maintenance", sub: "Cleaning & check-up", icon: Droplet, price: "₹399" },
  { id: "repair", label: "Repair", sub: "Leak, noise, no water", icon: Hammer, price: "₹299 visit" },
  { id: "filter-replacement", label: "Filter change", sub: "Replace cartridges", icon: Wrench, price: "₹199 + parts" },
];

const slots = ["9 AM – 12 PM", "12 PM – 3 PM", "3 PM – 6 PM", "6 PM – 8 PM"];

const schema = z.object({
  product: z.string().trim().max(80).optional(),
  address: z.string().trim().min(10, "Enter full address with PIN code").max(200),
  issue: z.string().trim().min(5, "Briefly describe what you need").max(500),
});

function ServicePage() {
  const [tab, setTab] = useState<"book" | "mine">("book");
  const count = useApp((s) => s.bookings.filter((b) => b.status !== "cancelled" && b.status !== "completed").length);
  return (
    <Screen title="Service">
      <div className="sticky top-0 z-10 grid grid-cols-2 gap-1 border-b border-border bg-background p-2">
        {(["book", "mine"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("rounded-xl py-2 text-sm font-semibold", tab === t ? "bg-secondary text-secondary-foreground" : "text-muted-foreground")}>
            {t === "book" ? "Book a visit" : `My bookings${count ? ` (${count})` : ""}`}
          </button>
        ))}
      </div>
      <RequireLogin message="Sign in to book a service">
        {tab === "book" ? <BookForm onDone={() => setTab("mine")} /> : <MyBookings />}
      </RequireLogin>
    </Screen>
  );
}

function BookForm({ onDone }: { onDone: () => void }) {
  const book = useApp((s) => s.bookService);
  const firstAddress = useApp((s) => s.addresses[0]);
  const [type, setType] = useState<ServiceType>("installation");
  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i + 1));
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState(slots[0]);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      address: firstAddress ? `${firstAddress.line1}, ${firstAddress.city} – ${firstAddress.pincode}` : "",
    },
  });

  const submit = async (v: z.infer<typeof schema>) => {
    await new Promise((r) => setTimeout(r, 600));
    book({ type, date: format(days[day], "EEE, d MMM"), slot, address: v.address, issue: v.issue, product: v.product });
    toast.success("Service booked", { description: "A technician will be assigned shortly." });
    onDone();
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="pb-6">
      <Section title="Service type">
        <div className="grid grid-cols-2 gap-2">
          {types.map(({ id, label, sub, icon: Icon, price }) => (
            <button
              type="button"
              key={id}
              onClick={() => setType(id)}
              className={cn("rounded-2xl border bg-card p-3 text-left transition-all", type === id ? "border-primary ring-1 ring-primary" : "border-border")}
            >
              <Icon className={cn("mb-2 size-5", type === id ? "text-primary" : "text-muted-foreground")} />
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-[11px] text-muted-foreground">{sub}</p>
              <p className="mt-1 text-[11px] font-semibold text-primary">{price}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Pick a date">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {days.map((d, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setDay(i)}
              className={cn("flex w-14 shrink-0 flex-col items-center rounded-2xl border py-2", day === i ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}
            >
              <span className="text-[10px] uppercase opacity-80">{format(d, "EEE")}</span>
              <span className="text-lg font-semibold">{format(d, "d")}</span>
              <span className="text-[10px] opacity-80">{format(d, "MMM")}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {slots.map((s) => (
            <button type="button" key={s} onClick={() => setSlot(s)} className={cn("rounded-xl border py-2 text-xs font-semibold", slot === s ? "border-primary bg-secondary text-secondary-foreground" : "border-border bg-card")}>
              {s}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Details">
        <div className="space-y-3">
          <Field label="Product / model (optional)"><Input placeholder="e.g. AquaNest Crystal RO" {...register("product")} /></Field>
          <Field label="Visit address" error={formState.errors.address?.message}><Textarea rows={2} {...register("address")} /></Field>
          <Field label="Describe the issue" error={formState.errors.issue?.message}><Textarea rows={3} placeholder="e.g. water leaking from the tap" {...register("issue")} /></Field>
        </div>
      </Section>

      <div className="px-4">
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? <Loader2 className="animate-spin" /> : <CalendarCheck />} Confirm booking
        </Button>
      </div>
    </form>
  );
}

function MyBookings() {
  const bookings = useApp((s) => s.bookings);
  const cancel = useApp((s) => s.cancelBooking);
  if (bookings.length === 0)
    return <EmptyState icon={<CalendarClock className="size-8" />} title="No bookings yet" body="Book a technician for installation, repair or filter change." />;
  return (
    <div className="space-y-3 p-4">
      {bookings.map((b) => (
        <div key={b.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft animate-rise">
          <div className="flex items-center justify-between">
            <p className="font-semibold capitalize">{b.type.replace("-", " ")}</p>
            <StatusBadge status={b.status} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-primary"><CalendarClock className="size-4" /> {b.date} · {b.slot}</p>
          <p className="mt-2 text-sm text-muted-foreground">{b.issue}</p>
          <p className="mt-1 text-xs text-muted-foreground">{b.address}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {b.technician ? `Technician: ${b.technician}` : b.status === "requested" ? "A technician will be assigned and you'll be notified." : ""}
          </p>
          {b.status === "requested" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-2 px-0 text-destructive">Cancel booking</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[340px] rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                  <AlertDialogDescription>Your {b.date} visit will be cancelled.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { cancel(b.id); toast("Booking cancelled"); }}>Cancel booking</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ))}
    </div>
  );
}
