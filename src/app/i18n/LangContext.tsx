"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries, type LangCode } from "./dictionaries";

type Ctx = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (path: string, fallback?: string) => string;
};

const LangContext = createContext<Ctx | null>(null);

function get(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("uz");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && window.localStorage.getItem("lang")) as LangCode | null;
    if (saved === "ru" || saved === "uz") setLangState(saved);
  }, []);

  const setLang = (l: LangCode) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem("lang", l);
  };

  const t = useMemo(() => {
    return (path: string, fallback?: string) => {
      const dict = dictionaries[lang] as Record<string, unknown>;
      const val = get(dict, path);
      return typeof val === "string" ? val : (fallback ?? path);
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

export function useT() {
  return useLang().t;
}

