"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Select from "@/app/components/ui/Select";
import Text from "@/app/components/i18n/Text";
import { useT } from "@/app/i18n/LangContext";

export default function StatusFilter() {
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp.get("status") || "";
  const t = useT();

  const options: Array<{ label: string; value: string }> = [
    { label: t('reports.dailyExpensesPage.filters.all', 'Hammasi'), value: "" },
    { label: t('status.in_transit', 'Yo\'lda'), value: "in_transit" },
    { label: `${t('status.available', 'Mavjud')}/${t('status.repair', 'Ta\'mir')}`, value: "available,repair" },
    { label: `${t('status.for_sale', 'Sotuvda')}/${t('status.listed', "Sotuvga qo'yilgan")}`, value: "for_sale,listed" },
    { label: t('status.reserved', 'Band'), value: "reserved" },
    { label: t('status.sold', 'Sotilgan'), value: "sold" },
  ];

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600"><Text path="cars.table.status" fallback="Holat" />:</label>
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
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
    </div>
  );
}

