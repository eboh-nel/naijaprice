import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "NaijaPrice – Compare Prices Across Nigerian Online Stores",
    template: "%s | NaijaPrice",
  },
  description:
    "Find the cheapest prices on phones, laptops, and appliances across Jumia, Konga, Kara, and more Nigerian online stores.",
  keywords: ["price comparison Nigeria", "cheapest prices Nigeria", "Jumia vs Konga", "buy cheap online Nigeria"],
  openGraph: {
    siteName: "NaijaPrice",
    type: "website",
    locale: "en_NG",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
