export const dynamic = "force-dynamic";

import Card from "@/app/components/ui/Card";

export default function GuidePage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Qo&apos;llanma</h1>
      <Card>
        <div className="prose max-w-none">
          <h2>Avtomobil CRM (Uzbek)</h2>

      <h2>1) Asosiy bo&apos;limlar</h2>
      <ul>
        <li><b>Cars</b> — mashinalar ro&apos;yxati va har bir mashina kartasi.</li>
        <li><b>Xarajatlar</b> — xarajat qo&apos;shish (avtoga yoki Umumiy/Shaxsiy).</li>
        <li><b>Daromad</b> — qo&apos;lda daromad kiritish (sotuv daromadi avto sahifasida yoziladi).</li>
        <li><b>Reports</b> — yig&apos;ma ko&apos;rsatkichlar.</li>
      </ul>

      <h2>2) Xarajatlar (Xarajat qo&apos;shish)</h2>
      <ol>
        <li><b>Sana</b>, <b>Miqdor</b>, <b>Valyuta</b> va <b>AED ga kurs</b> ni kiriting.</li>
        <li><b>Toifa</b> ni tanlang (Ta&apos;mirlash, Transport va hokazo).</li>
        <li>
          Agar <b>Avto</b> tanlasangiz — xarajat shu mashinaga bog&apos;lanadi.
          Agar <b>Avto</b> bo&apos;sh qolsa — xarajat <b>Umumiy/Shaxsiy</b> bo&apos;lib, faol mashinalarga avtomatik taqsimlanadi.
        </li>
        <li>Taqsimotning <b>preview</b> ni shakllantirish uchun miqdor, kurs va sanani kiriting — pastda ro&apos;yxat ko&apos;rsatiladi.</li>
      </ol>

      <h2>3) Daromadlar</h2>
      <p>
        Sotuv daromadi qo&apos;lda <i>Daromad</i> bo&apos;limida kiritilmaydi. Avto sahifasida holatni <b>sold</b> ga o&apos;tkazganingizda,
        shu yerning o&apos;zida sotuv summasi va sana kiritiladi, va tizim <code>[SALE]</code> daromadini avtomatik yozib qo&apos;yadi.
      </p>

      <h2>4) Mashinani sotilgan deb belgilash</h2>
      <ol>
        <li><b>Cars → mashina</b> sahifasini oching.</li>
        <li>Yuqorida <b>Holat</b> tugmasi bilan bosqichma-bosqich o&apos;ting: available → repair → listed → <b>sold</b>.</li>
        <li>
          <b>sold</b> ga o&apos;tishda paydo bo&apos;lgan formaga <b>sotuv sanasi</b>, <b>summa</b>, <b>valyuta</b>, <b>AED kursi</b> va (ixtiyoriy) izoh kiriting.
        </li>
        <li>Yuborgach, mashina holati <b>sold</b> bo&apos;ladi va <code>[SALE]</code> daromadi avtomatik qo&apos;shiladi.</li>
      </ol>

      <h2>5) Foyda</h2>
      <p>
        Foyda = Sotuv (AED) − (Xarid (AED) + Barcha xarajatlar (AED)). Umumiy/Shaxsiy xarajatlar avtomatik taqsimot orqali mashinalar qiymatiga qo7shiladi.
      </p>

      <h2>6) Tez-tez beriladigan savollar</h2>
      <ul>
        <li><b>Daromad sahifasida sotuvni ko&apos;rsataymi?</b> — Yo&apos;q, sotuv avto sahifasida belgilanadi. Daromad sahifasi boshqa tushumlar uchundir.</li>
        <li><b>Umumiy/Shaxsiy taqsimot qachon ishlaydi?</b> — Avto tanlanmagan bo&apos;lsa va miqdor/kurs/sana to&apos;ldirilganida. Preview quyi qismda ko&apos;rinadi.</li>
      </ul>
        </div>
      </Card>
    </div>
  );
}

