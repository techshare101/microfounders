import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MicroFounder Network",
  description:
    "A calm home for people who build. Not a feed. Not a hustle space. A place to think clearly, build deliberately, and meet others doing the same.",
  metadataBase: new URL("https://microfounders.metalmindtech.com"),
  openGraph: {
    title: "MicroFounder Network",
    description: "A calm home for people who build.",
    type: "website",
    siteName: "MicroFounder Network",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MicroFounder Network",
    description: "A calm home for people who build.",
  },
  robots: {
    index: true,
    follow: true,
  },
  authors: [{ name: "MetalMindTech" }],
  creator: "MetalMindTech",
  publisher: "MetalMindTech",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="mf-vignette" aria-hidden="true" />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
