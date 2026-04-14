import { ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatNGN, timeAgo } from "@/lib/api";
import clsx from "clsx";

interface Entry {
  store: string;
  store_logo?: string;
  price: number;
  old_price?: number;
  currency: string;
  stock_status: string;
  seller_name?: string;
  product_url: string;
  last_updated?: string;
  discount_pct?: number;
}

interface Props {
  entries: Entry[];
}

export default function ComparisonTable({ entries }: Props) {
  if (!entries.length) {
    return <p className="text-muted text-sm py-4">No listings found for this variant.</p>;
  }

  const cheapest = entries[0].price;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-panel text-muted text-xs uppercase tracking-wider">
            <th className="text-left px-5 py-3">Store</th>
            <th className="text-right px-5 py-3">Price</th>
            <th className="text-center px-5 py-3 hidden sm:table-cell">Stock</th>
            <th className="text-left px-5 py-3 hidden md:table-cell">Seller</th>
            <th className="text-right px-5 py-3 hidden md:table-cell">Updated</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const isCheapest = e.price === cheapest && i === 0;
            return (
              <tr
                key={`${e.store}-${i}`}
                className={clsx(
                  "border-b border-border last:border-0 transition-colors hover:bg-panel/60",
                  isCheapest && "bg-brand-500/5"
                )}
              >
                {/* Store */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    {e.store_logo ? (
                      <img src={e.store_logo} alt={e.store} className="w-6 h-6 object-contain rounded" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-border flex items-center justify-center text-xs font-bold text-muted">
                        {e.store[0]}
                      </div>
                    )}
                    <span className="font-medium text-white">{e.store}</span>
                    {isCheapest && (
                      <span className="text-[10px] font-bold bg-brand-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
                        Best
                      </span>
                    )}
                  </div>
                </td>

                {/* Price */}
                <td className="px-5 py-4 text-right">
                  <div>
                    <span className={clsx("font-semibold", isCheapest ? "text-brand-500 text-base" : "text-white")}>
                      {formatNGN(e.price)}
                    </span>
                    {e.old_price && (
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <span className="text-muted line-through text-xs">{formatNGN(e.old_price)}</span>
                        {e.discount_pct && (
                          <span className="text-green-400 text-xs font-medium">-{e.discount_pct}%</span>
                        )}
                      </div>
                    )}
                  </div>
                </td>

                {/* Stock */}
                <td className="px-5 py-4 text-center hidden sm:table-cell">
                  {e.stock_status === "in_stock" ? (
                    <CheckCircle size={16} className="text-green-400 mx-auto" />
                  ) : e.stock_status === "out_of_stock" ? (
                    <XCircle size={16} className="text-red-400 mx-auto" />
                  ) : (
                    <Clock size={16} className="text-muted mx-auto" />
                  )}
                </td>

                {/* Seller */}
                <td className="px-5 py-4 text-muted hidden md:table-cell text-xs">
                  {e.seller_name || "—"}
                </td>

                {/* Updated */}
                <td className="px-5 py-4 text-muted text-xs text-right hidden md:table-cell">
                  {e.last_updated ? timeAgo(e.last_updated) : "—"}
                </td>

                {/* CTA */}
                <td className="px-5 py-4 text-right">
                  <a
                    href={e.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border transition-colors",
                      isCheapest
                        ? "bg-brand-500 border-brand-500 text-white hover:bg-brand-400"
                        : "border-border text-muted hover:border-brand-500 hover:text-brand-500"
                    )}
                  >
                    Buy <ExternalLink size={11} />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
