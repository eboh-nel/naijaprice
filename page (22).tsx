import Link from "next/link";

const CATEGORIES = [
  { label: "Phones & Tablets", slug: "phones", emoji: "📱", desc: "Smartphones, tablets, accessories" },
  { label: "Laptops", slug: "laptops", emoji: "💻", desc: "Windows, MacOS, Chromebooks" },
  { label: "Televisions", slug: "televisions", emoji: "📺", desc: "Smart TVs, OLED, 4K" },
  { label: "Home Appliances", slug: "home-appliances", emoji: "🏠", desc: "Fridges, washing machines, ACs" },
  { label: "Generators", slug: "generators", emoji: "⚡", desc: "Inverters, solar, generators" },
  { label: "Kitchen", slug: "kitchen", emoji: "🍳", desc: "Blenders, microwaves, cookers" },
];

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={`/category/${cat.slug}`}
          className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-panel hover:border-brand-500/50 hover:bg-brand-500/5 transition-all"
        >
          <span className="text-2xl shrink-0 mt-0.5">{cat.emoji}</span>
          <div>
            <p className="font-display font-semibold text-white text-sm group-hover:text-brand-500 transition-colors leading-tight">
              {cat.label}
            </p>
            <p className="text-muted text-xs mt-0.5 leading-snug">{cat.desc}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
