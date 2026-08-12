import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Predikt — Football Predictions & Expert Tips",
    template: "%s | Predikt",
  },
  description:
    "Data-driven football predictions with free daily tips and premium VIP picks. Premium 24-hour pass for KES 100 via Paystack — M-Pesa & cards supported.",
  keywords: [
    "football predictions",
    "soccer tips",
    "betting tips",
    "premium VIP tips",
    "sure tips",
    "football analysis",
    "predikt",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Predikt",
    title: "Predikt — Football Predictions & Expert Tips",
    description:
      "Free daily tips and premium VIP picks. Unlock everything for 24 hours with KES 100 via Paystack.",
    url: siteUrl,
    locale: "en_KE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Predikt — Football Predictions & Expert Tips",
    description:
      "Free daily tips and premium VIP picks. Unlock everything for 24 hours with KES 100 via Paystack.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0f1d] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
