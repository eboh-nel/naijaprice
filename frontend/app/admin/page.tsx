"use client";
import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle, XCircle, Play } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function api(path: string, method = "GET", body?: object) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export default function AdminPage() {
  const [unmatched, setUnmatched] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [u, j] = await Promise.all([
        api("/api/admin/unmatched"),
        api("/api/admin/scrape-jobs"),
      ]);
      setUnmatched(u);
      setJobs(j);
    } catch (e) {
      setActionMsg("Failed to load admin data. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function approveMatch(reviewId: number, variantId: number) {
    try {
      await api(`/api/admin/match/${reviewId}?variant_id=${variantId}`, "POST");
      setActionMsg(`Matched review #${reviewId}`);
      load();
    } catch { setActionMsg("Match failed."); }
  }

  async function rejectMatch(reviewId: number) {
    try {
      await api(`/api/admin/reject/${reviewId}`, "POST");
      setActionMsg(`Rejected review #${reviewId}`);
      load();
    } catch { setActionMsg("Reject failed."); }
  }

  async function runScraper(store: string) {
    try {
      await api(`/api/admin/run-scraper/${store}`, "POST");
      setActionMsg(`Queued scraper: ${store}`);
    } catch { setActionMsg("Failed to queue scraper."); }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold text-white">Admin Dashboard</h1>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-muted hover:text-white border border-border px-3 py-1.5 rounded transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {actionMsg && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-500 text-sm">
          {actionMsg}
        </div>
      )}

      {/* Scraper controls */}
      <section className="mb-10">
        <h2 className="font-display text-lg font-semibold mb-4">Run Scrapers</h2>
        <div className="flex gap-3 flex-wrap">
          {["jumia", "konga", "kara"].map((store) => (
            <button
              key={store}
              onClick={() => runScraper(store)}
              className="flex items-center gap-2 text-sm px-4 py-2 bg-panel border border-border rounded-lg hover:border-brand-500 hover:text-brand-500 transition-colors capitalize"
            >
              <Play size={13} /> {store}
            </button>
          ))}
        </div>
      </section>

      {/* Scrape jobs */}
      <section className="mb-10">
        <h2 className="font-display text-lg font-semibold mb-4">Recent Scrape Jobs</h2>
        {loading ? (
          <div className="h-32 rounded-xl bg-panel animate-pulse" />
        ) : jobs.length === 0 ? (
          <p className="text-muted text-sm">No jobs yet. Trigger a scraper above.</p>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-panel text-muted text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-left px-4 py-3">Store</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Pages</th>
                  <th className="text-right px-4 py-3">Errors</th>
                  <th className="text-left px-4 py-3">Started</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j: any) => (
                  <tr key={j.id} className="border-b border-border last:border-0 hover:bg-panel/60">
                    <td className="px-4 py-3 text-muted font-mono">#{j.id}</td>
                    <td className="px-4 py-3 text-white capitalize">{j.store_id}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        j.status === "completed" ? "bg-green-500/10 text-green-400" :
                        j.status === "failed"    ? "bg-red-500/10 text-red-400" :
                        j.status === "running"   ? "bg-brand-500/10 text-brand-500" :
                        "bg-border text-muted"
                      }`}>{j.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted">{j.pages_scraped ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-red-400">{j.errors_count ?? "—"}</td>
                    <td className="px-4 py-3 text-muted text-xs">
                      {j.started_at ? new Date(j.started_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Unmatched listings */}
      <section>
        <h2 className="font-display text-lg font-semibold mb-4">
          Unmatched Listings
          {unmatched.length > 0 && (
            <span className="ml-2 text-sm font-normal text-brand-500">({unmatched.length} pending)</span>
          )}
        </h2>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-panel animate-pulse" />)}</div>
        ) : unmatched.length === 0 ? (
          <p className="text-muted text-sm">No unmatched listings. 🎉</p>
        ) : (
          <div className="space-y-3">
            {unmatched.map((item: any) => (
              <div key={item.review_id} className="p-4 rounded-xl border border-border bg-panel flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium leading-snug line-clamp-2">
                    {item.listing_title || `Listing #${item.listing_id}`}
                  </p>
                  <p className="text-muted text-xs mt-1">
                    Confidence: <span className="text-white">{(item.confidence_score * 100).toFixed(0)}%</span>
                    {item.suggested_variant_id && (
                      <span> · Suggested variant: <span className="text-white">#{item.suggested_variant_id}</span></span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {item.suggested_variant_id && (
                    <button
                      onClick={() => approveMatch(item.review_id, item.suggested_variant_id)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded hover:bg-green-500/20 transition-colors"
                    >
                      <CheckCircle size={12} /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => rejectMatch(item.review_id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded hover:bg-red-500/20 transition-colors"
                  >
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
