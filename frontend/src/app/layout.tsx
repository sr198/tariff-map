import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "TariffMap | Interactive US Trade and Tariff Map by Country",
  description: "Explore US trade relationships through an interactive map. Visualize trade deficits, tariffs, and economic relationships between the US and other countries. Perfect for economists, students, and trade analysts.",
  keywords: [
    // Primary Keywords
    "US tariff map",
    "global tariff map",
    "trade tariffs by country",
    "tariff comparison tool",
    "2025 US tariffs",
    "Trump tariffs",
    "World Bank tariff data",
    "trade imbalance US",
    // Secondary Keywords
    "US import export data",
    "country-wise trade info for US",
    "free trade agreements",
    "customs duties and tariffs",
    // Existing Keywords
    "US trade",
    "trade deficit",
    "tariffs",
    "trade visualization",
    "economic map",
    "US imports",
    "US exports",
    "trade balance",
    "international trade",
    "economic data",
    "tariff map",
    "trade map",
    "deficit map",
    "trade analysis",
    "trade relationships",
    "global trade",
    "trade statistics",
    "trade policy",
    "economic relationships",
    "trade data",
    "interactive map",
    "data visualization"
  ].join(", "),
  authors: [{ name: "Srijan Nepal" }],
  creator: "Srijan Nepal",
  publisher: "Aiselu AI - TariffMap.Live",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' }
    ]
  },
  manifest: '/favicon/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#669966',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-gray-50 text-gray-900 antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
