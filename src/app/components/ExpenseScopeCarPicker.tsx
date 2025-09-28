"use client";
import { useEffect, useMemo, useState } from "react";

export type CarRef = { id: string; vin: string };

export default function ExpenseScopeCarPicker({ cars }: { cars: CarRef[] }) {
  const [scope, setScope] = useState<"overhead" | "personal" | "car">("overhead");
  const [carId, setCarId] = useState<string>("");

  // When scope changes away from car, clear carId
  useEffect(() => {
    if (scope !== "car") setCarId("");
  }, [scope]);

  const carOptions = useMemo(() => cars || [], [cars]);

  return (
    <div className="contents">
      {/* Car select */}
      <select
        name="car_id"
        aria-label="Avto (agar scope=car)"
        className="border px-2 py-1 rounded"
        value={carId}
        onChange={(e) => setCarId(e.target.value)}
        disabled={scope !== "car"}
        required={scope === "car"}
      >
        <option value="">Avto tanlang</option>
        {carOptions.map((c) => (
          <option key={c.id} value={c.id}>{c.vin}</option>
        ))}
      </select>

      {/* Scope select */}
      <select
        name="scope"
        className="border px-2 py-1 rounded"
        aria-label="Tur (Umumiy/Shaxsiy/Yoki Avto)"
        value={scope}
        onChange={(e) => setScope(e.target.value as "overhead" | "personal" | "car")}
      >
        <option value="overhead">Umumiy</option>
        <option value="personal">Shaxsiy</option>
        <option value="car">Avto uchun</option>
      </select>
    </div>
  );
}

