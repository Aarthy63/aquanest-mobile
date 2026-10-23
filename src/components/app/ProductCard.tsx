import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { discountPct, formatINR, type Product } from "@/lib/catalog";
import { isApprovedDealer, useApp } from "@/store/app-store";

export function useDealerPricing() {
  return useApp((s) => isApprovedDealer(s));
}

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const dealer = useDealerPricing();
  const wished = useApp((s) => s.wishlist.includes(product.id));
  const toggle = useApp((s) => s.toggleWishlist);
  const off = discountPct(product);
  const out = product.stock <= 0;

  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className={cn("group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-transform active:scale-[0.98]", className)}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={816}
          height={816}
          className={cn("size-full object-cover transition-transform duration-500 group-hover:scale-105", out && "opacity-60 grayscale")}
        />
        {!dealer && off > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-offer px-2 py-0.5 text-[10px] font-bold text-offer-foreground">
            {off}% OFF
          </span>
        )}
        {dealer && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            MOQ {product.moq}
          </span>
        )}
        {out && (
          <span className="absolute inset-x-2 bottom-2 rounded-lg bg-foreground/80 py-1 text-center text-[11px] font-semibold text-background">
            Out of stock
          </span>
        )}
        <button
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            toggle(product.id);
            toast(wished ? "Removed from wishlist" : "Saved to wishlist");
          }}
          className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-card/90 shadow-sm backdrop-blur"
        >
          <Heart className={cn("size-4", wished ? "fill-destructive text-destructive" : "text-muted-foreground")} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{product.brand}</p>
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug">{product.name}</h3>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Star className="size-3 fill-warning text-warning" />
          {product.rating} <span>({product.reviews})</span>
        </div>
        <div className="mt-auto flex items-baseline gap-1.5 pt-1">
          <span className="text-sm font-bold">{formatINR(dealer ? product.wholesalePrice : product.price)}</span>
          <span className="text-[11px] text-muted-foreground line-through">{formatINR(dealer ? product.price : product.mrp)}</span>
        </div>
        {dealer && <span className="text-[10px] font-semibold text-success">Wholesale price</span>}
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((p, i) => (
        <div key={p.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}>
          <ProductCard product={p} className="h-full" />
        </div>
      ))}
    </div>
  );
}
