import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState, type PointerEvent } from "react";
import { Heart, Share2, ShieldCheck, Star, Truck, Wrench, ZoomIn, X, PackageCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Screen, Section } from "@/components/app/Screen";
import { ProductCard, useDealerPricing } from "@/components/app/ProductCard";
import { QtyStepper } from "@/components/app/QtyStepper";
import { Button } from "@/components/ui/button";
import { discountPct, formatINR, getCategory, getProduct, products } from "@/lib/catalog";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    const title = p ? `${p.name} — AquaNest` : "Product — AquaNest";
    const desc = p ? `${p.name} by ${p.brand}. ${p.warranty}. Order online with free installation.` : "Product details";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="grid h-full place-items-center p-8 text-center">
      <div>
        <p className="text-lg font-semibold">Product not found</p>
        <Link to="/shop" className="mt-3 inline-block text-sm font-semibold text-primary">Back to shop</Link>
      </div>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const navigate = useNavigate();
  const dealer = useDealerPricing();
  const wished = useApp((s) => s.wishlist.includes(product.id));
  const toggleWish = useApp((s) => s.toggleWishlist);
  const addToCart = useApp((s) => s.addToCart);
  const minQty = dealer ? product.moq : 1;
  const [qty, setQty] = useState(minQty);
  const [zoom, setZoom] = useState(false);
  const out = product.stock <= 0;
  const price = dealer ? product.wholesalePrice : product.price;
  const similar = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 6);
  const category = getCategory(product.category);

  const add = (goToCart: boolean) => {
    addToCart(product.id, Math.max(qty, minQty));
    if (goToCart) navigate({ to: "/cart" });
    else toast.success("Added to cart", { action: { label: "View", onClick: () => navigate({ to: "/cart" }) } });
  };

  return (
    <Screen
      title=""
      back
      actions={
        <div className="flex gap-1">
          <button
            aria-label="Share"
            className="grid size-9 place-items-center rounded-full hover:bg-muted"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast("Link copied");
            }}
          >
            <Share2 className="size-4" />
          </button>
          <button aria-label="Wishlist" onClick={() => toggleWish(product.id)} className="grid size-9 place-items-center rounded-full hover:bg-muted">
            <Heart className={cn("size-4", wished && "fill-destructive text-destructive")} />
          </button>
        </div>
      }
      footer={
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">{dealer ? `Total for ${Math.max(qty, minQty)} units` : "Price"}</p>
            <p className="text-lg font-bold">{formatINR(price * Math.max(qty, minQty))}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="lg" disabled={out} onClick={() => add(false)}>
              Add to cart
            </Button>
            <Button variant="hero" size="lg" disabled={out} onClick={() => add(true)}>
              {out ? "Sold out" : dealer ? "Bulk order" : "Buy now"}
            </Button>
          </div>
        </div>
      }
    >
      <button onClick={() => setZoom(true)} className="relative block aspect-square w-full overflow-hidden bg-muted" aria-label="Zoom image">
        <img src={product.image} alt={product.name} width={816} height={816} className="size-full object-cover" />
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-semibold shadow-sm">
          <ZoomIn className="size-3.5" /> Tap to zoom
        </span>
      </button>

      <Section>
        <Link to="/shop" search={{ category: product.category }} className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          {product.brand} · {category?.short}
        </Link>
        <h1 className="mt-1 text-xl font-semibold leading-snug">{product.name}</h1>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-md bg-success px-1.5 py-0.5 font-bold text-success-foreground">
            {product.rating} <Star className="size-3 fill-current" />
          </span>
          <span className="text-muted-foreground">{product.reviews.toLocaleString("en-IN")} ratings</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold">{formatINR(price)}</span>
          {dealer ? (
            <>
              <span className="text-sm text-muted-foreground line-through">{formatINR(product.price)}</span>
              <span className="text-sm font-semibold text-success">Wholesale</span>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground line-through">{formatINR(product.mrp)}</span>
              <span className="text-sm font-semibold text-offer">{discountPct(product)}% off</span>
            </>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">Inclusive of all taxes</p>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 text-sm">
            {out ? (
              <><AlertTriangle className="size-4 text-destructive" /><span className="font-semibold text-destructive">Out of stock</span></>
            ) : product.stock < 15 ? (
              <><AlertTriangle className="size-4 text-warning" /><span className="font-semibold">Only {product.stock} left</span></>
            ) : (
              <><PackageCheck className="size-4 text-success" /><span className="font-semibold">In stock</span></>
            )}
          </div>
          {!out && <QtyStepper value={Math.max(qty, minQty)} onChange={setQty} min={minQty} max={product.stock} />}
        </div>
        {dealer && <p className="mt-2 text-xs font-medium text-primary">Minimum order quantity for dealers: {product.moq} units</p>}
      </Section>

      <Section>
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-medium">
          {[
            { icon: Truck, t: "Free delivery\nover ₹999" },
            { icon: Wrench, t: product.category === "purifiers" || product.category === "dispensers" ? "Free\ninstallation" : "Easy\nfitting" },
            { icon: ShieldCheck, t: "Genuine\nwarranty" },
          ].map(({ icon: Icon, t }) => (
            <div key={t} className="flex flex-col items-center gap-1 rounded-xl bg-secondary p-3 text-secondary-foreground">
              <Icon className="size-5" />
              <span className="whitespace-pre-line">{t}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="About this product">
        <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
      </Section>

      <Section title="Specifications">
        <dl className="overflow-hidden rounded-xl border border-border text-sm">
          {Object.entries(product.specs).map(([k, v], i) => (
            <div key={k} className={cn("flex gap-3 px-3 py-2.5", i % 2 === 0 && "bg-muted/60")}>
              <dt className="w-2/5 text-muted-foreground">{k}</dt>
              <dd className="flex-1 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Warranty">
        <div className="flex items-start gap-3 rounded-xl bg-mist p-3 text-sm">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          {product.warranty}
        </div>
      </Section>

      {similar.length > 0 && (
        <Section title="Similar products" className="pb-6">
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} className="w-40 shrink-0" />
            ))}
          </div>
        </Section>
      )}

      {zoom && <ZoomViewer src={product.image} alt={product.name} onClose={() => setZoom(false)} />}
    </Screen>
  );
}

function ZoomViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState("50% 50%");
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background animate-in fade-in">
      <div className="flex items-center justify-between p-3">
        <span className="text-xs text-muted-foreground">{scale > 1 ? "Move to pan · tap to zoom out" : "Tap image to zoom in"}</span>
        <button aria-label="Close zoom" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-muted">
          <X className="size-4" />
        </button>
      </div>
      <div
        className="flex flex-1 touch-none items-center overflow-hidden"
        onPointerMove={move}
        onPointerDown={move}
        onClick={() => setScale((s) => (s > 1 ? 1 : 2.5))}
      >
        <img src={src} alt={alt} style={{ transform: `scale(${scale})`, transformOrigin: origin }} className="w-full transition-transform duration-200" />
      </div>
    </div>
  );
}
