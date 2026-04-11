const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    next: { revalidate: 300 }, // 5-min ISR cache
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`);
  return res.json();
}

export async function searchProducts(params: {
  q: string;
  category?: string;
  store?: string;
  min_price?: number;
  max_price?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return fetchAPI(`/api/search?${qs}`);
}

export async function getProduct(slug: string, variantId?: string) {
  const qs = variantId ? `?variant_id=${variantId}` : "";
  return fetchAPI(`/api/products/${slug}${qs}`);
}

export async function getStores() {
  return fetchAPI("/api/stores");
}

export async function getCategories() {
  return fetchAPI("/api/categories");
}

export function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
