import { notFound } from "next/navigation";
import { getProduct } from "@/lib/api";
import ComparisonTable from "@/components/ComparisonTable";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import VariantSelector from "@/components/VariantSelector";
import type { Metadata } from "next";
import Image from "next/image";

interface Props {
  params: { slug: string };
  searchParams: { variant?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const data = await getProduct(params.slug);
    const name = `${data.product.brand} ${data.product.model}`;
    return {
      title: `${name} price in Nigeria`,
      description: `Compare ${name} prices across Nigerian online stores. Best deal today.`,
      alternates: { canonical: `https://naijaprice.ng/product/${params.slug}` },
      openGraph: {
        title: `${name} – Price Comparison Nigeria`,
        description: `Find the cheapest ${name} in Nigeria.`,
      },
    };
  } catch {
    return { title: "Product not found" };
  }
}

export default async function ProductPage({ params, searchParams }: Props) {
  let data;
  try {
    data = await getProduct(params.slug, searchParams.variant);
  } catch {
    notFound();
  }

  const { product, variant, comparison, price_history } = data;
  const lowestPrice = comparison[0]?.price;
  const name = `${product.brand} ${product.model}`;
  const heroImage = comparison[0]
    ? comparison.find((c: any) => c.product_url)?.product_url
    : null;

  // Build variant label
  const parts = [variant.storage, variant.ram ? `${variant.ram} RAM` : null, variant.color].filter(Boolean);
  const variantLabel = parts.join(" / ") || "Standard";

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted mb-6">
        <a href="/" className="hover:text-brand-500">Home</a>
        <span className="mx-2">/</span>
        <a href={`/search?q=${product.brand}`} className="hover:text-brand-500">{product.brand}</a>
        <span className="mx-2">/</span>
        <span className="text-white">{name}</span>
      </nav>

      {/* Product header */}
      <div className="flex flex-col md:flex-row gap-10 mb-12">
        {/* Image */}
        <div className="w-full md:w-64 shrink-0">
          <div className="aspect-square rounded-xl bg-panel border border-border flex items-center justify-center overflow-hidden">
            {comparison[0]?.product_url ? (
              <img
                src={comparison.find((c: any) => c.image_url)?.image_url || ""}
                alt={name}
                className="object-contain w-full h-full p-4"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <span className="text-muted text-5xl">📦</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-white mb-1">{name}</h1>
          <p className="text-muted mb-4">{variantLabel}</p>

          {lowestPrice !== undefined && (
            <div className="mb-6">
              <p className="text-muted text-sm mb-1">Lowest price today</p>
              <p className="font-display text-4xl font-bold text-brand-500">
                ₦{lowestPrice.toLocaleString()}
              </p>
              <p className="text-muted text-sm mt-1">
                Available from {comparison.length} store{comparison.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          <VariantSelector productSlug={params.slug} currentVariantId={variant.id} />
        </div>
      </div>

      {/* Comparison table */}
      <section className="mb-12">
        <h2 className="font-display text-xl font-semibold mb-4">Price Comparison</h2>
        <ComparisonTable entries={comparison} />
      </section>

      {/* Price history */}
      {price_history.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold mb-4">Price History</h2>
          <PriceHistoryChart data={price_history} />
        </section>
      )}
    </div>
  );
}
