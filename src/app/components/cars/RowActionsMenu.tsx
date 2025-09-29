"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import Modal from "@/app/components/ui/Modal";
import Button from "@/app/components/ui/Button";
import { useT } from "@/app/i18n/LangContext";

export default function RowActionsMenu({
  carId,
  orgId,
  onSell,
}: {
  carId: string;
  carVin?: string;
  orgId: string | null;
  onSell: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useT();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

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
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        aria-expanded={open}
      >
        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-20 py-1 animate-in fade-in-0 zoom-in-95 duration-100">
            <Link
              href={`/cars/${carId}`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {t("cars.table.view", "Ko'rish")}
            </Link>

            <Link
              href={`/cars/${carId}?edit=1`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t("common.edit", "Tahrirlash")}
            </Link>

            <div className="border-t border-gray-100 my-1" />

            <button
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => { setOpen(false); setSellOpen(true); }}
            >
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              {t("sell.cta", "Sotish")}
            </button>

            <button
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => { setOpen(false); setExpOpen(true); }}
            >
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t("expenses.quickAdd.cta", "Xarajat qo'shish")}
            </button>
          </div>
        </>
      )}

      {/* Sell modal */}
      <Modal open={sellOpen} onClose={() => setSellOpen(false)} title={t("sell.modalTitle") as string} size="lg">
        <form onSubmit={submitSell} className="space-y-4">
          <input type="hidden" name="car_id" value={carId} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("sell.date", "Sana")}
              </label>
              <input
                name="occurred_at"
                type="date"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("sell.amount", "Miqdor")}
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("sell.currency", "Valyuta")}
              </label>
              <input
                name="currency"
                required
                placeholder="AED"
                defaultValue="AED"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("sell.rate", "AED ga kurs")}
              </label>
              <input
                name="rate_to_aed"
                type="number"
                step="0.000001"
                required
                placeholder="1.000000"
                defaultValue="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("sell.desc", "Izoh")}
            </label>
            <input
              name="description"
              placeholder="Avtomobil sotildi"
              defaultValue="[SALE] Auto sale"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={() => setSellOpen(false)}
              variant="secondary"
            >
              {t("common.cancel","Bekor qilish")}
            </Button>
            <Button
              type="submit"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
            >
              {t("sell.submit", "Sotish")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Expense modal */}
      <Modal open={expOpen} onClose={() => setExpOpen(false)} title={t("expenses.quickAdd.title", "Xarajat tez qo'shish") as string} size="lg">
        <form onSubmit={submitExpense} className="space-y-4">
          <input type="hidden" name="car_id" value={carId} />
          <input type="hidden" name="scope" value="car" />
          <input type="hidden" name="org_id" value={orgId || ''} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("expenses.fields.date", "Sana")}
              </label>
              <input
                name="occurred_at"
                type="date"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("expenses.fields.amount","Miqdor")}
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("expenses.fields.currency","Valyuta")}
              </label>
              <input
                name="currency"
                defaultValue="AED"
                placeholder="AED"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("expenses.fields.rate","AED ga kurs")}
              </label>
              <input
                name="rate_to_aed"
                type="number"
                step="0.000001"
                required
                defaultValue="1"
                placeholder="1.000000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("expenses.fields.category", "Kategoriya")}
            </label>
            <select
              name="category"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="repair">{t('expenses.categories.repair','Ta\'mirlash')}</option>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('expenses.fields.description','Izoh')}
            </label>
            <input
              name="description"
              placeholder="Xarajat haqida qisqacha ma'lumot"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={() => setExpOpen(false)}
              variant="secondary"
            >
              {t('common.cancel','Bekor qilish')}
            </Button>
            <Button
              type="submit"
              variant="success"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              {t('common.save','Saqlash')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

