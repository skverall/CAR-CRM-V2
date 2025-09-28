"use client";

import QuickAddExpense from "@/app/components/quick/QuickAddExpense";
import { useCallback } from "react";

export default function RowQuickAddExpenseClient({
  orgId,
  carId,
  carVin,
}: {
  orgId: string | null;
  carId: string;
  carVin: string;
}) {
  // Provide a client-side onSubmit that posts to /api/expenses
  const onSubmit = useCallback(async (fd: FormData) => {
    try {
      // Ensure scope and car are set for direct car expense
      fd.set("scope", "car");
      fd.set("car_id", carId);
      if (orgId) fd.set("org_id", orgId);
      const res = await fetch("/api/expenses", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to add expense");
      // Trigger a soft refresh
      if (typeof window !== "undefined") window.location.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  }, [carId, orgId]);

  return (
    <QuickAddExpense
      onSubmit={onSubmit}
      orgId={orgId || null}
      cars={[{ id: carId, vin: carVin }]}
    />
  );
}

