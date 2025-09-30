"use client";
import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import Text from "@/app/components/i18n/Text";

export type AddCarState = { error?: string; success?: string };

export default function AddCarForm({ action }: { action: (prevState: AddCarState, formData: FormData) => Promise<AddCarState> }) {
  const [state, formAction] = useFormState(action, { error: undefined, success: undefined });
  const [currency, setCurrency] = useState<string>('AED');
  const [rate, setRate] = useState<string>('1');
  useEffect(() => { if (currency === 'AED') setRate('1'); }, [currency]);
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
        <select name="make" required className="border px-3 py-2 rounded">
          <option value="">Марка</option>
          <option value="Toyota">Toyota</option>
          <option value="Volkswagen">Volkswagen</option>
          <option value="Mercedes-Benz">Mercedes-Benz</option>
          <option value="BMW">BMW</option>
          <option value="Audi">Audi</option>
          <option value="Ford">Ford</option>
          <option value="Chevrolet">Chevrolet</option>
          <option value="Honda">Honda</option>
          <option value="Hyundai">Hyundai</option>
          <option value="Nissan">Nissan</option>
          <option value="Kia">Kia</option>
          <option value="Lexus">Lexus</option>
          <option value="Mazda">Mazda</option>
          <option value="Subaru">Subaru</option>
          <option value="Mitsubishi">Mitsubishi</option>
          <option value="Suzuki">Suzuki</option>
          <option value="Tesla">Tesla</option>
          <option value="Porsche">Porsche</option>
          <option value="Land Rover">Land Rover</option>
          <option value="Jaguar">Jaguar</option>
          <option value="Volvo">Volvo</option>
          <option value="Mini">Mini</option>
          <option value="Skoda">Skoda</option>
          <option value="Seat">SEAT</option>
          <option value="Opel">Opel</option>
          <option value="Peugeot">Peugeot</option>
          <option value="Renault">Renault</option>
          <option value="Citroën">Citroën</option>
          <option value="Fiat">Fiat</option>
          <option value="Alfa Romeo">Alfa Romeo</option>
          <option value="Ferrari">Ferrari</option>
          <option value="Lamborghini">Lamborghini</option>
          <option value="Maserati">Maserati</option>
          <option value="Bentley">Bentley</option>
          <option value="Rolls-Royce">Rolls-Royce</option>
          <option value="Aston Martin">Aston Martin</option>
          <option value="Bugatti">Bugatti</option>
          <option value="McLaren">McLaren</option>
          <option value="Jeep">Jeep</option>
          <option value="Dodge">Dodge</option>
          <option value="Chrysler">Chrysler</option>
          <option value="RAM">RAM</option>
          <option value="GMC">GMC</option>
          <option value="Buick">Buick</option>
          <option value="Cadillac">Cadillac</option>
          <option value="Lincoln">Lincoln</option>
          <option value="Infiniti">Infiniti</option>
          <option value="Acura">Acura</option>
          <option value="Genesis">Genesis</option>
          <option value="BYD">BYD</option>
          <option value="Geely">Geely</option>
          <option value="Chery">Chery</option>
          <option value="Haval">Haval</option>
          <option value="GWM">GWM</option>
          <option value="MG">MG</option>
          <option value="Great Wall">Great Wall</option>
          <option value="JAC">JAC</option>
          <option value="Zotye">Zotye</option>
          <option value="FAW">FAW</option>
          <option value="Dongfeng">Dongfeng</option>
          <option value="SAIC">SAIC</option>
          <option value="BAIC">BAIC</option>
          <option value="Brilliance">Brilliance</option>
          <option value="Proton">Proton</option>
          <option value="Perodua">Perodua</option>
          <option value="Tata">Tata</option>
          <option value="Mahindra">Mahindra</option>
          <option value="Daewoo">Daewoo</option>
          <option value="Daihatsu">Daihatsu</option>
          <option value="Saab">Saab</option>
          <option value="Scion">Scion</option>
          <option value="Smart">Smart</option>
          <option value="Other">Другое</option>
        </select>
        <input name="model" placeholder="Model" required className="border px-3 py-2 rounded" />
        <input name="model_year" type="number" placeholder="Yil" className="border px-3 py-2 rounded" />
        <input name="purchase_date" type="date" required className="border px-3 py-2 rounded" />
        <input name="purchase_price" type="number" step="0.01" placeholder="Narx" required className="border px-3 py-2 rounded" />
        <select name="purchase_currency" required className="border px-3 py-2 rounded" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="AED">AED</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
        <input name="purchase_rate_to_aed" type="number" step="0.0001" placeholder="AED kursi" required className="border px-3 py-2 rounded" value={rate} onChange={(e) => setRate(e.target.value)} />
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

