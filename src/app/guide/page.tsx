export const dynamic = "force-dynamic";

import Card from "@/app/components/ui/Card";
import Text from "@/app/components/i18n/Text";

export default function GuidePage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold"><Text path="guide.title" fallback="Qo'\llanma" /></h1>
      <Card>
        <div className="prose max-w-none">
          <h2><Text path="guide.sections.updated.title" fallback="Qo'llanma (yangilangan)" /></h2>

          <h3><Text path="guide.sections.updated.heading" fallback="1) Nimalar yangilandi" /></h3>
          <ul>
            <li><Text path="guide.sections.updated.items.item1" fallback="Yagona dizayn: Card, jadval (sticky thead), EmptyState, bir xil input/knopka uslublari." /></li>
            <li><Text path="guide.sections.updated.items.item2" fallback="Faol bo'lim indikatorlari (navigatsiyada hozir qaysi sahifa ochiq — aniq ko'rinadi)." /></li>
            <li><Text path="guide.sections.updated.items.item3" fallback="Filtrlar: sana (hamma joyda), Expenses — toifa va avto, Incomes — avto. Pleyxsolderlar: “Barcha …”." /></li>
            <li><Text path="guide.sections.updated.items.item4" fallback="Avto ro'yxati kengaytirilgan: foyda, marja %, kunlar (days on lot)." /></li>
            <li><Text path="guide.sections.updated.items.item5" fallback="Hisob-kitoblar barqaror: sotishda deal_snapshot yoziladi, tarixiy hisobotlar o'zgarmaydi." /></li>
          </ul>

          <h3><Text path="guide.sections.flow.title" fallback="2) Ish jarayoni qisqacha" /></h3>
          <ol>
            <li><Text path="guide.sections.flow.items.item1" fallback="Xarajat qo'shing: sana, miqdor, valyuta, AED kursi, toifa. Avto tanlasangiz — o'sha avtoga, tanlamasangiz — Umumiy/Shaxsiy bo'ladi." /></li>
            <li><Text path="guide.sections.flow.items.item2" fallback="Umumiy/Shaxsiy uchun miqdor/kurs/sana kiritilganda taqsimot preview pastda ko'rinadi." /></li>
            <li><Text path="guide.sections.flow.items.item3" fallback="Daromad qo'lda faqat boshqa tushumlar uchun. Sotuv daromadi avtomatik: mashinani sold qilganda yoziladi." /></li>
            <li><Text path="guide.sections.flow.items.item4" fallback="Valyuta kurslarini FX sahifasida qo'shing (baza→AED)." /></li>
            <li><Text path="guide.sections.flow.items.item5" fallback="Capital: balanslar, kirim/chiqim/korrektirovka va kuzatuv jadvali." /></li>
          </ol>

          <h3><Text path="guide.sections.expenses.title" fallback="3) Xarajatlar (Expenses)" /></h3>
          <ol>
            <li><Text path="guide.sections.expenses.items.item1" fallback="Forma: Sana, Miqdor, Valyuta, AED kursi, Toifa, Izoh, Avto (ixtiyoriy)." /></li>
            <li><Text path="guide.sections.expenses.items.item2" fallback="Avto bo'sh — Umumiy/Shaxsiy; Avto tanlangan — aynan o'sha avtoga yoziladi." /></li>
            <li><Text path="guide.sections.expenses.items.item3" fallback="Preview uchun miqdor+kurs+sana to'ldiring — faol avtolar orasida taqsimot ko'rinadi." /></li>
            <li><Text path="guide.sections.expenses.items.item4" fallback="Filtrlar: Sana dan/ga, Toifa, Avto. Pleyxsolderlar — “Barcha toifalar”, “Barcha avtolar”." /></li>
            <li><Text path="guide.sections.expenses.items.item5" fallback="Jadval sarlavhasi “yopishqoq”, AED summalar formatlangan, bo'sh ro'yxatda EmptyState." /></li>
          </ol>

          <h3><Text path="guide.sections.incomes.title" fallback="4) Daromadlar (Incomes)" /></h3>
          <ul>
            <li><Text path="guide.sections.incomes.items.item1" fallback="Sotuv daromadi qo'lda kiritilmaydi. Avto sahifasida sold qilganda tizim [SALE] daromadini yozadi." /></li>
            <li><Text path="guide.sections.incomes.items.item2" fallback="Boshqa tushumlar uchun forma: Sana, Miqdor, Valyuta, AED kursi, Izoh, Avto." /></li>
            <li><Text path="guide.sections.incomes.items.item3" fallback="Filtrlar: Sana dan/ga, Avto (“Barcha avtolar”)." /></li>
          </ul>

          <h3><Text path="guide.sections.fx.title" fallback="5) Valyuta kurslari (FX)" /></h3>
          <ul>
            <li><Text path="guide.sections.fx.items.item1" fallback="Kurs qo'shish: Sana, Baza valyuta (USD/EUR/AED), Kurs (baza→AED)." /></li>
            <li><Text path="guide.sections.fx.items.item2" fallback="Ro'yxat: Sana, Juft, Kurs. Filtr — sana bo'yicha." /></li>
          </ul>

          <h3><Text path="guide.sections.capital.title" fallback="6) Kapital (Capital)" /></h3>
          <ul>
            <li><Text path="guide.sections.capital.items.item1" fallback="Hisoblar: investor, business, owner, assistant." /></li>
            <li><Text path="guide.sections.capital.items.item2" fallback="Harakatlar: deposit / withdraw / adjust. Sana, summa, sabab, (ixtiyoriy) bog'lanishlar." /></li>
            <li><Text path="guide.sections.capital.items.item3" fallback="Sahifada balans kartalari, so'nggi harakatlar jadvali va sana bo'yicha filtrlar mavjud." /></li>
          </ul>

          <h3><Text path="guide.sections.sell.title" fallback="7) Mashinani sotish va snapshot" /></h3>
          <ol>
            <li><Text path="guide.sections.sell.items.item1" fallback="Cars → mashina sahifasida statusni sold ga o'tkazing, sotuv sanasi/summasi/valyuta/AED kursini kiriting." /></li>
            <li><Text path="guide.sections.sell.items.item2" fallback="Tizim [SALE] daromadini avtomatik yozadi va deal_snapshot saqlaydi — tarixiy foyda o'zgarmaydi." /></li>
            <li><Text path="guide.sections.sell.items.item3" fallback="Qo'lda sotuv daromadini kiritmang — ikki marta hisoblanib qoladi." /></li>
          </ol>

          <h3><Text path="guide.sections.reports.title" fallback="8) Hisobotlar" /></h3>
          <ul>
            <li><Text path="guide.sections.reports.items.item1" fallback="Reports sahifasida eksport/ko'rinishlar mavjud (masalan, kunlik xarajatlar)." /></li>
            <li><Text path="guide.sections.reports.items.item2" fallback="Foyda va xarajatlar hisob-kitobi ma'lumotlar bazasidagi maxsus ko'rinishlar orqali samarali olinadi." /></li>
          </ul>

          <h3><Text path="guide.sections.profit.title" fallback="9) Foyda formulasi" /></h3>
          <p><Text path="guide.sections.profit.p" fallback="Foyda = Sotuv (AED) − (Xarid (AED) + Barcha xarajatlar (AED)). Umumiy/Shaxsiy xarajatlar faol avtolar orasida qo'llanilgan usul bo'yicha taqsimlanadi." /></p>

          <h3><Text path="guide.sections.faq.title" fallback="10) Tez-tez so'raladigan savollar" /></h3>
          <ul>
            <li><Text path="guide.sections.faq.items.item1" fallback="Daromad sahifasida sotuvni ko'rsatamanmi? — Yo'q. Sotuv faqat avto sahifasida (sold), tizim o'zi yozadi." /></li>
            <li><Text path="guide.sections.faq.items.item2" fallback="Preview ko'rinmayapti? — Avto tanlanmagan bo'lsin va Miqdor + AED kursi + Sana to'ldirilgan bo'lsin." /></li>
            <li><Text path="guide.sections.faq.items.item3" fallback="Bo'sh jadval chiqdi? — Filtrlar toraytirgandir; “Barcha …” ni tanlab ko'ring yoki sanalarni kengaytiring." /></li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

