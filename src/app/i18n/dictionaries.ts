export type LangCode = "uz" | "ru";

export const dictionaries: Record<LangCode, Record<string, unknown>> = {
  uz: {
    nav: {
      panel: "Panel",
      cars: "Avtomobillar",
      expenses: "Xarajatlar",
      incomes: "Daromadlar (qo'lda)",
      fx: "Kurslar",
      capital: "Kapital",
      reports: "Hisobotlar",
      guide: "Qo'llanma",
    },
    sell: {
      cta: "Sotish",
      modalTitle: "Avtomobilni sotilgan deb belgilash",
      amount: "Sotuv summasi",
      currency: "Valyuta",
      rate: "Kurs (AED)",
      date: "Sana",
      desc: "Izoh",
      submit: "Sotish va daromadni yozish",
      note: "Eslatma: kurs sotuv sanasiga ko‘ra avtomatik",
    },
  },
  ru: {
    nav: {
      panel: "Панель",
      cars: "Автомобили",
      expenses: "Расходы",
      incomes: "Доходы (вручную)",
      fx: "Курсы",
      capital: "Капитал",
      reports: "Отчеты",
      guide: "Руководство",
    },
    sell: {
      cta: "Продать",
      modalTitle: "Отметить автомобиль как проданный",
      amount: "Сумма продажи",
      currency: "Валюта",
      rate: "Курс (в AED)",
      date: "Дата продажи",
      desc: "Описание",
      submit: "Продать и записать доход",
      note: "Примечание: курс подтянется по дате продажи автоматически",
    },
  },
};

