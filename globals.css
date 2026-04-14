"use client";
// Fetches all variants for a product and lets user switch between them
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Variant {
  id: number;
  storage?: string;
  ram?: string;
  color?: string;
  variant_key: string;
}

interface Props {
  productSlug: string;
  currentVariantId: number;
}

export default function VariantSelector({ productSlug, currentVariantId }: Props) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/products/${productSlug}/variants`
    )
      .then((r) => (r.ok ? r.json() : []))
      .then(setVariants)
      .catch(() => {});
  }, [productSlug]);

  if (variants.length <= 1) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Variants</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const parts = [v.storage, v.ram ? `${v.ram} RAM` : null, v.color].filter(Boolean);
          const label = parts.join(" / ") || "Standard";
          const isActive = v.id === currentVariantId;

          return (
            <button
              key={v.id}
              onClick={() => router.push(`/product/${productSlug}?variant=${v.id}`)}
              className={`text-xs px-3 py-1.5 rounded border transition-colors font-medium ${
                isActive
                  ? "bg-brand-500 border-brand-500 text-white"
                  : "border-border text-muted hover:border-brand-500 hover:text-brand-500"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
