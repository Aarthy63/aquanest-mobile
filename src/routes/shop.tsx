import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { z } from "zod";
import { Search, SlidersHorizontal, X, PackageSearch, History } from "lucide-react";
import { Screen } from "@/components/app/Screen";
import { ProductGrid } from "@/components/app/ProductCard";
import { EmptyState } from "@/components/app/Screen";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/app/BottomSheet";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { brands, categories, formatINR, queryCatalog, type CategoryId, type SortKey } from "@/lib/catalog";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.enum(["purifiers", "dispensers", "pumps", "filters", "membranes", "spare-parts"]).optional(),
  sort: z.enum(["popular", "price-asc", "price-desc", "rating", "newest"]).optional(),
  brand: z.string().optional(),
  maxPrice: z.number().optional(),
  inStock: z.boolean().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Shop Water Purifiers, Filters & Spares — AquaNest" },
      { name: "description", content: "Browse 50+ water purifiers, dispensers, booster pumps, filters, RO membranes and spare parts." },
      { property: "og:title", content: "Shop Water Purifiers, Filters & Spares — AquaNest" },
      { property: "og:description", content: "Browse 50+ water purifiers, dispensers, booster pumps, filters, RO membranes and spare parts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

const PAGE_SIZE = 10;
const sortLabels: Record<SortKey, string> = {
  popular: "Popular",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Top rated",
  newest: "Newest",
};

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const recent = useApp((s) => s.recentSearches);
  const addRecent = useApp((s) => s.addRecentSearch);
  const [text, setText] = useState(search.q ?? "");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => queryCatalog(search), [search]);
  const visible = results.slice(0, page * PAGE_SIZE);
  const activeFilters = [search.brand, search.maxPrice, search.inStock].filter(Boolean).length;

  useEffect(() => {
    setPage(1);
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setText(search.q ?? ""), [search.q]);

  const update = (patch: Partial<z.infer<typeof searchSchema>>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  return (
    <Screen
      header={
        <header className="sticky top-0 z-20 shrink-0 space-y-3 border-b border-border/60 bg-background/95 px-4 pb-3 pt-4 backdrop-blur">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = text.trim();
              if (q) addRecent(q);
              update({ q: q || undefined });
              setFocused(false);
            }}
            className="flex items-center gap-2"
          >
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3 py-2.5">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                placeholder="Search products"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {text && (
                <button type="button" aria-label="Clear search" onClick={() => { setText(""); update({ q: undefined }); }}>
                  <X className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button type="button" variant="outline" size="icon" aria-label="Filters" onClick={() => setFiltersOpen(true)} className="relative rounded-xl">
              <SlidersHorizontal />
              {activeFilters > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{activeFilters}</span>}
            </Button>
          </form>
          {focused && recent.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <button key={r} onMouseDown={() => { setText(r); update({ q: r }); }} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                  <History className="size-3" /> {r}
                </button>
              ))}
            </div>
          )}
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            <Chip active={!search.category} onClick={() => update({ category: undefined })}>All</Chip>
            {categories.map((c) => (
              <Chip key={c.id} active={search.category === c.id} onClick={() => update({ category: c.id as CategoryId })}>
                {c.short}
              </Chip>
            ))}
          </div>
        </header>
      }
    >
      <div className="flex items-center justify-between px-4 pt-3 text-xs text-muted-foreground">
        <span>{results.length} products</span>
        <select
          aria-label="Sort products"
          value={search.sort ?? "popular"}
          onChange={(e) => update({ sort: e.target.value as SortKey })}
          className="rounded-lg border border-input bg-card px-2 py-1.5 text-xs font-semibold text-foreground"
        >
          {Object.entries(sortLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-border/60 bg-card p-2">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={<PackageSearch className="size-8" />}
            title="No products found"
            body="Try a different search or clear your filters."
            action={<Button variant="outline" onClick={() => navigate({ search: {} })}>Clear all</Button>}
          />
        ) : (
          <>
            <ProductGrid products={visible} />
            <div className="mt-5 flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Showing {visible.length} of {results.length}
              </p>
              {visible.length < results.length && (
                <Button variant="outline" className="rounded-full" onClick={() => setPage((p) => p + 1)}>
                  Load more
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <BottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-semibold">Brand</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={!search.brand} onClick={() => update({ brand: undefined })}>Any</Chip>
                {brands.map((b) => (
                  <Chip key={b} active={search.brand === b} onClick={() => update({ brand: b })}>{b}</Chip>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 flex justify-between text-sm">
                <span className="font-semibold">Max price</span>
                <span className="text-muted-foreground">{search.maxPrice ? formatINR(search.maxPrice) : "Any"}</span>
              </div>
              <Slider
                min={500}
                max={40000}
                step={500}
                value={[search.maxPrice ?? 40000]}
                onValueChange={([v]) => update({ maxPrice: v >= 40000 ? undefined : v })}
              />
            </div>
            <label className="flex items-center justify-between text-sm font-semibold">
              In stock only
              <Switch checked={!!search.inStock} onCheckedChange={(v) => update({ inStock: v || undefined })} />
            </label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => update({ brand: undefined, maxPrice: undefined, inStock: undefined })}>
                Reset
              </Button>
              <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
                Show {results.length} results
              </Button>
            </div>
          </div>
      </BottomSheet>
    </Screen>
  );
}

function Chip({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
      )}
    >
      {children}
    </button>
  );
}
