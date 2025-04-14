import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "US Tariff Map - Interactive Trade Visualization",
  description: "Explore US trade relationships through an interactive map. Visualize trade deficits, tariffs, and economic relationships between the US and other countries. Perfect for economists, students, and trade analysts.",
  keywords: "US trade, trade deficit, tariffs, trade visualization, economic map, US imports, US exports, trade balance, international trade, economic data, tariff map, trade map, deficit map, trade analysis, trade relationships, global trade, trade statistics, trade policy, economic relationships, trade data, interactive map, data visualization",
  authors: [{ name: "Srijan Nepal" }],
  creator: "Srijan Nepal",
  publisher: "Aiselu AI - TariffMap.Live",
  openGraph: {
    title: "US Tariff and Trade Map - Interactive Trade Visualization",
    description: "Explore US trade relationships through an interactive map. Visualize trade deficits, tariffs, and economic relationships between the US and other countries.",
    url: "https://yourdomain.com",
    siteName: "US Tariff Map",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "US Tariff Map Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "US Tariff Map - Interactive Trade Visualization",
    description: "Explore US trade relationships through an interactive map. Visualize trade deficits, tariffs, and economic relationships.",
    images: ["/twitter-image.png"],
  },
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
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8814239581528072" crossOrigin="anonymous"></script>
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-gray-50 text-gray-900 antialiased`}>{children}</body>
    </html>
  );
}
