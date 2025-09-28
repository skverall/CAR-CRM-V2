"use client";
import React, { useEffect, useState } from "react";
import Modal from "@/app/components/ui/Modal";
import Button from "@/app/components/ui/Button";

export type CarRef = { id: string; vin: string };

type Props = {
  onSubmit: (formData: FormData) => Promise<void>;
  orgId: string | null;
  cars: CarRef[];
};

export default function QuickAddIncome({ onSubmit, orgId, cars }: Props) {
  const [open, setOpen] = useState(false);
  const [occurredAt, setOccurredAt] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("AED");
  const [rate, setRate] = useState<string>("1");
  const [carId, setCarId] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    const today = new Date().toISOString().slice(0,10);
    setOccurredAt(localStorage.getItem("inc_last_date") || today);
    setCurrency(localStorage.getItem("inc_last_currency") || "AED");
    setCarId(localStorage.getItem("inc_last_car_id") || "");
  }, []);

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

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (orgId) fd.set("org_id", orgId);
    await onSubmit(fd);
    localStorage.setItem("inc_last_date", String(fd.get("occurred_at")||""));
    localStorage.setItem("inc_last_currency", String(fd.get("currency")||""));
    localStorage.setItem("inc_last_car_id", String(fd.get("car_id")||""));
    setAmount(""); setDescription("");
    setOpen(false);
  };

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>Tez qo&#39;shish</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Daromad tez qo&#39;shish">
        <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input name="occurred_at" value={occurredAt} onChange={e=>setOccurredAt(e.target.value)} type="date" required className="border px-2 py-1 rounded" />
          <input name="amount" value={amount} onChange={e=>setAmount(e.target.value)} type="number" step="0.01" required placeholder="Miqdor" className="border px-2 py-1 rounded" />
          <input name="currency" value={currency} onChange={e=>setCurrency(e.target.value)} placeholder="Valyuta" className="border px-2 py-1 rounded" />
          <input name="rate_to_aed" value={rate} onChange={e=>setRate(e.target.value)} type="number" step="0.000001" required placeholder="AED ga kurs" className="border px-2 py-1 rounded" />
          <input name="description" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Izoh" className="border px-2 py-1 rounded col-span-2" />
          <select name="car_id" value={carId} onChange={e=>setCarId(e.target.value)} className="border px-2 py-1 rounded">
            <option value="">(Avto ixtiyoriy)</option>
            {cars.map(c => <option key={c.id} value={c.id}>{c.vin}</option>)}
          </select>
          <input type="hidden" name="org_id" value={orgId||""} />
          <div className="col-span-2 sm:col-span-4 flex gap-2 justify-end">
            <Button type="button" onClick={()=>setOpen(false)} className="bg-gray-200 text-gray-900 hover:bg-gray-300">Bekor qilish</Button>
            <Button type="submit">Saqlash</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

