"use client";
import React, { useMemo } from "react";
import { TableToolbar, useClientSort } from "@/app/components/table/ClientTableTools";
import { useT } from "@/app/i18n/LangContext";

type Row = Record<string, unknown>;

type Props = {
  rows: Row[];
  filename?: string;
};

export default function IncomesClientTable({ rows, filename = "incomes" }: Props) {
  const getText = (r: Row) => [r["occurred_at"], r["description"], r["car_id"], r["amount"], r["currency"]].join(" ");
  const { sorted, sortKey, sortDir, toggle } = useClientSort(rows, (r, k) => (r as Record<string, unknown>)[k]);
  const display = useMemo(() => sorted, [sorted]);

  const totalAed = useMemo(() => display.reduce((s, r) => s + Number((r["amount_aed"]) ?? (Number(r["amount"]||0)*Number(r["rate_to_aed"]||1))), 0), [display]);
  const fmt = (n: number) => Number(n).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const t = useT();
  return (
    <div>
      <TableToolbar rows={rows} getText={getText} filename={filename} />
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50 sticky top-0">
            {[
              { key: 'occurred_at', label: t('incomes.fields.date','Sana') },
              { key: 'amount', label: t('incomes.fields.amount','Miqdor') },
              { key: 'currency', label: t('incomes.fields.currency','Valyuta') },
              { key: 'rate_to_aed', label: t('incomes.fields.rate','Kurs') },
              { key: 'amount_aed', label: 'AED' },
              { key: 'car_vin', label: t('incomes.fields.car','Avto') },
              { key: 'description', label: t('incomes.fields.description','Izoh') },
            ].map(c => (
              <th key={c.key} className="p-2 border cursor-pointer select-none" onClick={() => toggle(c.key)}>
                {c.label}{sortKey===c.key ? (sortDir==='asc' ? ' \u25b2' : ' \u25bc') : ''}
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
              <td className="p-2 border w-36">{fmt(Number((r["amount_aed"]) ?? Number(r["amount"]||0)*Number(r["rate_to_aed"]||1)))} </td>
              <td className="p-2 border w-40">{String(r["car_id"] ?? "")}</td>
              <td className="p-2 border">{String(r["description"] ?? "")}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="p-2 border text-right font-semibold" colSpan={4}>{t('table.totalsAed','Jami (AED):')}</td>
            <td className="p-2 border font-semibold">{fmt(totalAed)}</td>
            <td className="p-2 border" colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

