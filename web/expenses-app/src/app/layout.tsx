import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Расходы | CRM",
  description: "Простое приложение для учета расходов (Supabase)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header className="app-header">
          <nav className="nav">
            <a href="/">Домой</a>
            <a href="/expenses">Расходы</a>
            <a href="/dashboard">Дашборд</a>
          </nav>
        </header>
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
}
