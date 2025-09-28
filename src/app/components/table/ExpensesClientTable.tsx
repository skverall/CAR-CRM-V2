"use client";
import React, { useMemo } from "react";
import { TableToolbar, useClientSort } from "@/app/components/table/ClientTableTools";

type Row = Record<string, unknown>;

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

  return (
    <div>
      <TableToolbar rows={rows} getText={getText} filename={filename} />
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50 sticky top-0">
            {[
              { key: 'occurred_at', label: 'Sana' },
              { key: 'amount', label: 'Miqdor' },
              { key: 'currency', label: 'Valyuta' },
              { key: 'rate_to_aed', label: 'Kurs' },
              { key: 'amount_aed_fils', label: 'AED' },
              { key: 'category', label: 'Toifa' },
              { key: 'car_id', label: 'Avto/Hisob' },
              { key: 'description', label: 'Izoh' },
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
              <td className="p-2 border w-40">{String(r["car_id"] ?? "")}</td>
              <td className="p-2 border">{String(r["description"] ?? "")}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="p-2 border text-right font-semibold" colSpan={4}>Jami (AED):</td>
            <td className="p-2 border font-semibold">{fmt(totalAed)}</td>
            <td className="p-2 border" colSpan={3}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

