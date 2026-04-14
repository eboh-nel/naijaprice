import { searchProducts, formatNGN, timeAgo } from "@/lib/api";
import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

interface Props {
  searchParams: { q?: string; category?: string; store?: string; min?: string; max?: string };
}

export default async function SearchResults({ searchParams }: Props) {
  const { q = "", category, store, min, max } = searchParams;

  let data: any;
  try {
    data = await searchProducts({
      q,
      category,
      store,
      min_price: min ? Number(min) : undefined,
      max_price: max ? Number(max) : undefined,
    });
  } catch {
    return (
      <p className="text-red-400 text-sm">Failed to fetch results. Make sure the API is running.</p>
    );
  }

  const { results, total } = data;

  if (!results.length) {
    return (
      <div className="text-center py-20">
        <p className="text-muted text-lg">No results for "<span className="text-white">{q}</span>"</p>
        <p className="text-muted text-sm mt-2">Try a different search or check spelling.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-muted text-sm mb-5">{total} result{total !== 1 ? "s" : ""} for "{q}"</p>
      <div className="space-y-4">
        {results.map((r: any) => {
          const cheapest = r.stores[0];
          const hasDiscount = cheapest?.old_price && cheapest.old_price > cheapest.price;
          const discountPct = hasDiscount
            ? Math.round((1 - cheapest.price / cheapest.old_price) * 100)
            : null;

          return (
            <Link
              key={`${r.product_id}-${r.variant_id}`}
              href={`/product/${r.slug}?variant=${r.variant_id}`}
              className="group flex items-start gap-4 p-4 rounded-xl border border-border hover:border-brand-500/50 bg-panel hover:bg-panel/80 transition-all"
            >
              {/* Image */}
              <div className="w-20 h-20 rounded-lg bg-surface border border-border shrink-0 flex items-center justify-center overflow-hidden">
                {r.image_url ? (
                  <img src={r.image_url} alt={r.product_name} className="object-contain w-full h-full p-1.5" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display font-semibold text-white group-hover:text-brand-500 transition-colors leading-tight">
                      {r.product_name}
                    </h3>
                    <p className="text-muted text-xs mt-0.5">{r.variant_label}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-brand-500 text-lg">{formatNGN(r.lowest_price)}</p>
                    {discountPct && (
                      <p className="text-green-400 text-xs font-medium">-{discountPct}%</p>
                    )}
                  </div>
                </div>

                {/* Store chips */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {r.stores.slice(0, 3).map((s: any) => (
                    <span
                      key={s.store}
                      className="inline-flex items-center gap-1 text-xs text-muted border border-border rounded px-2 py-0.5"
                    >
                      <Store size={10} />
                      {s.store} – {formatNGN(s.price)}
                    </span>
                  ))}
                  {r.stores.length > 3 && (
                    <span className="text-xs text-muted">+{r.stores.length - 3} more</span>
                  )}
                  <span className="ml-auto text-muted text-xs">
                    {r.last_updated ? timeAgo(r.last_updated) : ""}
                  </span>
                </div>
              </div>

              <ArrowRight size={16} className="text-muted shrink-0 mt-1 group-hover:text-brand-500 transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
