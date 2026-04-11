import { Suspense } from "react";
import SearchResults from "@/components/SearchResults";
import SearchBar from "@/components/SearchBar";
import type { Metadata } from "next";

const CATEGORY_META: Record<string, { title: string; desc: string; query: string }> = {
  phones:           { title: "Phones & Tablets",   desc: "Compare smartphone and tablet prices across Nigerian stores.", query: "phone" },
  laptops:          { title: "Laptops",             desc: "Find the cheapest laptop prices in Nigeria.",                  query: "laptop" },
  televisions:      { title: "Televisions",         desc: "Smart TV price comparison in Nigeria.",                        query: "television" },
  "home-appliances":{ title: "Home Appliances",     desc: "Fridges, ACs, washing machines — compare prices.",            query: "appliance" },
  generators:       { title: "Generators & Inverters", desc: "Power backup solutions — compare prices in Nigeria.",      query: "generator" },
  kitchen:          { title: "Kitchen Appliances",  desc: "Compare prices on blenders, microwaves, and more.",           query: "kitchen" },
};

interface Props {
  params: { slug: string };
}

export function generateMetadata({ params }: Props): Metadata {
  const meta = CATEGORY_META[params.slug];
  if (!meta) return { title: "Category" };
  return {
    title: `${meta.title} prices in Nigeria`,
    description: meta.desc,
    alternates: { canonical: `https://naijaprice.ng/category/${params.slug}` },
  };
}

export default function CategoryPage({ params }: Props) {
  const meta = CATEGORY_META[params.slug];
  const title = meta?.title || params.slug;
  const defaultQuery = meta?.query || params.slug;

  const fakeSearchParams = { q: defaultQuery, category: params.slug };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl font-bold text-white mb-2">{title}</h1>
      {meta?.desc && <p className="text-muted mb-8">{meta.desc}</p>}

      <div className="mb-8 max-w-lg">
        <SearchBar initialValue={defaultQuery} />
      </div>

      <Suspense fallback={<div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-36 rounded-lg bg-panel animate-pulse" />)}</div>}>
        <SearchResults searchParams={fakeSearchParams} />
      </Suspense>
    </div>
  );
}
