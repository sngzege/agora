import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Agora",
  description: "Felsefi Simülasyon Ağı",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} ${playfair.variable} bg-zinc-950 text-zinc-100 font-sans antialiased min-h-screen selection:bg-amber-500/30 selection:text-amber-200`}>
        {children}
      </body>
    </html>
  );
}
