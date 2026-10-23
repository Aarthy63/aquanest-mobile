import type { ReactNode } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Home, LayoutGrid, ShoppingCart, User, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";

interface ScreenProps {
  title?: ReactNode;
  back?: boolean;
  actions?: ReactNode;
  children: ReactNode;
  hideNav?: boolean;
  footer?: ReactNode;
  header?: ReactNode;
  className?: string;
}

export function Screen({ title, back, actions, children, hideNav, footer, header, className }: ScreenProps) {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col bg-background">
      {header ??
        (title !== undefined && (
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/90 px-3 backdrop-blur">
            {back && (
              <button
                aria-label="Go back"
                onClick={() => router.history.back()}
                className="grid size-9 place-items-center rounded-full hover:bg-muted"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <h1 className={cn("flex-1 truncate text-base font-semibold", !back && "pl-1")}>{title}</h1>
            {actions}
          </header>
        ))}
      <main className={cn("no-scrollbar flex-1 overflow-y-auto", className)}>{children}</main>
      {footer && <div className="shrink-0 border-t border-border bg-card px-4 py-3 pb-safe">{footer}</div>}
      {!hideNav && !footer && <BottomNav />}
    </div>
  );
}

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shop", label: "Shop", icon: LayoutGrid },
  { to: "/service", label: "Service", icon: Wrench },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
  { to: "/profile", label: "Account", icon: User },
] as const;

function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const cartCount = useApp((s) => s.cart.reduce((n, l) => n + l.qty, 0));
  return (
    <nav className="grid shrink-0 grid-cols-5 border-t border-border bg-card pb-safe pt-1.5">
      {tabs.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? path === "/" : path.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "relative flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-secondary")}>
              <Icon className="size-[18px]" />
            </span>
            {label}
            {to === "/cart" && cartCount > 0 && (
              <span className="absolute right-3 top-0 grid min-w-4 place-items-center rounded-full bg-offer px-1 text-[10px] font-bold text-offer-foreground">
                {cartCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function Section({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("px-4 py-3", className)}>
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center animate-rise">
      <div className="relative mb-5 grid size-20 place-items-center rounded-full bg-secondary text-primary">
        <span className="absolute inset-0 rounded-full bg-primary/15 animate-ripple" />
        {icon}
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {body && <p className="mt-1 text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
