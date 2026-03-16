import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech Stock Dashboard",
  description: "Real-time tech stock tracker for top 20 global tech companies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-gray-950 antialiased">
        {children}
      </body>
    </html>
  );
}
