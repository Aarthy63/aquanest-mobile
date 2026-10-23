import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Droplets, MapPin, Search, ShieldCheck, Truck, Wrench, BadgePercent, Store } from "lucide-react";
import banner from "@/assets/banner-water.jpg";
import { Screen, Section } from "@/components/app/Screen";
import { ProductCard } from "@/components/app/ProductCard";
import { Button } from "@/components/ui/button";
import { categories, products, discountPct } from "@/lib/catalog";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AquaNest — Shop Water Purifiers & Book Service" },
      { name: "description", content: "Pure water at home: RO purifiers, dispensers, filters, membranes and spare parts with doorstep installation." },
      { property: "og:title", content: "AquaNest — Shop Water Purifiers & Book Service" },
      { property: "og:description", content: "Pure water at home: RO purifiers, dispensers, filters, membranes and spare parts with doorstep installation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const slides = [
  { kicker: "Monsoon Sale", title: "Up to 35% off\nRO purifiers", cta: "Shop purifiers", category: "purifiers" as const },
  { kicker: "Free installation", title: "Book a technician\nin 60 seconds", cta: "Book service", category: null },
  { kicker: "Filter care", title: "Annual filter kits\nfrom ₹1,899", cta: "Shop filters", category: "filters" as const },
];

function Home() {
  const navigate = useNavigate();
  const user = useApp((s) => s.user);
  const unread = useApp((s) => s.notifications.filter((n) => !n.read).length);
  const dealer = useApp((s) => s.dealer);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, []);

  const featured = products.filter((p) => p.featured);
  const offers = [...products].sort((a, b) => discountPct(b) - discountPct(a)).slice(0, 6);
  const current = slides[slide];

  return (
    <Screen
      header={
        <header className="shrink-0 bg-ocean px-4 pb-5 pt-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-1 text-xs opacity-80">
                <MapPin className="size-3" /> Deliver to {user ? user.name.split(" ")[0] : "you"}
              </p>
              <p className="flex items-center gap-1.5 font-display text-lg font-semibold">
                <Droplets className="size-5" /> AquaNest
              </p>
            </div>
            <Link to="/notifications" aria-label="Notifications" className="relative grid size-10 place-items-center rounded-full bg-primary-foreground/15">
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-offer ring-2 ring-primary" />}
            </Link>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("q")?.toString() ?? "";
              navigate({ to: "/shop", search: { q: q || undefined } });
            }}
            className="mt-4 flex items-center gap-2 rounded-xl bg-card px-3 py-2.5 text-foreground shadow-lift"
          >
            <Search className="size-4 text-muted-foreground" />
            <input name="q" placeholder="Search purifiers, filters, pumps…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </form>
        </header>
      }
    >
      {/* Banner carousel */}
      <Section className="pt-4">
        <div className="relative h-44 overflow-hidden rounded-2xl shadow-lift">
          <img src={banner} alt="Glass being filled with pure water" width={1280} height={640} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 via-foreground/35 to-transparent" />
          <div key={slide} className="relative flex h-full flex-col justify-center p-5 text-background animate-rise">
            <span className="mb-1 w-fit rounded-full bg-offer px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-offer-foreground">{current.kicker}</span>
            <h2 className="whitespace-pre-line text-xl font-semibold leading-tight">{current.title}</h2>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3 w-fit rounded-full"
              onClick={() => (current.category ? navigate({ to: "/shop", search: { category: current.category } }) : navigate({ to: "/service" }))}
            >
              {current.cta}
            </Button>
          </div>
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {slides.map((_, i) => (
              <button key={i} aria-label={`Slide ${i + 1}`} onClick={() => setSlide(i)} className={cn("h-1.5 rounded-full bg-background/60 transition-all", i === slide ? "w-5 bg-background" : "w-1.5")} />
            ))}
          </div>
        </div>
      </Section>

      {/* Trust row */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
        {[
          { icon: Truck, t: "Free delivery ₹999+" },
          { icon: Wrench, t: "Free installation" },
          { icon: ShieldCheck, t: "Genuine warranty" },
        ].map(({ icon: Icon, t }) => (
          <div key={t} className="flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-secondary-foreground">
            <Icon className="size-3.5" /> {t}
          </div>
        ))}
      </div>

      {/* Categories */}
      <Section title="Shop by category" action={<Link to="/shop" className="text-xs font-semibold text-primary">See all</Link>}>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((c) => (
            <Link key={c.id} to="/shop" search={{ category: c.id }} className="group flex flex-col items-center gap-1.5">
              <div className="aspect-square w-full overflow-hidden rounded-2xl bg-muted shadow-soft">
                <img src={c.image} alt={c.name} loading="lazy" width={816} height={816} className="size-full object-cover transition-transform group-hover:scale-105" />
              </div>
              <span className="text-xs font-semibold">{c.short}</span>
            </Link>
          ))}
        </div>
      </Section>

      {/* Featured */}
      <Section title="Featured purifiers" action={<Link to="/shop" search={{ category: "purifiers" }} className="text-xs font-semibold text-primary">View all</Link>}>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} className="w-40 shrink-0" />
          ))}
        </div>
      </Section>

      {/* Service promo */}
      <Section>
        <Link to="/service" className="flex items-center gap-4 rounded-2xl border border-border bg-mist p-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Wrench className="size-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Book a service visit</p>
            <p className="text-xs text-muted-foreground">Installation, repair, maintenance & filter change</p>
          </div>
          <span className="text-sm font-semibold text-primary">Book →</span>
        </Link>
      </Section>

      {/* Offers */}
      <Section title="Top offers" action={<BadgePercent className="size-4 text-offer" />}>
        <div className="grid grid-cols-2 gap-3">
          {offers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      {/* Dealer CTA */}
      <Section className="pb-6">
        <div className="rounded-2xl bg-ocean p-5 text-primary-foreground shadow-lift">
          <Store className="mb-2 size-6" />
          <p className="font-display text-lg font-semibold">Are you a dealer?</p>
          <p className="mt-1 text-sm opacity-85">
            {dealer.status === "approved"
              ? "Wholesale prices are active on your account."
              : dealer.status === "pending"
                ? "Your application is under review."
                : "Get wholesale prices and bulk ordering for your shop."}
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-4 rounded-full">
            <Link to="/dealer">{dealer.status === "none" ? "Apply as dealer" : "Dealer hub"}</Link>
          </Button>
        </div>
      </Section>
    </Screen>
  );
}
