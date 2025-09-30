"use client";
import React, { useMemo, useState } from "react";
import { TableToolbar, useClientSort } from "@/app/components/table/ClientTableTools";
import { useT } from "@/app/i18n/LangContext";

type Row = Record<string, unknown>;

import ExpenseEditModal, { ExpenseRow } from "@/app/components/expenses/ExpenseEditModal";

type Props = {
  rows: Row[];
  filename?: string;
};

export default function ExpensesClientTable({ rows, filename = "expenses" }: Props) {
  const getText = (r: Row) => [r["occurred_at"], r["category"], r["description"], r["car_id"], r["amount"], r["currency"]].join(" ");
  const { sorted, sortKey, sortDir, toggle } = useClientSort(rows, (r, k) => (r as Record<string, unknown>)[k]);
  const display = useMemo(() => sorted, [sorted]);

  const totalAed = useMemo(() => display.reduce((s, r) => s + (((r["amount_aed_fils"])!=null)? (Number(r["amount_aed_fils"])/100) : (Number(r["amount"]||0)*Number(r["rate_to_aed"]||1))), 0), [display]);
  const fmt = (n: number) => Number(n).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const [editRow, setEditRow] = useState<ExpenseRow | null>(null);
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <div>
      <TableToolbar rows={rows} getText={getText} filename={filename} />
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50 sticky top-0">
            {[
              { key: 'occurred_at', label: t('expenses.fields.date','Sana') },
              { key: 'amount', label: t('expenses.fields.amount','Miqdor') },
              { key: 'currency', label: t('expenses.fields.currency','Valyuta') },
              { key: 'rate_to_aed', label: t('expenses.fields.rate','Kurs') },
              { key: 'amount_aed_fils', label: 'AED' },
              { key: 'category', label: t('expenses.fields.category','Toifa') },
              { key: 'car_id', label: t('expenses.fields.car','Avto/Hisob') },
              { key: 'description', label: t('expenses.fields.description','Izoh') },
              { key: 'actions', label: t('table.actions','Amallar') },
            ].map(c => (
              <th key={c.key} className="p-2 border cursor-pointer select-none" onClick={() => toggle(c.key)}>
                {c.label}{sortKey===c.key ? (sortDir==='asc' ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {display.map((r, idx) => (
            <tr key={String((r["id"]) ?? idx)} className="odd:bg-white even:bg-gray-50">
              <td className="p-2 border w-32">{String(r["occurred_at"] ?? "")}</td>
              <td className="p-2 border w-28">{String(r["amount"] ?? "")}</td>
              <td className="p-2 border w-20">{String(r["currency"] ?? "")}</td>
              <td className="p-2 border w-24">{String(r["rate_to_aed"] ?? "")}</td>
              <td className="p-2 border w-36">{fmt(((r["amount_aed_fils"])!=null)? (Number(r["amount_aed_fils"])/100) : Number(r["amount"]||0) * Number(r["rate_to_aed"]||1))}</td>
              <td className="p-2 border w-40">{String(r["category"] ?? "")}</td>
              <td className="p-2 border w-40">
                {r["car_id"] ? (
                  <a href={`/cars/${String(r["car_id"])}`} className="text-blue-600 hover:text-blue-800 underline">
                    {String((r["car_label"]) ?? r["car_id"])}
                  </a>
                ) : (
                  <span className="text-gray-500">{t('expenses.scopeNone','(Umumiy/Shaxsiy)')}</span>
                )}
              </td>
              <td className="p-2 border">{String(r["description"] ?? "")}</td>
              <td className="p-2 border w-28">
                <button
                  className="px-2 py-1 text-blue-700 hover:text-blue-900 underline"
                  onClick={() => { setEditRow({
                    id: String(r["id"]),
                    occurred_at: String(r["occurred_at"] ?? ""),
                    amount: r["amount"] as number | undefined,
                    currency: r["currency"] as string | undefined,
                    rate_to_aed: r["rate_to_aed"] as number | undefined,
                    amount_aed_fils: r["amount_aed_fils"] as number | undefined,
                    category: r["category"] as string | undefined,
                    description: (r["description"] as string | null) ?? null,
                    car_id: (r["car_id"] as string | null) ?? null,
                  }); setOpen(true); }}
                >{t('common.edit','Tahrirlash')}</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="p-2 border text-right font-semibold" colSpan={4}>{t('table.totalsAed','Jami (AED):')}</td>
            <td className="p-2 border font-semibold">{fmt(totalAed)}</td>
            <td className="p-2 border" colSpan={4}></td>
          </tr>
        </tfoot>
      </table>

      {open && editRow && (
        <ExpenseEditModal
          open={open}
          onClose={() => setOpen(false)}
          row={editRow}
          onSaved={() => { if (typeof window !== 'undefined') window.location.reload(); }}
        />
      )}
    </div>
  );
}

