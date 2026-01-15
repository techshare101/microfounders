import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "MicroFounder Network",
  description: "A calm home for people who build. Not a feed. Not a hustle space. A place to think clearly, build deliberately, and meet others doing the same.",
  openGraph: {
    title: "MicroFounder Network",
    description: "A calm home for people who build.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
