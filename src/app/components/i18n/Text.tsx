"use client";
import React from "react";
import { useT } from "@/app/i18n/LangContext";

export default function Text({ path, fallback, className }: { path: string; fallback?: string; className?: string }) {
  const t = useT();
  return <span className={className}>{t(path, fallback)}</span>;
}

