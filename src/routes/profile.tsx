import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, Heart, LogOut, MapPin, Moon, Package, Store, Wrench, Mail, MessageSquare, Tag } from "lucide-react";
import { toast } from "sonner";
import { Screen, Section } from "@/components/app/Screen";
import { RequireLogin } from "@/components/app/RequireLogin";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Switch } from "@/components/ui/switch";
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
import { useApp, type Settings } from "@/store/app-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Account — AquaNest" },
      { name: "description", content: "Manage your profile, addresses, orders and notification settings." },
      { property: "og:title", content: "My Account — AquaNest" },
      { property: "og:description", content: "Manage your profile, addresses, orders and notification settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Screen title="Account">
      <RequireLogin message="Sign in to your account">
        <Profile />
      </RequireLogin>
    </Screen>
  ),
});

function Profile() {
  const navigate = useNavigate();
  const user = useApp((s) => s.user)!;
  const dealer = useApp((s) => s.dealer);
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const logout = useApp((s) => s.logout);
  const counts = useApp((s) => ({ orders: s.orders.length, wish: s.wishlist.length, addr: s.addresses.length }));

  const links = [
    { to: "/orders" as const, icon: Package, label: "My orders", meta: counts.orders || "" },
    { to: "/wishlist" as const, icon: Heart, label: "Wishlist", meta: counts.wish || "" },
    { to: "/addresses" as const, icon: MapPin, label: "Saved addresses", meta: counts.addr || "" },
    { to: "/service" as const, icon: Wrench, label: "Service bookings", meta: "" },
    { to: "/notifications" as const, icon: Bell, label: "Notifications", meta: "" },
  ];

  const toggles: { key: keyof Settings; label: string; icon: typeof Bell }[] = [
    { key: "pushOrders", label: "Order updates", icon: Package },
    { key: "pushService", label: "Service updates", icon: Wrench },
    { key: "pushOffers", label: "Offers & deals", icon: Tag },
    { key: "email", label: "Email notifications", icon: Mail },
    { key: "sms", label: "SMS notifications", icon: MessageSquare },
  ];

  return (
    <div className="pb-6">
      <div className="m-4 flex items-center gap-4 rounded-2xl bg-ocean p-5 text-primary-foreground shadow-lift">
        <div className="grid size-14 place-items-center rounded-full bg-primary-foreground/20 font-display text-xl font-semibold">
          {user.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold">{user.name}</p>
          <p className="truncate text-xs opacity-85">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-bold uppercase">{user.role}</span>
        </div>
      </div>

      <Section>
        <Link to="/dealer" className="flex items-center gap-3 rounded-2xl border border-border bg-mist p-4">
          <Store className="size-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Dealer program</p>
            <p className="text-xs text-muted-foreground">{dealer.status === "none" ? "Apply for wholesale pricing" : "View your dealer status"}</p>
          </div>
          {dealer.status !== "none" && <StatusBadge status={dealer.status} />}
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </Section>

      <Section>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {links.map(({ to, icon: Icon, label, meta }) => (
            <Link key={label} to={to} className="flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-muted/50">
              <Icon className="size-4 text-primary" />
              <span className="flex-1 font-medium">{label}</span>
              {meta !== "" && <span className="text-xs text-muted-foreground">{meta}</span>}
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Notification settings">
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {toggles.map(({ key, label, icon: Icon }) => (
            <label key={key} className="flex items-center gap-3 px-4 py-3 text-sm">
              <Icon className="size-4 text-primary" />
              <span className="flex-1 font-medium">{label}</span>
              <Switch checked={settings[key] as boolean} onCheckedChange={(v) => update({ [key]: v })} />
            </label>
          ))}
        </div>
      </Section>

      <Section title="Appearance">
        <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
          <Moon className="size-4 text-primary" />
          <span className="flex-1 font-medium">Dark mode</span>
          <Switch checked={settings.theme === "dark"} onCheckedChange={(v) => update({ theme: v ? "dark" : "light" })} />
        </label>
      </Section>

      <Section>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 py-3 text-sm font-semibold text-destructive">
              <LogOut className="size-4" /> Sign out
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-[340px] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out?</AlertDialogTitle>
              <AlertDialogDescription>You'll need to sign in again to place orders.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Stay</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  logout();
                  toast("Signed out");
                  navigate({ to: "/login", replace: true });
                }}
              >
                Sign out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">AquaNest v1.0 · Preview build</p>
      </Section>
    </div>
  );
}
