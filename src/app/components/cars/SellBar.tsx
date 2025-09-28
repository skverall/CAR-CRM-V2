"use client";
import { useState } from "react";
import Modal from "@/app/components/ui/Modal";
import RatePrefill from "@/app/components/RatePrefill";
import { useT } from "@/app/i18n/LangContext";

export default function SellBar({
  carId,
  onSell,
}: {
  carId: string;
  onSell: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-red-200 bg-red-100 text-red-800 hover:bg-red-200 px-3 py-2 rounded font-medium inline-flex items-center gap-2"
        title={t("sell.cta")}
      >
        <span>🛒</span>
        <span>{t("sell.cta")}</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("sell.modalTitle") as string}>
        <form action={onSell} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <RatePrefill currencyName="currency" dateName="occurred_at" rateName="rate_to_aed" />
          <input type="hidden" name="car_id" value={carId} />
          <label className="text-xs text-gray-600 col-span-2 sm:col-span-4">{t("sell.note")}</label>
          <input name="occurred_at" type="date" required className="border px-2 py-1 rounded" aria-label={t("sell.date")} />
          <input name="amount" type="number" step="0.01" required placeholder={t("sell.amount")} className="border px-2 py-1 rounded" />
          <input name="currency" required placeholder={t("sell.currency")} className="border px-2 py-1 rounded" />
          <input name="rate_to_aed" type="number" step="0.000001" required placeholder={t("sell.rate")} className="border px-2 py-1 rounded" />
          <input name="description" placeholder={t("sell.desc")} defaultValue="[SALE] Auto sale" className="border px-2 py-1 rounded col-span-2 sm:col-span-4" />
          <div className="col-span-2 sm:col-span-4 flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">{t("sell.submit")}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

