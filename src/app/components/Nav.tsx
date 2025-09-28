"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Panel" },
  { href: "/cars", label: "Avtomobillar" },
  { href: "/expenses", label: "Xarajatlar" },
  { href: "/incomes", label: "Daromadlar (qo'lda)" },
  { href: "/fx", label: "Kurslar" },
  { href: "/capital", label: "Kapital" },
  { href: "/reports", label: "Hisobotlar" },
  { href: "/guide", label: "Qo'llanma" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4 overflow-x-auto">
      {links.map(({ href, label }) => {
        const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={
              "px-3 py-1.5 rounded-md text-sm transition-colors " +
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
    </nav>
  );
}

