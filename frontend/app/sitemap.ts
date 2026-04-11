import { MetadataRoute } from "next";

const BASE_URL = "https://naijaprice.ng";

async function fetchAPI(path: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${path}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const STATIC_CATEGORIES = [
  "phones", "laptops", "televisions",
  "home-appliances", "generators", "kitchen",
];

const STATIC_STORES = ["jumia", "konga", "kara"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Try to get live product data; fall back to empty if API is down
  const searchRes = await fetchAPI("/api/search?q=samsung&limit=50");
  const products: Array<{ slug: string; last_updated?: string }> =
    (searchRes?.results || []).map((r: any) => ({
      slug: r.slug,
      last_updated: r.last_updated,
    }));

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/stores`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = STATIC_CATEGORIES.map((slug) => ({
    url: `${BASE_URL}/category/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const storePages: MetadataRoute.Sitemap = STATIC_STORES.map((slug) => ({
    url: `${BASE_URL}/stores/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/product/${p.slug}`,
    lastModified: p.last_updated ? new Date(p.last_updated) : new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...storePages, ...productPages];
}
