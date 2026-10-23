import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Screen, EmptyState } from "@/components/app/Screen";
import { ProductGrid } from "@/components/app/ProductCard";
import { PageSkeleton } from "@/components/app/RequireLogin";
import { Button } from "@/components/ui/button";
import { getProduct, type Product } from "@/lib/catalog";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — AquaNest" },
      { name: "description", content: "Products you've saved for later." },
      { property: "og:title", content: "Wishlist — AquaNest" },
      { property: "og:description", content: "Products you've saved for later." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Wishlist,
});

function Wishlist() {
  const hydrated = useApp((s) => s.hydrated);
  const ids = useApp((s) => s.wishlist);
  const items = ids.map(getProduct).filter(Boolean) as Product[];
  return (
    <Screen title={`Wishlist${items.length ? ` (${items.length})` : ""}`} back>
      {!hydrated ? (
        <PageSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-8" />}
          title="No saved items yet"
          body="Tap the heart on any product to save it here."
          action={<Button asChild variant="hero" size="lg"><Link to="/shop">Browse products</Link></Button>}
        />
      ) : (
        <div className="p-4"><ProductGrid products={items} /></div>
      )}
    </Screen>
  );
}
