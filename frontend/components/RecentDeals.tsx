// Server component – fetches recent price drops from API
import { formatNGN } from "@/lib/api";
import Link from "next/link";
import { TrendingDown } from "lucide-react";

// In a real app this would call /api/deals or /api/products?sort=discount
// For MVP, we show a static placeholder that is replaced once the API is live
async function getRecentDeals() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/search?q=samsung&limit=6`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).filter((r: any) => r.stores[0]?.old_price);
  } catch {
    return [];
  }
}

export default async function RecentDeals() {
  const deals = await getRecentDeals();

  if (!deals.length) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-panel border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {deals.map((deal: any) => {
        const cheapest = deal.stores[0];
        const discount = cheapest?.old_price
          ? Math.round((1 - cheapest.price / cheapest.old_price) * 100)
          : null;

        return (
          <Link
            key={`${deal.product_id}-${deal.variant_id}`}
            href={`/product/${deal.slug}?variant=${deal.variant_id}`}
            className="group flex flex-col p-4 rounded-xl border border-border bg-panel hover:border-brand-500/50 transition-all"
          >
            {/* Image */}
            <div className="w-full aspect-square rounded-lg bg-surface border border-border mb-3 flex items-center justify-center overflow-hidden">
              {deal.image_url ? (
                <img src={deal.image_url} alt={deal.product_name} className="object-contain w-full h-full p-2" />
              ) : (
                <span className="text-3xl">📦</span>
              )}
            </div>

            {/* Name */}
            <p className="text-xs text-white font-semibold leading-tight line-clamp-2 group-hover:text-brand-500 transition-colors mb-1">
              {deal.product_name}
            </p>
            <p className="text-muted text-xs mb-2">{deal.variant_label}</p>

            {/* Price */}
            <div className="mt-auto">
              <p className="text-brand-500 font-semibold text-sm">{formatNGN(deal.lowest_price)}</p>
              {cheapest?.old_price && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-muted line-through text-xs">{formatNGN(cheapest.old_price)}</span>
                  {discount && (
                    <span className="flex items-center gap-0.5 text-green-400 text-xs font-medium">
                      <TrendingDown size={10} /> {discount}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
