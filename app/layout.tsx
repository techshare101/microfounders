export const metadata = {
  title: "MicroFounder Network",
  description: "A calm home for builders."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
