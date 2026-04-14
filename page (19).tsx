"use client";
import { useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { formatNGN } from "@/lib/api";

interface Props {
  variantId: number;
  currentLowestPrice: number;
}

type State = "idle" | "open" | "loading" | "success" | "error";

export default function PriceAlertWidget({ variantId, currentLowestPrice }: Props) {
  const [state, setState] = useState<State>("idle");
  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState(
    Math.floor(currentLowestPrice * 0.9).toString()
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function submit() {
    if (!email || !targetPrice) return;
    setState("loading");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/user/alerts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_variant_id: variantId,
            email,
            target_price: parseFloat(targetPrice),
          }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      setState("success");
    } catch (e: any) {
      setErrorMsg("Something went wrong. Please try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-green-500/30 bg-green-500/5 text-green-400 text-sm">
        <Check size={16} />
        <span>
          We'll email <strong>{email}</strong> when the price drops to{" "}
          <strong>{formatNGN(parseFloat(targetPrice))}</strong>.
        </span>
      </div>
    );
  }

  if (state === "idle") {
    return (
      <button
        onClick={() => setState("open")}
        className="flex items-center gap-2 text-sm px-4 py-2.5 border border-border rounded-xl text-muted hover:border-brand-500 hover:text-brand-500 transition-colors w-full justify-center"
      >
        <Bell size={15} />
        Set a price alert
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-display font-semibold text-white text-sm flex items-center gap-2">
          <Bell size={15} className="text-brand-500" />
          Price Alert
        </p>
        <button
          onClick={() => setState("idle")}
          className="text-muted hover:text-white"
          aria-label="Close"
        >
          <BellOff size={14} />
        </button>
      </div>

      <p className="text-muted text-xs">
        Current lowest: <span className="text-white">{formatNGN(currentLowestPrice)}</span>.
        We'll email you when it drops below your target.
      </p>

      <div className="space-y-2">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-brand-500 transition-colors"
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₦</span>
          <input
            type="number"
            placeholder="Target price"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-7 pr-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {state === "error" && (
        <p className="text-red-400 text-xs">{errorMsg}</p>
      )}

      <button
        onClick={submit}
        disabled={state === "loading" || !email || !targetPrice}
        className="w-full py-2 rounded-lg bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        {state === "loading" ? "Setting alert…" : "Notify me"}
      </button>
    </div>
  );
}
