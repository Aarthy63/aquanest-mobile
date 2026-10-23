import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { EmptyState } from "./Screen";

export function RequireLogin({ children, message = "Sign in to continue" }: { children: ReactNode; message?: string }) {
  const hydrated = useApp((s) => s.hydrated);
  const user = useApp((s) => s.user);
  if (!hydrated) return <PageSkeleton />;
  if (!user)
    return (
      <EmptyState
        icon={<LogIn className="size-8" />}
        title={message}
        body="Track orders, save addresses and book service visits."
        action={
          <div className="flex gap-2">
            <Button asChild variant="hero" size="lg">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/register">Create account</Link>
            </Button>
          </div>
        }
      />
    );
  return <>{children}</>;
}

export function PageSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3 rounded-2xl bg-card p-3">
          <Skeleton className="size-20 rounded-xl" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
