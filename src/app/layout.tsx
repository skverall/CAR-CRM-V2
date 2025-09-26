import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import LanguageSwitcher from "./components/LanguageSwitcher";
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
  title: "Авто-Учёт",
  description: "VIN-учёт, прибыль, доли, капитал",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white text-gray-900`}>
        <header className="border-b bg-gray-50">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
            <Link className="font-semibold" href="/">Панель</Link>
            <Link href="/cars">Авто</Link>
            <Link href="/expenses">Расходы</Link>
            <Link href="/incomes">Доходы</Link>
            <Link href="/fx">Курсы</Link>
            <Link href="/capital">Капитал</Link>
            <Link href="/reports">Отчёты</Link>
            <LanguageSwitcher />
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
