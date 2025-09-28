export const dynamic = "force-dynamic";

import Card from "@/app/components/ui/Card";
import Text from "@/app/components/i18n/Text";

export default function GuidePage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold"><Text path="guide.title" fallback="Qo'\llanma" /></h1>
      <Card>
        <div className="prose max-w-none">
          <h2>Qo&#39;llanma (yangilangan)</h2>

          <h3>1) Nimalar yangilandi</h3>
          <ul>
            <li>Yagona dizayn: Card, jadval (sticky thead), EmptyState, bir xil input/knopka uslublari.</li>
            <li>Faol bo&#39;lim indikatorlari (navigatsiyada hozir qaysi sahifa ochiq — aniq ko&#39;rinadi).</li>
            <li>Filtrlar: sana (hamma joyda), <b>Expenses</b> — toifa va avto, <b>Incomes</b> — avto. Pleyxsolderlar: “Barcha …”.</li>
            <li>Avto ro&#39;yxati kengaytirilgan: foyda, marja %, kunlar (days on lot).</li>
            <li>Hisob-kitoblar barqaror: sotishda <b>deal_snapshot</b> yoziladi, tarixiy hisobotlar o&#39;zgarmaydi.</li>
          </ul>

          <h3>2) Ish jarayoni qisqacha</h3>
          <ol>
            <li><b>Xarajat</b> qo&#39;shing: sana, miqdor, valyuta, AED kursi, toifa. Avto tanlasangiz — o&#39;sha avtoga, tanlamasangiz — Umumiy/Shaxsiy bo&#39;ladi.</li>
            <li>Umumiy/Shaxsiy uchun miqdor/kurs/sana kiritilganda <b>taqsimot preview</b> pastda ko&#39;rinadi.</li>
            <li><b>Daromad</b> qo&#39;lda faqat boshqa tushumlar uchun. <b>Sotuv daromadi</b> avtomatik: mashinani <b>sold</b> qilganda yoziladi.</li>
            <li>Valyuta kurslarini <b>FX</b> sahifasida qo&#39;shing (baza→AED).</li>
            <li><b>Capital</b>: balanslar, kirim/chiqim/korrektirovka va kuzatuv jadvali.</li>
          </ol>

          <h3>3) Xarajatlar (Expenses)</h3>
          <ol>
            <li><b>Forma:</b> Sana, Miqdor, Valyuta, AED kursi, Toifa, Izoh, Avto (ixtiyoriy).</li>
            <li><b>Avto bo&#39;sh</b> — Umumiy/Shaxsiy; <b>Avto tanlangan</b> — aynan o&#39;sha avtoga yoziladi.</li>
            <li><b>Preview</b> uchun miqdor+kurs+sana to&#39;ldiring — faol avtolar orasida taqsimot ko&#39;rinadi.</li>
            <li><b>Filtrlar:</b> Sana dan/ga, Toifa, Avto. Pleyxsolderlar — “Barcha toifalar”, “Barcha avtolar”.</li>
            <li>Jadval sarlavhasi “yopishqoq”, AED summalar formatlangan, bo&#39;sh ro&#39;yxatda EmptyState.</li>
          </ol>

          <h3>4) Daromadlar (Incomes)</h3>
          <ul>
            <li><b>Sotuv daromadi qo&#39;lda kiritilmaydi.</b> Avto sahifasida <b>sold</b> qilganda tizim <code>[SALE]</code> daromadini yozadi.</li>
            <li>Boshqa tushumlar uchun forma: Sana, Miqdor, Valyuta, AED kursi, Izoh, Avto.</li>
            <li>Filtrlar: Sana dan/ga, Avto (“Barcha avtolar”).</li>
          </ul>

          <h3>5) Valyuta kurslari (FX)</h3>
          <ul>
            <li>Kurs qo&#39;shish: Sana, Baza valyuta (USD/EUR/AED), Kurs (baza→AED).</li>
            <li>Ro&#39;yxat: Sana, Juft, Kurs. Filtr — sana bo&#39;yicha.</li>
          </ul>

          <h3>6) Kapital (Capital)</h3>
          <ul>
            <li>Hisoblar: investor, business, owner, assistant.</li>
            <li>Harakatlar: deposit / withdraw / adjust. Sana, summa, sabab, (ixtiyoriy) bog&#39;lanishlar.</li>
            <li>Sahifada balans kartalari, so&#39;nggi harakatlar jadvali va sana bo&#39;yicha filtrlar mavjud.</li>
          </ul>

          <h3>7) Mashinani sotish va snapshot</h3>
          <ol>
            <li><b>Cars → mashina</b> sahifasida statusni <b>sold</b> ga o&#39;tkazing, sotuv sanasi/summasi/valyuta/AED kursini kiriting.</li>
            <li>Tizim <code>[SALE]</code> daromadini avtomatik yozadi va <b>deal_snapshot</b> saqlaydi — tarixiy foyda o&#39;zgarmaydi.</li>
            <li>Qo&#39;lda sotuv daromadini kiritmang — ikki marta hisoblanib qoladi.</li>
          </ol>

          <h3>8) Hisobotlar</h3>
          <ul>
            <li>Reports sahifasida eksport/ko&#39;rinishlar mavjud (masalan, kunlik xarajatlar).</li>
            <li>Foyda va xarajatlar hisob-kitobi ma&#39;lumotlar bazasidagi maxsus ko&#39;rinishlar orqali samarali olinadi.</li>
          </ul>

          <h3>9) Foyda formulasi</h3>
          <p>
            Foyda = Sotuv (AED) − (Xarid (AED) + Barcha xarajatlar (AED)). Umumiy/Shaxsiy xarajatlar faol avtolar orasida qo&#39;llanilgan usul bo&#39;yicha taqsimlanadi.
          </p>

          <h3>10) Tez-tez so&#39;raladigan savollar</h3>
          <ul>
            <li><b>Daromad sahifasida sotuvni ko&#39;rsatamanmi?</b> — Yo&#39;q. Sotuv faqat avto sahifasida (<b>sold</b>), tizim o&#39;zi yozadi.</li>
            <li><b>Preview ko&#39;rinmayapti?</b> — Avto tanlanmagan bo&#39;lsin va Miqdor + AED kursi + Sana to&#39;ldirilgan bo&#39;lsin.</li>
            <li><b>Bo&#39;sh jadval chiqdi?</b> — Filtrlar toraytirgandir; pleyxsolderdagi “Barcha …” ni tanlab ko&#39;ring yoki sanalarni kengaytiring.</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

