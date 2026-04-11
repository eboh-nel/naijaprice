import SearchBar from "@/components/SearchBar";
import CategoryGrid from "@/components/CategoryGrid";
import RecentDeals from "@/components/RecentDeals";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <p className="font-mono text-brand-500 text-sm tracking-widest uppercase mb-4">
            Nigeria's Price Comparison Engine
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Stop Overpaying.
            <br />
            <span className="text-brand-500">Compare First.</span>
          </h1>
          <p className="text-muted text-lg mb-10 max-w-xl mx-auto">
            Search products across Jumia, Konga, Kara and more — real prices, updated daily.
          </p>
          <SearchBar size="lg" />
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display text-2xl font-bold mb-8">Browse Categories</h2>
        <CategoryGrid />
      </section>

      {/* Recent Deals */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="font-display text-2xl font-bold mb-8">Recent Price Drops</h2>
        <RecentDeals />
      </section>
    </div>
  );
}
