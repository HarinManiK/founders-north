import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSiteUrl } from "@/lib/site";

const SITE_URL = getSiteUrl();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Founders North - Tech, Startup & Business Intelligence",
    template: "%s | Founders North",
  },
  description:
    "Daily briefings, in-depth analysis, and essential news curated from top industry sources for founders, operators, and business leaders.",
  keywords: [
    "Founders North",
    "Startup Intelligence",
    "Tech News",
    "AI News",
    "Business Briefing",
    "Daily Tech Digest",
    "Founder Insights",
    "Venture Capital",
  ],
  authors: [{ name: "Founders North Editorial", url: SITE_URL }],
  creator: "Founders North",
  publisher: "Founders North",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Founders North",
    title: "Founders North - Tech, Startup & Business Intelligence",
    description:
      "Daily briefings, in-depth analysis, and essential news for founders, operators, and business leaders.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Founders North Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Founders North - Tech, Startup & Business Intelligence",
    description:
      "Daily briefings, in-depth analysis, and essential news for founders, operators, and business leaders.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Founders North RSS Feed"
          href="/feed.xml"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('fn-theme');
                  if (theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
