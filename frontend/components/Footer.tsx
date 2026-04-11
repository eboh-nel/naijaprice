import Link from "next/link";

const CATEGORIES = ["Phones", "Laptops", "Televisions", "Home Appliances"];
const STORES = ["Jumia", "Konga", "Kara"];

export default function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <p className="font-display font-bold text-lg mb-2">
            <span className="text-brand-500">Naija</span>
            <span className="text-white">Price</span>
          </p>
          <p className="text-muted text-xs leading-relaxed">
            Compare prices across Nigerian online stores and always find the best deal.
          </p>
        </div>

        {/* Categories */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Categories</p>
          <ul className="space-y-2">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link
                  href={`/category/${c.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-muted hover:text-white transition-colors"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Stores */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Stores</p>
          <ul className="space-y-2">
            {STORES.map((s) => (
              <li key={s}>
                <Link
                  href={`/stores/${s.toLowerCase()}`}
                  className="text-muted hover:text-white transition-colors"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* About */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">About</p>
          <ul className="space-y-2">
            <li><Link href="/about" className="text-muted hover:text-white transition-colors">How it works</Link></li>
            <li><Link href="/privacy" className="text-muted hover:text-white transition-colors">Privacy</Link></li>
            <li><a href="mailto:hello@naijaprice.ng" className="text-muted hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
          <p>© {new Date().getFullYear()} NaijaPrice. Prices updated daily.</p>
          <p>Not affiliated with any listed store. Prices may vary.</p>
        </div>
      </div>
    </footer>
  );
}
