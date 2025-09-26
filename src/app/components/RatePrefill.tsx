"use client";
import { useEffect } from "react";

export default function RatePrefill(props: { currencyName: string; dateName: string; rateName: string }) {
  const { currencyName, dateName, rateName } = props;

  useEffect(() => {
    function handler() {
      const currencyEl = document.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${currencyName}"]`);
      const dateEl = document.querySelector<HTMLInputElement>(`[name="${dateName}"]`);
      const rateEl = document.querySelector<HTMLInputElement>(`[name="${rateName}"]`);
      if (!currencyEl || !dateEl || !rateEl) return;
      const currency = (currencyEl as HTMLInputElement).value || "AED";
      const date = dateEl.value;
      if (!date) return;
      fetch(`/api/fx?currency=${encodeURIComponent(currency)}&date=${encodeURIComponent(date)}`)
        .then(r => r.json())
        .then(({ rate }) => {
          if (rate) rateEl.value = String(rate);
        })
        .catch(() => {});
    }
    const root = document;
    root.addEventListener("change", handler);
    handler();
    return () => root.removeEventListener("change", handler);
  }, [currencyName, dateName, rateName]);

  return null;
}

