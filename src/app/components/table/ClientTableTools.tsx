"use client";
import React, { useMemo, useState } from "react";
import Button from "@/app/components/ui/Button";

type ToolProps<T extends Record<string, unknown>> = {
  rows: T[];
  onRowsChange?: (rows: T[]) => void; // not used now
  getText?: (row: T) => string; // for search
  filename?: string;
};

export function TableToolbar<T extends Record<string, unknown>>({ rows, getText, filename }: ToolProps<T>) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q) return rows;
    const qq = q.toLowerCase();
    const getter = getText || ((r: T) => JSON.stringify(r));
    return rows.filter((r) => getter(r).toLowerCase().includes(qq));
  }, [q, rows, getText]);

  // naive CSV export of filtered rows
  const exportCsv = () => {
    if (!filtered.length) return;
    const keys = Array.from(new Set(filtered.flatMap((r) => Object.keys(r))));
    const lines = [keys.join(",")].concat(
      filtered.map((r) => keys.map(k => JSON.stringify((r as Record<string, unknown>)[k] ?? "")).join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = (filename || "export") + ".csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between mb-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Qidiruv..."
        className="border rounded px-3 py-1 w-full sm:w-80"
      />
      <Button type="button" onClick={exportCsv}>Export CSV</Button>
    </div>
  );
}

export function useClientSort<T>(rows: T[], getSortValue: (row: T, key: string) => unknown) {
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("asc");
  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const arr = [...rows];
    arr.sort((a,b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      const cmp = (() => {
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        const na = typeof va === 'number' ? va : (typeof va === 'string' ? Number(va) : NaN);
        const nb = typeof vb === 'number' ? vb : (typeof vb === 'string' ? Number(vb) : NaN);
        const bothNum = !Number.isNaN(na) && !Number.isNaN(nb);
        if (bothNum) return na - nb;
        const sa = String(va ?? '');
        const sb = String(vb ?? '');
        return sa.localeCompare(sb);
      })();
      return cmp * (sortDir === "asc" ? 1 : -1);
    });
    return arr;
  }, [rows, sortKey, sortDir, getSortValue]);
  const toggle = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); }
    else { setSortDir(sortDir === "asc" ? "desc" : "asc"); }
  };
  return { sorted, sortKey, sortDir, toggle };
}

