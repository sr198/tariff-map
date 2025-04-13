import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "US Tariff Map",
  description: "Interactive visualization of US trade tariffs and relationships",
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
