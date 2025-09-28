"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Select from "@/app/components/ui/Select";

const OPTIONS: Array<{ label: string; value: string }> = [
  { label: "All", value: "" },
  { label: "in_transit", value: "in_transit" },
  { label: "available/repair", value: "available,repair" },
  { label: "for_sale/listed", value: "for_sale,listed" },
  { label: "reserved", value: "reserved" },
  { label: "sold", value: "sold" },
];

export default function StatusFilter() {
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp.get("status") || "";

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Status:</label>
      <Select
        value={current}
        onChange={(e) => {
          const v = e.target.value;
          const next = new URLSearchParams(sp.toString());
          if (!v) next.delete("status"); else next.set("status", v);
          router.push(`/cars${next.toString() ? `?${next.toString()}` : ""}`);
        }}
        className="w-56"
      >
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
    </div>
  );
}

