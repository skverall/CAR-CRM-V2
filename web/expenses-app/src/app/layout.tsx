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
  title: "Expenses CRM",
  description: "Expenses website powered by Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header className="app-header">
          <nav className="nav">
            <a href="/">Home</a>
            <a href="/expenses">Expenses</a>
            <a href="/dashboard">Dashboard</a>
          </nav>
        </header>
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
}
