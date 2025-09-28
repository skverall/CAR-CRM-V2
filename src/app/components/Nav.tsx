"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/app/i18n/LangContext";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";

export default function Nav() {
  const pathname = usePathname();
  const t = useT();
  const links = [
    { href: "/", label: t("nav.panel") },
    { href: "/cars", label: t("nav.cars") },
    { href: "/expenses", label: t("nav.expenses") },
    { href: "/incomes", label: t("nav.incomes") },
    { href: "/fx", label: t("nav.fx") },
    { href: "/capital", label: t("nav.capital") },
    { href: "/reports", label: t("nav.reports") },
    { href: "/guide", label: t("nav.guide") },
  ];
  return (
    <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4 overflow-x-auto">
      {links.map(({ href, label }) => {
        const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={
              "px-3 py-1.5 rounded-md text-sm transition-colors whitespace-nowrap " +
              (active
                ? "bg-blue-600 text-white font-semibold"
                : "text-gray-700 hover:bg-gray-100")
            }
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
      <div className="flex-1" />
      <LanguageSwitcher />
    </nav>
  );
}

