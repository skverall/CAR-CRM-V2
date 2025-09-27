"use client";
import { useEffect, useState } from "react";

type AllocationItem = {
  car_id: string;
  vin?: string;
  ratio?: number;
  amount_aed?: number;
};

export default function OverheadPreview(props: {
  orgId: string | null | undefined;
  amountName?: string;
  rateName?: string;
  dateName?: string;
  carSelectName?: string;
  generalAccountName?: string;
}) {
  const {
    orgId,
    amountName = "amount",
    rateName = "rate_to_aed",
    dateName = "occurred_at",
    carSelectName = "car_id",
    generalAccountName = "general_account",
  } = props;

  const [items, setItems] = useState<AllocationItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Debounced preview
  useEffect(() => {
    if (!orgId) return;
    let t: ReturnType<typeof setTimeout> | null = null;

    const handler = () => {
      const amountEl = document.querySelector<HTMLInputElement>(`[name="${amountName}"]`);
      const rateEl = document.querySelector<HTMLInputElement>(`[name="${rateName}"]`);
      const dateEl = document.querySelector<HTMLInputElement>(`[name="${dateName}"]`);
      const carEl = document.querySelector<HTMLSelectElement>(`[name="${carSelectName}"]`);
      const generalEl = document.querySelector<HTMLSelectElement>(`[name="${generalAccountName}"]`);
      const hasCar = !!(carEl && carEl.value);

      if (generalEl) generalEl.disabled = hasCar;
      setHidden(hasCar);
      if (hasCar) { setItems(null); return; }

      const amount = amountEl && amountEl.value ? Number(amountEl.value) : NaN;
      const rate = rateEl && rateEl.value ? Number(rateEl.value) : NaN;
      const amountAed = isFinite(amount) && isFinite(rate) ? Math.round(amount * rate * 100) / 100 : null;
      const date = dateEl?.value || "";
      if (!amountAed || !date) { setItems(null); return; }

      if (t) clearTimeout(t);
      t = setTimeout(async () => {
        try {
          setLoading(true);
          const resp = await fetch("/api/expenses/preview-allocation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ org_id: orgId, amount_aed: amountAed, date }),
          });
          const json = await resp.json() as { items?: Array<{ car_id: string; vin?: string; ratio?: number; amount_aed?: number; }> };
          const arr: AllocationItem[] = (json.items ?? []).map((x) => ({
            car_id: x.car_id,
            vin: x.vin,
            ratio: x.ratio,
            amount_aed: x.amount_aed,
          }));
          setItems(arr);
        } catch (e) {
          setItems(null);
        } finally {
          setLoading(false);
        }
      }, 300);
    };

    document.addEventListener("input", handler);
    document.addEventListener("change", handler);
    // first run
    handler();

    return () => {
      document.removeEventListener("input", handler);
      document.removeEventListener("change", handler);
      if (t) clearTimeout(t);
    };
  }, [orgId]);

  if (!orgId || hidden) return null;

  return (
    <div className="col-span-2 sm:col-span-4 bg-yellow-50 border border-yellow-200 rounded p-2">
      <div className="text-xs text-yellow-900 font-medium mb-1">
        Umumiy/Shaxsiy xarajat taqsimoti (preview): {loading ? "Yuklanmoqda..." : null}
      </div>
      {!items || items.length === 0 ? (
        <div className="text-xs text-yellow-900">Ma&apos;lumot uchun: miqdor, kurs va sana toʻldirilganda taqsimot ko‘rinadi.</div>
      ) : (
        <ul className="text-xs text-yellow-900 grid sm:grid-cols-2 gap-1">
          {items.map((it) => (
            <li key={it.car_id} className="flex justify-between">
              <span>{it.vin || it.car_id}</span>
              <span>
                {(it.ratio ?? 0).toFixed(2)}% — AED {(it.amount_aed ?? 0).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

