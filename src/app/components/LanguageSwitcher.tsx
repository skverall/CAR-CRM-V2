"use client";
import { useLang } from "@/app/i18n/LangContext";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="ml-auto inline-flex items-center gap-1 rounded-md border bg-white p-0.5">
      <button
        type="button"
        onClick={() => setLang("uz")}
        className={
          "px-2 py-1 text-xs rounded " +
          (lang === "uz" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100")
        }
        aria-pressed={lang === "uz"}
      >
        UZ
      </button>
      <button
        type="button"
        onClick={() => setLang("ru")}
        className={
          "px-2 py-1 text-xs rounded " +
          (lang === "ru" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100")
        }
        aria-pressed={lang === "ru"}
      >
        RU
      </button>
    </div>
  );
}

