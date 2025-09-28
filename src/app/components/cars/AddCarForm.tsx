"use client";
import { useFormState } from "react-dom";
import Text from "@/app/components/i18n/Text";

export type AddCarState = { error?: string; success?: string };

export default function AddCarForm({ action }: { action: (prevState: AddCarState, formData: FormData) => Promise<AddCarState> }) {
  const [state, formAction] = useFormState(action, { error: undefined, success: undefined });
  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">
        <Text path="cars.addTitle" fallback="Yangi avtomobil qo‘shish" />
      </h2>

      {/* Alerts */}
      {state?.error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 text-green-800 px-3 py-2">
          {state.success}
        </div>
      )}

      <form action={formAction} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <input name="vin" placeholder="VIN" required className="border px-3 py-2 rounded" />
        <input name="make" placeholder="Marka" required className="border px-3 py-2 rounded" />
        <input name="model" placeholder="Model" required className="border px-3 py-2 rounded" />
        <input name="model_year" type="number" placeholder="Yil" className="border px-3 py-2 rounded" />
        <input name="purchase_date" type="date" required className="border px-3 py-2 rounded" />
        <input name="purchase_price" type="number" step="0.01" placeholder="Narx" required className="border px-3 py-2 rounded" />
        <select name="purchase_currency" required className="border px-3 py-2 rounded">
          <option value="">Valyuta</option>
          <option value="USD">USD</option>
          <option value="AED">AED</option>
          <option value="EUR">EUR</option>
        </select>
        <input name="purchase_rate_to_aed" type="number" step="0.01" placeholder="AED kursi" required className="border px-3 py-2 rounded" />
        <input name="mileage" type="number" placeholder="Probeg (km)" className="border px-3 py-2 rounded" />
        <input name="source" placeholder="Manba" className="border px-3 py-2 rounded" />
        <input name="notes" placeholder="Izohlar" className="border px-3 py-2 rounded col-span-2" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 col-span-2 sm:col-span-1">
          <Text path="cars.addCta" fallback="Qo‘shish" />
        </button>
      </form>
    </div>
  );
}

