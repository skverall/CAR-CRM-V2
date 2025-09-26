"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  return (
    <div className="ml-auto flex items-center gap-2 text-sm">
      <Link href={pathname} locale="ru" className="px-2 py-1 border rounded hover:bg-gray-100">RU</Link>
      <Link href={pathname} locale="en" className="px-2 py-1 border rounded hover:bg-gray-100">EN</Link>
    </div>
  );
}

