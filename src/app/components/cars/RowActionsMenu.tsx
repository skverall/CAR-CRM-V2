"use client";

import Link from "next/link";
import { useState } from "react";
import Modal from "@/app/components/ui/Modal";
import Button from "@/app/components/ui/Button";
import { useT } from "@/app/i18n/LangContext";

export default function RowActionsMenu({
  carId,
  carVin,
  orgId,
  onSell,
}: {
  carId: string;
  carVin: string;
  orgId: string | null;
  onSell: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);
  const t = useT();

  async function submitExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("scope", "car");
    fd.set("car_id", carId);
    if (orgId) fd.set("org_id", orgId);
    const res = await fetch("/api/expenses", { method: "POST", body: fd });
    const j = await res.json();
    if (!j?.success) alert(j?.error || "Failed to add expense");
    setExpOpen(false);
    if (typeof window !== "undefined") window.location.reload();
  }

  async function submitSell(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await onSell(fd);
    setSellOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="w-8 h-8 inline-flex items-center justify-center rounded border bg-white hover:bg-gray-50"
        onClick={() => setOpen((v) => !v)}
        aria-label="More"
      >
        ⋯
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded border bg-white shadow z-20">
          <div className="py-1 text-sm">
            <Link href={`/cars/${carId}`} className="block px-3 py-2 hover:bg-gray-50" onClick={() => setOpen(false)}>
              {t("cars.table.view", "Ko'rish")}
            </Link>
            <Link href={`/cars/${carId}?edit=1`} className="block px-3 py-2 hover:bg-gray-50" onClick={() => setOpen(false)}>
              {t("common.edit", "Tahrirlash")}
            </Link>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { setOpen(false); setSellOpen(true); }}>
              {t("sell.cta", "Sotish")}
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { setOpen(false); setExpOpen(true); }}>
              {t("expenses.quickAdd.cta", "Xarajat qo\u2018shish")}
            </button>
          </div>
        </div>
      )}

      {/* Sell modal */}
      <Modal open={sellOpen} onClose={() => setSellOpen(false)} title={t("sell.modalTitle") as string}>
        <form onSubmit={submitSell} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input type="hidden" name="car_id" value={carId} />
          <input name="occurred_at" type="date" required className="border px-2 py-1 rounded" aria-label={t("sell.date")} />
          <input name="amount" type="number" step="0.01" required placeholder={t("sell.amount")} className="border px-2 py-1 rounded" />
          <input name="currency" required placeholder={t("sell.currency")} className="border px-2 py-1 rounded" defaultValue="AED" />
          <input name="rate_to_aed" type="number" step="0.000001" required placeholder={t("sell.rate")} className="border px-2 py-1 rounded" defaultValue="1" />
          <input name="description" placeholder={t("sell.desc")} defaultValue="[SALE] Auto sale" className="border px-2 py-1 rounded col-span-2 sm:col-span-4" />
          <div className="col-span-2 sm:col-span-4 flex justify-end gap-2 mt-2">
            <Button type="button" onClick={() => setSellOpen(false)} className="bg-gray-200 text-gray-900 hover:bg-gray-300">{t("common.cancel","Cancel")}</Button>
            <Button type="submit">{t("sell.submit")}</Button>
          </div>
        </form>
      </Modal>

      {/* Expense modal */}
      <Modal open={expOpen} onClose={() => setExpOpen(false)} title={t("expenses.quickAdd.title", "Xarajat tez qo\u2018shish") as string}>
        <form onSubmit={submitExpense} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input name="occurred_at" type="date" required className="border px-2 py-1 rounded" />
          <input name="amount" type="number" step="0.01" required placeholder={t("expenses.fields.amount","Miqdor")} className="border px-2 py-1 rounded" />
          <input name="currency" defaultValue="AED" placeholder={t("expenses.fields.currency","Valyuta")} className="border px-2 py-1 rounded" />
          <input name="rate_to_aed" type="number" step="0.000001" required defaultValue="1" placeholder={t("expenses.fields.rate","AED ga kurs")} className="border px-2 py-1 rounded" />
          <select name="category" className="border px-2 py-1 rounded">
            <option value="repair">{t('expenses.categories.repair','Ta\u2019mirlash')}</option>
            <option value="transport">{t('expenses.categories.transport','Transport')}</option>
            <option value="detailing">{t('expenses.categories.detailing','Detalling')}</option>
            <option value="ads">{t('expenses.categories.ads','Reklama')}</option>
            <option value="fees">{t('expenses.categories.fees','To\'lov/Komissiya')}</option>
            <option value="fuel">{t('expenses.categories.fuel','Yoqilg\'i')}</option>
            <option value="parking">{t('expenses.categories.parking','Parkovka')}</option>
            <option value="rent">{t('expenses.categories.rent','Ijara')}</option>
            <option value="salary">{t('expenses.categories.salary','Oylik')}</option>
            <option value="other">{t('expenses.categories.other','Boshqa')}</option>
          </select>
          <input name="description" placeholder={t('expenses.fields.description','Izoh')} className="border px-2 py-1 rounded col-span-2" />
          <input type="hidden" name="car_id" value={carId} />
          <input type="hidden" name="scope" value="car" />
          <input type="hidden" name="org_id" value={orgId || ''} />
          <div className="col-span-2 sm:col-span-4 flex gap-2 justify-end">
            <Button type="button" onClick={()=>setExpOpen(false)} className="bg-gray-200 text-gray-900 hover:bg-gray-300">{t('common.cancel','Bekor qilish')}</Button>
            <Button type="submit">{t('common.save','Saqlash')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

