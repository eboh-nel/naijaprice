import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Nigerian Online Stores",
  description: "All Nigerian online stores tracked by NaijaPrice.",
  alternates: { canonical: "https://naijaprice.ng/stores" },
};

const STORES = [
  {
    name: "Jumia",
    slug: "jumia",
    url: "https://www.jumia.com.ng",
    logo: "🛒",
    desc: "Nigeria's largest e-commerce marketplace with millions of products.",
    categories: ["Phones", "Laptops", "TVs", "Fashion", "Groceries"],
    tracked: true,
  },
  {
    name: "Konga",
    slug: "konga",
    url: "https://www.konga.com",
    logo: "🛍",
    desc: "One of Nigeria's oldest online retailers, known for electronics and phones.",
    categories: ["Phones", "Laptops", "Appliances", "Computing"],
    tracked: true,
  },
  {
    name: "Kara",
    slug: "kara",
    url: "https://www.kara.com.ng",
    logo: "📦",
    desc: "Electronics-focused retailer with strong brand partnerships.",
    categories: ["TVs", "Phones", "Appliances", "Gaming"],
    tracked: true,
  },
  {
    name: "Slot",
    slug: "slot",
    url: "https://slot.ng",
    logo: "📱",
    desc: "Primarily phones and accessories, one of the most trusted in Nigeria.",
    categories: ["Phones", "Accessories", "Gadgets"],
    tracked: false,
  },
  {
    name: "PricePally",
    slug: "pricepally",
    url: "https://pricepally.com",
    logo: "🥦",
    desc: "Group-buying platform focused on fresh groceries and food.",
    categories: ["Groceries", "Food", "Fresh Produce"],
    tracked: false,
  },
];

export default function StoresPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl font-bold text-white mb-2">Nigerian Online Stores</h1>
      <p className="text-muted mb-10">We track prices from these stores, with more being added regularly.</p>

      <div className="space-y-4">
        {STORES.map((store) => (
          <div
            key={store.slug}
            className="flex items-start gap-5 p-5 rounded-xl border border-border bg-panel"
          >
            <span className="text-3xl shrink-0">{store.logo}</span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-white text-lg">{store.name}</h2>
                {store.tracked ? (
                  <span className="text-[10px] font-bold bg-brand-500/10 text-brand-500 border border-brand-500/30 px-2 py-0.5 rounded uppercase tracking-wide">
                    Tracked ✓
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-border text-muted px-2 py-0.5 rounded uppercase tracking-wide">
                    Coming Soon
                  </span>
                )}
              </div>

              <p className="text-muted text-sm mt-1 mb-3">{store.desc}</p>

              <div className="flex items-center gap-2 flex-wrap">
                {store.categories.map((c) => (
                  <span key={c} className="text-xs text-muted border border-border rounded px-2 py-0.5">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {store.tracked && (
                <Link
                  href={`/search?store=${store.slug}`}
                  className="text-xs px-3 py-1.5 bg-brand-500 hover:bg-brand-400 text-white rounded font-medium transition-colors text-center"
                >
                  View Prices
                </Link>
              )}
              <a
                href={store.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 border border-border text-muted hover:text-white rounded font-medium transition-colors text-center flex items-center gap-1 justify-center"
              >
                Visit <ExternalLink size={10} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
