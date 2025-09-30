"use client";
import React, { useEffect, useState } from "react";
import Modal from "@/app/components/ui/Modal";
import Button from "@/app/components/ui/Button";

export type ExpenseRow = {
  id: string;
  occurred_at: string;
  amount?: number;
  currency?: string;
  rate_to_aed?: number;
  amount_aed_fils?: number;
  category?: string;
  description?: string | null;
  car_id?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  row: ExpenseRow;
  onSaved?: () => void;
};

export default function ExpenseEditModal({ open, onClose, row, onSaved }: Props) {
  const [occurredAt, setOccurredAt] = useState(row.occurred_at || "");
  const [amount, setAmount] = useState<string>(row.amount ? String(row.amount) : "");
  const [currency, setCurrency] = useState<string>(row.currency || "AED");
  const [rate, setRate] = useState<string>(row.rate_to_aed ? String(row.rate_to_aed) : "1");
  const [category, setCategory] = useState<string>(row.category || "repair");
  const [description, setDescription] = useState<string>(row.description || "");

  useEffect(() => {
    if (!open) return;
    setOccurredAt(row.occurred_at || "");
    setAmount(row.amount ? String(row.amount) : "");
    setCurrency(row.currency || "AED");
    setRate(row.rate_to_aed ? String(row.rate_to_aed) : "1");
    setCategory(row.category || "repair");
    setDescription(row.description || "");
  }, [open, row]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("occurred_at", occurredAt);
    if (amount) fd.set("amount", amount);
    if (currency) fd.set("currency", currency);
    if (rate) fd.set("rate_to_aed", rate);
    if (category) fd.set("category", category);
    fd.set("description", description);

    const res = await fetch(`/api/expenses/${row.id}`, { method: "PATCH", body: fd });
    const j = await res.json();
    if (!j.success) {
      alert(j.error || "Failed to update expense");
      return;
    }
    onClose();
    onSaved?.();
  };

  return (
    <Modal open={open} onClose={onClose} title="Редактировать расход">
      <form onSubmit={handleSave} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input name="occurred_at" value={occurredAt} onChange={e=>setOccurredAt(e.target.value)} type="date" required className="border px-2 py-1 rounded" />
        <input name="amount" value={amount} onChange={e=>setAmount(e.target.value)} type="number" step="0.01" required placeholder="Сумма" className="border px-2 py-1 rounded" />
        <input name="currency" value={currency} onChange={e=>setCurrency(e.target.value)} placeholder="Валюта" className="border px-2 py-1 rounded" />
        <input name="rate_to_aed" value={rate} onChange={e=>setRate(e.target.value)} type="number" step="0.000001" required placeholder="Курс к AED" className="border px-2 py-1 rounded" />
        <select name="category" value={category} onChange={e=>setCategory(e.target.value)} className="border px-2 py-1 rounded">
          <option value="purchase">Покупка</option>
          <option value="transport">Транспорт</option>
          <option value="repair">Ремонт</option>
          <option value="detailing">Детейлинг</option>
          <option value="ads">Реклама</option>
          <option value="fees">Сборы/Комиссии</option>
          <option value="fuel">Топливо</option>
          <option value="parking">Парковка</option>
          <option value="rent">Аренда</option>
          <option value="salary">Зарплата</option>
          <option value="other">Другое</option>
        </select>
        <input name="description" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Описание" className="border px-2 py-1 rounded col-span-2" />
        <div className="col-span-2 sm:col-span-4 flex gap-2 justify-end mt-2">
          <Button type="button" onClick={onClose} variant="secondary">Отмена</Button>
          <Button type="submit">Сохранить</Button>
        </div>
      </form>
    </Modal>
  );
}

