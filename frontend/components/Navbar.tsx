"use client";
import Link from "next/link";
import { useState } from "react";
import SearchBar from "./SearchBar";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="font-display font-bold text-xl shrink-0">
          <span className="text-brand-500">Naija</span>
          <span className="text-white">Price</span>
        </Link>

        {/* Search – hidden on mobile */}
        <div className="flex-1 hidden md:block max-w-md">
          <SearchBar size="sm" />
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted ml-auto">
          <Link href="/search" className="hover:text-white transition-colors">Search</Link>
          <Link href="/stores" className="hover:text-white transition-colors">Stores</Link>
          <Link href="/category/phones" className="hover:text-white transition-colors">Phones</Link>
          <Link href="/category/laptops" className="hover:text-white transition-colors">Laptops</Link>
        </nav>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden ml-auto text-muted hover:text-white"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-panel px-6 py-4 space-y-4">
          <SearchBar size="sm" />
          <nav className="flex flex-col gap-3 text-sm">
            <Link href="/stores" onClick={() => setOpen(false)} className="text-muted hover:text-white">Stores</Link>
            <Link href="/category/phones" onClick={() => setOpen(false)} className="text-muted hover:text-white">Phones</Link>
            <Link href="/category/laptops" onClick={() => setOpen(false)} className="text-muted hover:text-white">Laptops</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
