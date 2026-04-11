"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";

interface Props {
  size?: "sm" | "lg";
  initialValue?: string;
}

export default function SearchBar({ size = "sm", initialValue = "" }: Props) {
  const [value, setValue] = useState(initialValue);
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search
        size={size === "lg" ? 20 : 16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search phones, laptops, TVs…"
        className={clsx(
          "w-full bg-panel border border-border rounded-lg text-white placeholder-muted",
          "focus:outline-none focus:border-brand-500 transition-colors",
          size === "lg"
            ? "pl-11 pr-4 py-4 text-base"
            : "pl-9 pr-4 py-2.5 text-sm"
        )}
      />
      <button
        type="submit"
        className={clsx(
          "absolute right-2 top-1/2 -translate-y-1/2 bg-brand-500 hover:bg-brand-400",
          "text-white font-medium rounded transition-colors",
          size === "lg" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"
        )}
      >
        Search
      </button>
    </form>
  );
}
