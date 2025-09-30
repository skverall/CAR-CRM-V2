import Text from "@/app/components/i18n/Text";
import AddCarForm, { AddCarState } from "@/app/components/cars/AddCarForm";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function getOrgId(): Promise<string | null> {
  const db = getSupabaseAdmin();
  const { data } = await db.from("orgs").select("id").eq("name", "Default Organization").single();
  return (data as { id: string } | null)?.id ?? null;
}

type CarInsert = {
  vin: string;
  make: string;
  model: string;
  model_year: number | null;
  purchase_date: string;
  purchase_currency: string;
  purchase_rate_to_aed: number;
  purchase_price: number;
  mileage?: number;
  notes?: string;
  source?: string;
};

async function addCar(prevState: AddCarState, formData: FormData): Promise<AddCarState> {
  "use server";
  try {
    const payload: CarInsert = {
      vin: String(formData.get("vin") || "").trim(),
      make: String(formData.get("make") || "").trim(),
      model: String(formData.get("model") || "").trim(),
      model_year: Number(formData.get("model_year")) || null,
      source: String(formData.get("source") || "").trim(),
      purchase_date: String(formData.get("purchase_date")),
      purchase_currency: String(formData.get("purchase_currency")),
      purchase_rate_to_aed: Number(formData.get("purchase_rate_to_aed")),
      purchase_price: Number(formData.get("purchase_price")),
      mileage: Number(formData.get("mileage")) || undefined,
      notes: String(formData.get("notes") || "").trim() || undefined,
    };

    if (!payload.vin || !payload.make || !payload.model || !payload.purchase_date || !payload.purchase_currency || !payload.purchase_rate_to_aed || !payload.purchase_price) {
      return { error: "Заполните обязательные поля." };
    }

    const purchasePriceAedFils = Math.round(payload.purchase_price * payload.purchase_rate_to_aed * 100);

    const db = getSupabaseAdmin();
    const orgId = await getOrgId();
    if (!orgId) {
      return { error: "Организация не найдена. Создайте ‘Default Organization’ в базе или сообщите мне — создам автоматически." };
    }

    const { error } = await db.from("au_cars").insert([
      {
        ...payload,
        purchase_price_aed: purchasePriceAedFils,
        status: "available",
        org_id: orgId,
      },
    ]);
    if (error) return { error: error.message };

    revalidatePath("/cars");
    return { success: "Автомобиль добавлен." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: msg };
  }
}

export default async function AddCarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          <Text path="cars.addTitle" fallback="Yangi avtomobil qo‘shish" />
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          <Text path="cars.addSubtitle" fallback="Yangi avtomobil ma'lumotlarini kiriting" />
        </p>
      </div>

      <AddCarForm action={addCar} />
    </div>
  );
}

