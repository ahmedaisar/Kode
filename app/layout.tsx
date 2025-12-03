import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lovable Clone",
  description: "A clone of Lovable.dev - An AI-powered development platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
