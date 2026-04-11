"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const CATEGORIES = [
  { label: "All", slug: "" },
  { label: "Phones", slug: "phones" },
  { label: "Laptops", slug: "laptops" },
  { label: "TVs", slug: "televisions" },
  { label: "Appliances", slug: "home-appliances" },
];

const STORES = [
  { label: "All Stores", slug: "" },
  { label: "Jumia", slug: "jumia" },
  { label: "Konga", slug: "konga" },
  { label: "Kara", slug: "kara" },
];

interface Props {
  searchParams: { q?: string; category?: string; store?: string; min?: string; max?: string };
}

export default function SearchFilters({ searchParams }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [minPrice, setMinPrice] = useState(searchParams.min || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.max || "");

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams({
      q: searchParams.q || "",
      ...(searchParams.category ? { category: searchParams.category } : {}),
      ...(searchParams.store ? { store: searchParams.store } : {}),
      ...(searchParams.min ? { min: searchParams.min } : {}),
      ...(searchParams.max ? { max: searchParams.max } : {}),
      ...updates,
    });
    // Remove empty
    [...params.keys()].forEach((k) => { if (!params.get(k)) params.delete(k); });
    startTransition(() => router.push(`/search?${params.toString()}`));
  }

  return (
    <div className="space-y-7">
      {/* Category */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Category</p>
        <div className="space-y-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => navigate({ category: c.slug })}
              className={`block w-full text-left text-sm px-3 py-2 rounded transition-colors ${
                (searchParams.category || "") === c.slug
                  ? "bg-brand-500/10 text-brand-500 font-medium"
                  : "text-muted hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Store */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Store</p>
        <div className="space-y-1">
          {STORES.map((s) => (
            <button
              key={s.slug}
              onClick={() => navigate({ store: s.slug })}
              className={`block w-full text-left text-sm px-3 py-2 rounded transition-colors ${
                (searchParams.store || "") === s.slug
                  ? "bg-brand-500/10 text-brand-500 font-medium"
                  : "text-muted hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Price Range (₦)</p>
        <div className="space-y-2">
          <input
            type="number"
            placeholder="Min price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full bg-panel border border-border rounded px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-brand-500"
          />
          <input
            type="number"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full bg-panel border border-border rounded px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-brand-500"
          />
          <button
            onClick={() => navigate({ min: minPrice, max: maxPrice })}
            className="w-full text-sm bg-brand-500 hover:bg-brand-400 text-white rounded py-2 transition-colors font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
