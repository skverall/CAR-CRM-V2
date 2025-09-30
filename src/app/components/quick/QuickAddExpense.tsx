"use client";
import React, { useEffect, useState } from "react";
import Modal from "@/app/components/ui/Modal";
import Button from "@/app/components/ui/Button";
import { useT } from "@/app/i18n/LangContext";

export type CarRef = { id: string; vin: string };

type Props = {
  onSubmit: (formData: FormData) => Promise<void>;
  orgId: string | null;
  cars: CarRef[];
  clientMode?: boolean;
  initialCarId?: string;
  openByDefault?: boolean;
};

export default function QuickAddExpense({ onSubmit, orgId, cars, clientMode = false, initialCarId, openByDefault = false }: Props) {
  const [open, setOpen] = useState(!!openByDefault);
  const [occurredAt, setOccurredAt] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("AED");
  const [rate, setRate] = useState<string>("1");
  const [category, setCategory] = useState<string>("repair");
  const [carId, setCarId] = useState<string>(initialCarId || "");
  const [description, setDescription] = useState<string>("");

  // Prefill from last used
  useEffect(() => {
    const today = new Date().toISOString().slice(0,10);
    setOccurredAt(localStorage.getItem("exp_last_date") || today);
    setCurrency(localStorage.getItem("exp_last_currency") || "AED");
    setCategory(localStorage.getItem("exp_last_category") || "repair");
    setCarId(initialCarId || localStorage.getItem("exp_last_car_id") || "");
  }, [initialCarId]);

  // Fetch latest FX rate for chosen date/currency
  useEffect(() => {
    const d = occurredAt || new Date().toISOString().slice(0,10);
    const cur = (currency || "AED").toUpperCase();
    if (!d) return;
    fetch(`/api/fx?currency=${cur}&date=${d}`)
      .then(r => r.json())
      .then(j => {
        if (j && j.rate) setRate(String(j.rate));
        else if (cur === "AED") setRate("1");
      })
      .catch(() => {});
  }, [occurredAt, currency]);

  const beforeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget);
    if (orgId) fd.set("org_id", orgId);
    // remember (do not prevent default to allow native server action submit)
    localStorage.setItem("exp_last_date", String(fd.get("occurred_at")||""));
    localStorage.setItem("exp_last_currency", String(fd.get("currency")||""));
    localStorage.setItem("exp_last_category", String(fd.get("category")||""));
    localStorage.setItem("exp_last_car_id", String(fd.get("car_id")||""));
    // leave modal closing/navigation to server redirect after submit
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (clientMode) {
      e.preventDefault();
      // remember values and ensure org_id
      beforeSubmit(e);
      const fd = new FormData(e.currentTarget);
      await onSubmit(fd);
      setOpen(false);
    } else {
      // server action mode: allow native submit
      beforeSubmit(e);
    }
  };

  const t = useT();
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>{t('expenses.quickAdd.cta','Xarajat qo\u2018shish')}</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('expenses.quickAdd.title','Xarajat tez qo\u2018shish')}>
        <form action={clientMode ? undefined : (onSubmit as unknown as (formData: FormData) => void)} onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input name="occurred_at" value={occurredAt} onChange={e=>setOccurredAt(e.target.value)} type="date" required className="border px-2 py-1 rounded" />
          <input name="amount" value={amount} onChange={e=>setAmount(e.target.value)} type="number" step="0.01" required placeholder={t('expenses.fields.amount','Miqdor')} className="border px-2 py-1 rounded" />
          <input name="currency" value={currency} onChange={e=>setCurrency(e.target.value)} placeholder={t('expenses.fields.currency','Valyuta')} className="border px-2 py-1 rounded" />
          <input name="rate_to_aed" value={rate} onChange={e=>setRate(e.target.value)} type="number" step="0.000001" required placeholder={t('expenses.fields.rate','AED ga kurs')} className="border px-2 py-1 rounded" />
          <select name="category" value={category} onChange={e=>setCategory(e.target.value)} className="border px-2 py-1 rounded">
            <option value="purchase">{t('expenses.categories.purchase','Xarid')}</option>
            <option value="transport">{t('expenses.categories.transport','Transport')}</option>
            <option value="repair">{t('expenses.categories.repair','Ta\u2019mirlash')}</option>
            <option value="detailing">{t('expenses.categories.detailing','Detalling')}</option>
            <option value="ads">{t('expenses.categories.ads','Reklama')}</option>
            <option value="fees">{t('expenses.categories.fees','To\'lov/Komissiya')}</option>
            <option value="fuel">{t('expenses.categories.fuel','Yoqilg\'i')}</option>
            <option value="parking">{t('expenses.categories.parking','Parkovka')}</option>
            <option value="rent">{t('expenses.categories.rent','Ijara')}</option>
            <option value="salary">{t('expenses.categories.salary','Oylik')}</option>
            <option value="other">{t('expenses.categories.other','Boshqa')}</option>
          </select>
          <input name="description" value={description} onChange={e=>setDescription(e.target.value)} placeholder={t('expenses.fields.description','Izoh')} className="border px-2 py-1 rounded col-span-2" />
          <select name="car_id" value={carId} onChange={e=>setCarId(e.target.value)} className="border px-2 py-1 rounded">
            <option value="">{t('expenses.scopeNone','(Umumiy/Shaxsiy)')}</option>
            {cars.map(c => <option key={c.id} value={c.id}>{c.vin}</option>)}
          </select>
          <input type="hidden" name="scope" value={carId?"car":"overhead"} />
          <input type="hidden" name="org_id" value={orgId||""} />
          <div className="col-span-2 sm:col-span-4 flex gap-2 justify-end">
            <Button type="button" onClick={()=>setOpen(false)} className="bg-gray-200 text-gray-900 hover:bg-gray-300">{t('common.cancel','Bekor qilish')}</Button>
            <Button type="submit">{t('common.save','Saqlash')}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

