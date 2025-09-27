import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avto-Hisob",
  description: "VIN hisobi, foyda, ulushlar, kapital",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white text-gray-900`}>
        <header className="border-b bg-gray-50">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
            <Link className="font-semibold" href="/">Panel</Link>
            <Link href="/cars">Avtomobillar</Link>
            <Link href="/expenses">Xarajatlar</Link>
            <Link href="/incomes">Daromadlar (qo&#39;lda)</Link>
            <Link href="/fx">Kurslar</Link>
            <Link href="/capital">Kapital</Link>
            <Link href="/reports">Hisobotlar</Link>

          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
