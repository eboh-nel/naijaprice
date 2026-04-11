import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import SearchFilters from "@/components/SearchFilters";
import type { Metadata } from "next";

interface Props {
  searchParams: { q?: string; category?: string; store?: string; min?: string; max?: string };
}

export function generateMetadata({ searchParams }: Props): Metadata {
  const q = searchParams.q || "";
  return {
    title: q ? `"${q}" prices in Nigeria` : "Search products",
    description: `Compare prices for "${q}" across Nigerian online stores.`,
  };
}

export default function SearchPage({ searchParams }: Props) {
  const query = searchParams.q || "";

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <SearchBar initialValue={query} />
      </div>

      {query ? (
        <div className="flex gap-8">
          {/* Filters sidebar */}
          <aside className="hidden md:block w-56 shrink-0">
            <SearchFilters searchParams={searchParams} />
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <Suspense
              key={JSON.stringify(searchParams)}
              fallback={<ResultsSkeleton />}
            >
              <SearchResults searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 text-muted">
          <p className="text-lg">Enter a product name to compare prices.</p>
        </div>
      )}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-36 rounded-lg bg-panel animate-pulse" />
      ))}
    </div>
  );
}
