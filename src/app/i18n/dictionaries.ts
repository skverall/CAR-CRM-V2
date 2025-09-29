export type LangCode = "uz" | "ru";

export const dictionaries: Record<LangCode, Record<string, unknown>> = {
  uz: {
    nav: {
      panel: "Bosh sahifa",
      cars: "Avtomobillar",
      expenses: "Xarajatlar",
      analytics: "Analitika",
      reports: "Hisobotlar",
      addCar: "Avto qo'shish",
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
    status: {
      in_transit: "Yo'lda",
      for_sale: "Sotuvda",
      reserved: "Band",
      sold: "Sotilgan",
      archived: "Arxiv",
      available: "Mavjud",
      repair: "Ta'mir",
      listed: "Sotuvga qo'yilgan",
    },
    cars: {
      title: "Avtomobillar",
      subtitle: "Barcha avtomobillar ro'yxati va ularning holati",
      search: "Qidiruv: VIN, marka, model...",
      view: "Ko'rinish:",
      showing: "Ko'rsatilmoqda:",
      empty: "Hech qanday avtomobil topilmadi",
      noResults: "Hech narsa topilmadi",
      addNew: "Yangi qo'shish",
      summary: {
        total: "Jami",
        totalProfit: "Umumiy foyda",
        avgMargin: "O'rtacha marja",
      },
      table: {
        car: "Avtomobil",
        status: "Holat",
        purchaseDate: "Xarid sanasi",
        purchasePrice: "Xarid narxi",
        totalCost: "Tan narx (AED)",
        soldPrice: "Sotuv narxi",
        profit: "Foyda",
        margin: "Marja",
        days: "Kunlar",
        decision: "Qaror",
        actions: "Amallar",
        view: "Ko'rish",
        viewDetails: "Batafsil ko'rish",
      },
      details: {
        overview: "Umumiy ko‘rsatkichlar",
        purchase: "Xarid",
        expenses: "Xarajatlar (AED)",
        direct: "To‘g‘ridan-to‘grilar",
        overhead: "Umumiy (overhead)",
        total: "Jami",
        sale: "Sotuv",
        netProfit: "Net foyda (AED)",
        totalCostAED: "Jami tannarx (AED)",
      }
      ,
      addTitle: "Yangi avtomobil qo‘shish",
      addCta: "Qo‘shish",

    },
    pagination: {
      previous: "Oldingi",
      next: "Keyingi",
      page: "Sahifa",
    },
    profit: {
      costBreakdown: "Xarajatlar tarkibi",
      purchasePrice: "Xarid narxi",
      directExpenses: "To'g'ridan-to'g'ri xarajatlar",
      directExpensesDesc: "Transport, ta'mir, detalling",
      overheadExpenses: "Umumiy xarajatlar",
      overheadExpensesDesc: "Ijara, oylik, reklama",
      totalCost: "Jami tan narx",
      costComposition: "Xarajatlar tarkibi",
      profitBreakdown: "Foyda hisob-kitobi",
      salePrice: "Sotuv narxi",
      commission: "Komissiya",
      netProfit: "Sof foyda",
      margin: "Marja",
      marginDesc: "Sotuv narxidan",
      roi: "ROI",
      roiDesc: "Investitsiyadan",
      excellent: "A'lo",
      good: "Yaxshi",
      low: "Past",
    },
    analytics: {
      title: "Analitika",
      subtitle: "Foyda va sotuvlar tahlili",
      noData: "Ma'lumot yo'q",
      profitOverTime: "Foyda dinamikasi",
      totalCars: "Jami avtomobillar",
      profitable: "foydali",
      loss: "zarar",
      avgProfit: "O'rtacha foyda",
      avgMargin: "O'rtacha marja",
      excellent: "A'lo",
      good: "Yaxshi",
      needsImprovement: "Yaxshilash kerak",
      range: "Diapason",
      profitByDate: "Sanalar bo'yicha foyda",
      profit: "Foyda",
      topPerformers: "Eng foydali sotuvlar",
      margin: "marja",
      lossWarning: "Zarar ko'rgan avtomobillar",
      carsWithLoss: "ta avtomobil zarar bilan sotilgan",
      totalProfit: "Jami foyda",
      carsSold: "Sotilgan avtomobillar",
      avgDaysToSell: "O'rtacha sotuv muddati",
      days: "kun",
      topProfitableCars: "Eng foydali avtomobillar",
      rank: "#",
      car: "Avtomobil",
      soldDate: "Sotuv sanasi",
      daysOnLot: "Kunlar",
      lossCars: "Zarar ko'rgan avtomobillar",
    },
    reports: {
      title: "Hisobotlar",
      export: {
        carsCsv: "CSV yuklab olish — Avtomobillar",
        expensesCsv: "CSV yuklab olish — Xarajatlar",
        incomesCsv: "CSV yuklab olish — Daromad",
        movementsCsv: "CSV yuklab olish — Kapital harakati",
        dailyExpenses: "Kunlik xarajatlar (hisobot)",
      }
,
      dailyExpensesPage: {
        title: "Kunlik xarajatlar",
        today: "Bugun",
        yesterday: "Kecha",
        filters: {
          scope: "Scope",
          all: "Hammasi",
          overhead: "Umumiy",
          personal: "Shaxsiy",
          onlyCar: "Faqat avto (car_id)",
          car: "Avto",
          category: "Toifa",
        },
        summary: {
          totalAed: "Jami AED",
          byCategory: "Toifa bo‘yicha",
          byCar: "Avto/Hisob bo‘yicha",
        },
        table: {
          date: "Sana",
          amountAed: "Miqdor (AED)",
          category: "Toifa",
          car: "Avto/Hisob",
          description: "Izoh",
        },
        scope: { personal: "Shaxsiy" },
        export: { expensesCsvWithRange: "CSV yuklab olish — Xarajatlar (filtrlar saqlanadi, davr)" },
      }

    },
    guide: {
      title: "Qo'llanma",
      sections: {
      updated: {
        title: "Qo'llanma (yangilangan)",
        heading: "1) Nimalar yangilandi",
        items: {
          item1: "Yagona dizayn: Card, jadval (sticky thead), EmptyState, bir xil input/knopka uslublari.",
          item2: "Faol bo'lim indikatorlari (navigatsiyada hozir qaysi sahifa ochiq  aniq ko'rinadi).",
          item3: "Filtrlar: sana (hamma joyda), Expenses  toifa va avto, Incomes  avto. Pleyxsolderlar: Barcha .",
          item4: "Avto ro'yxati kengaytirilgan: foyda, marja %, kunlar (days on lot).",
          item5: "Hisob-kitoblar barqaror: sotishda deal_snapshot yoziladi, tarixiy hisobotlar o'zgarmaydi.",
        },
      },
      flow: {
        title: "2) Ish jarayoni qisqacha",
        items: {
          item1: "Xarajat qo'shing: sana, miqdor, valyuta, AED kursi, toifa. Avto tanlasangiz  o'sha avtoga, tanlamasangiz  Umumiy/Shaxsiy bo'ladi.",
          item2: "Umumiy/Shaxsiy uchun miqdor/kurs/sana kiritilganda taqsimot preview pastda ko'rinadi.",
          item3: "Daromad qo'lda faqat boshqa tushumlar uchun. Sotuv daromadi avtomatik: mashinani sold qilganda yoziladi.",
          item4: "Valyuta kurslarini FX sahifasida qo'shing (bazaAED).",
          item5: "Capital: balanslar, kirim/chiqim/korrektirovka va kuzatuv jadvali.",
        },
      },
      expenses: {
        title: "3) Xarajatlar (Expenses)",
        items: {
          item1: "Forma: Sana, Miqdor, Valyuta, AED kursi, Toifa, Izoh, Avto (ixtiyoriy).",
          item2: "Avto bo'sh  Umumiy/Shaxsiy; Avto tanlangan  aynan o'sha avtoga yoziladi.",
          item3: "Preview uchun miqdor+kurs+sana to'ldiring  faol avtolar orasida taqsimot ko'rinadi.",
          item4: "Filtrlar: Sana dan/ga, Toifa, Avto. Pleyxsolderlar  Barcha toifalar, Barcha avtolar.",
          item5: "Jadval sarlavhasi yopishqoq, AED summalar formatlangan, bo'sh ro'yxatda EmptyState.",
        },
      },
      incomes: {
        title: "4) Daromadlar (Incomes)",
        items: {
          item1: "Sotuv daromadi qo'lda kiritilmaydi. Avto sahifasida sold qilganda tizim [SALE] daromadini yozadi.",
          item2: "Boshqa tushumlar uchun forma: Sana, Miqdor, Valyuta, AED kursi, Izoh, Avto.",
          item3: "Filtrlar: Sana dan/ga, Avto (Barcha avtolar).",
        },
      },
      fx: {
        title: "5) Valyuta kurslari (FX)",
        items: {
          item1: "Kurs qo'shish: Sana, Baza valyuta (USD/EUR/AED), Kurs (bazaAED).",
          item2: "Ro'yxat: Sana, Juft, Kurs. Filtr  sana bo'yicha.",
        },
      },
      capital: {
        title: "6) Kapital (Capital)",
        items: {
          item1: "Hisoblar: investor, business, owner, assistant.",
          item2: "Harakatlar: deposit / withdraw / adjust. Sana, summa, sabab, (ixtiyoriy) bog'lanishlar.",
          item3: "Sahifada balans kartalari, so'nggi harakatlar jadvali va sana bo'yicha filtrlar mavjud.",
        },
      },
      sell: {
        title: "7) Mashinani sotish va snapshot",
        items: {
          item1: "Cars  mashina sahifasida statusni sold ga o'tkazing, sotuv sanasi/summasi/valyuta/AED kursini kiriting.",
          item2: "Tizim [SALE] daromadini avtomatik yozadi va deal_snapshot saqlaydi  tarixiy foyda o'zgarmaydi.",
          item3: "Qo'lda sotuv daromadini kiritmang  ikki marta hisoblanib qoladi.",
        },
      },
      reports: {
        title: "8) Hisobotlar",
        items: {
          item1: "Reports sahifasida eksport/ko'rinishlar mavjud (masalan, kunlik xarajatlar).",
          item2: "Foyda va xarajatlar hisob-kitobi ma'lumotlar bazasidagi maxsus ko'rinishlar orqali samarali olinadi.",
        },
      },
      profit: {
        title: "9) Foyda formulasi",
        p: "Foyda = Sotuv (AED)  (Xarid (AED) + Barcha xarajatlar (AED)). Umumiy/Shaxsiy xarajatlar faol avtolar orasida qo'llanilgan usul bo'yicha taqsimlanadi.",
      },
      faq: {
        title: "10) Tez-tez so'raladigan savollar",
        items: {
          item1: "Daromad sahifasida sotuvni ko'rsatamanmi?  Yo'q. Sotuv faqat avto sahifasida (sold), tizim o'zi yozadi.",
          item2: "Preview ko'rinmayapti?  Avto tanlanmagan bo'lsin va Miqdor + AED kursi + Sana to'ldirilgan bo'lsin.",
          item3: "Bo'sh jadval chiqdi?  Filtrlar toraytirgandir; Barcha  ni tanlab ko'ring yoki sanalarni kengaytiring.",
        },
      },
    },

    table: {
      search: "Qidiruv...",
      exportCsv: "CSV eksport",
      totalsAed: "Jami (AED):",
    },
    dashboard: {
      title: "Avtomobil CRM Boshqaruv Paneli",
      subtitle: "Avtomobillar bozorini boshqarish tizimi. Barcha ma'lumotlar real vaqtda yangilanadi.",
      last30: "So‘nggi 30 kun ma‘lumotlari",
      kpi: {
        totalProfit: "Umumiy foyda",
        avgMargin: "O‘rtacha marja",
        medianDays: "O‘rtacha sotish vaqti",
        activeCars: "Faol avtomobillar",
      },
      cards: {
        total: {
          title: "Jami avtomobillar",
          description: "Jami avtomobillar soni"
        },
        in_transit: {
          title: "Yo'lda",
          description: "Yo'lda bo'lgan avtomobillar"
        },
        garage: {
          title: "Garajda",
          description: "Garajda va ta'mirda"
        },
        for_sale: {
          title: "Sotuvda",
          description: "Sotuvga qo'yilgan"
        },
        sold: {
          title: "Sotilgan",
          description: "Sotilgan avtomobillar"
        },
        reserved: {
          title: "Band",
          description: "Bron qilingan"
        }
      },
      inventory: { title: "Inventar holati" },
      topProfit: { title: "Eng foydali avtomobillar", empty: "Ma‘lumot yo‘q" },
      lossCars: { title: "Zarar keltirgan avtomobillar", empty: "Zarar yo‘q 🎉" },
      brands: { title: "Brendlar bo‘yicha taqsimot", unit: "ta avtomobil", avgProfit: "O‘rtacha foyda:", avgMargin: "O‘rtacha marja:" },
      activity: { title: "So‘nggi faoliyat" },
      viewDetails: "Ko'rish",
      quickActions: {
        title: "Tezkor amallar",
        subtitle: "Tez-tez ishlatiladigan amallar",
        viewCars: {
          title: "Avtomobillar",
          description: "Barcha avtomobillarni ko'rish"
        },
        addCar: {
          title: "Yangi avtomobil",
          description: "Yangi avtomobil qo'shish"
        },
        expenses: {
          title: "Xarajatlar",
          description: "Xarajatlarni boshqarish"
        },
        reports: {
          title: "Hisobotlar",
          description: "Moliyaviy hisobotlar"
        }
      },
    },

    common: {

      apply: "Qo‘llash",
      cancel: "Bekor qilish",
      save: "Saqlash",
      edit: "Tahrirlash",
    },
    expenses: {
      title: "Xarajatlar",
      filters: "Filtrlar",
      addTitle: "Xarajat qo‘shish",
      fields: {
        date: "Sana",
        amount: "Miqdor",
        currency: "Valyuta",
        rate: "AED ga kurs",
        category: "Toifa",
        description: "Izoh",
        car: "Avto/Hisob",
      },
      categories: {
        all: "Barcha toifalar",
        purchase: "Xarid",
        transport: "Transport",
        repair: "Ta'mirlash",
        detailing: "Detalling",
        ads: "Reklama",
        fees: "To'lov/Komissiya",
        fuel: "Yoqilg'i",
        parking: "Parkovka",
        rent: "Ijara",
        salary: "Oylik",
        other: "Boshqa",
      },
      scopeNone: "(Umumiy/Shaxsiy)",
      quickAdd: { cta: "Xarajat qo‘shish", title: "Xarajat tez qo‘shish" },
      noteOverhead: "Eslatma: Avto tanlanmasa, xarajat \u201cUmumiy/Shaxsiy\u201d hisoblanadi va avtomatik ravishda faol mashinalar orasida taqsimlanadi.",

    },
    incomes: {
      title: "Daromad (qo'lda)",
      filters: "Filtrlar",
      addTitle: "Daromad qo‘shish",
      noteSaleAuto: "Eslatma: Avto sotilganda tushum avtomatik yoziladi.",
      fields: {
        date: "Sana",
        amount: "Miqdor",
        currency: "Valyuta",
        rate: "AED ga kurs",
        description: "Izoh",
        car: "Avto",
      },
    },

    fx: {
      title: "Valyuta kurslari",
      filters: "Filtrlar",
      addTitle: "Kurs qo‘shish",
      table: { date: "Sana", pair: "Juft", rate: "Kurs" },
    },
    capital: {
      title: "Kapital va harakatlar",
      filters: "Filtrlar",
      addTitle: "Kapital harakati qo‘shish",
      addCta: "Qo‘shish",
      table: {
        date: "Sana",
        account: "Hisob",
        amountAed: "Miqdor (AED)",
        reason: "Sabab",
        links: "Bog‘lanmalar",
      },
      accounts: {
        investor: "investor",
        business: "business",
        owner: "owner",
        assistant: "assistant",
      },
    },

      quickAdd: { cta: "Tez qo‘shish", title: "Daromad tez qo‘shish" },
    },
  },
  ru: {
    nav: {
      panel: "Главная",
      cars: "Автомобили",
      expenses: "Расходы",
      analytics: "Аналитика",
      reports: "Отчеты",
      addCar: "Добавить авто",
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
    status: {
      in_transit: "В пути",
      for_sale: "В продаже",
      reserved: "Резерв",
      sold: "Продан",
      archived: "Архив",
      available: "Доступен",
      repair: "Ремонт",
      listed: "Выставлен",
    },
    cars: {
      title: "Автомобили",
      subtitle: "Список всех автомобилей и их статусы",
      search: "Поиск: VIN, марка, модель...",
      view: "Вид:",
      showing: "Показано:",
      empty: "Автомобили не найдены",
      noResults: "Ничего не найдено",
      addNew: "Добавить новый",
      summary: {
        total: "Всего",
        totalProfit: "Общая прибыль",
        avgMargin: "Средняя маржа",
      },
      table: {
        car: "Автомобиль",
        status: "Статус",
        purchaseDate: "Дата покупки",
        purchasePrice: "Закупочная цена",
        totalCost: "Себестоимость (AED)",
        soldPrice: "Цена продажи",
        profit: "Прибыль",
        margin: "Маржа",
        days: "Дней",
        decision: "Решение",
        actions: "Действия",
        view: "Открыть",
        viewDetails: "Подробнее",
      },
      details: {
        overview: "Сводка",
        purchase: "Покупка",
        expenses: "Расходы (AED)",
        direct: "Прямые",
        overhead: "Накладные",
        total: "Итого",

        sale: "Продажа",
        netProfit: "Чистая прибыль (AED)",
        totalCostAED: "Общая себестоимость (AED)",
      }
      ,
      addTitle: "Добавить автомобиль",
      addCta: "Добавить",

    },
    pagination: {
      previous: "Предыдущая",
      next: "Следующая",
      page: "Страница",
    },
    profit: {
      costBreakdown: "Структура расходов",
      purchasePrice: "Цена покупки",
      directExpenses: "Прямые расходы",
      directExpensesDesc: "Транспорт, ремонт, детейлинг",
      overheadExpenses: "Накладные расходы",
      overheadExpensesDesc: "Аренда, зарплата, реклама",
      totalCost: "Общая себестоимость",
      costComposition: "Состав расходов",
      profitBreakdown: "Расчет прибыли",
      salePrice: "Цена продажи",
      commission: "Комиссия",
      netProfit: "Чистая прибыль",
      margin: "Маржа",
      marginDesc: "От цены продажи",
      roi: "ROI",
      roiDesc: "От инвестиций",
      excellent: "Отлично",
      good: "Хорошо",
      low: "Низко",
    },
    analytics: {
      title: "Аналитика",
      subtitle: "Анализ прибыли и продаж",
      noData: "Нет данных",
      profitOverTime: "Динамика прибыли",
      totalCars: "Всего автомобилей",
      profitable: "прибыльных",
      loss: "убыток",
      avgProfit: "Средняя прибыль",
      avgMargin: "Средняя маржа",
      excellent: "Отлично",
      good: "Хорошо",
      needsImprovement: "Требует улучшения",
      range: "Диапазон",
      profitByDate: "Прибыль по датам",
      profit: "Прибыль",
      topPerformers: "Лучшие продажи",
      margin: "маржа",
      lossWarning: "Автомобили с убытком",
      carsWithLoss: "автомобилей проданы с убытком",
      totalProfit: "Общая прибыль",
      carsSold: "Продано автомобилей",
      avgDaysToSell: "Средний срок продажи",
      days: "дней",
      topProfitableCars: "Самые прибыльные автомобили",
      rank: "#",
      car: "Автомобиль",
      soldDate: "Дата продажи",
      daysOnLot: "Дней",
      lossCars: "Автомобили с убытком",
    },
    table: {
      search: "Поиск...",
      exportCsv: "Экспорт CSV",
      totalsAed: "Итого (AED):",
    },
    common: {
      apply: "Применить",
      cancel: "Отмена",
      save: "Сохранить",
      edit: "Редактировать",
    },
    expenses: {
      title: "Расходы",
      filters: "Фильтры",
      addTitle: "Добавить расход",
      fields: {
        date: "Дата",
        amount: "Сумма",
        currency: "Валюта",
        rate: "Курс в AED",
        category: "Категория",
        description: "Описание",
        car: "Авто/Счет",
      },
      categories: {
        all: "Все категории",
        purchase: "Покупка",
        transport: "Транспорт",
        repair: "Ремонт",
        detailing: "Детейлинг",
        ads: "Реклама",
        fees: "Комиссия/Сборы",
        fuel: "Топливо",
        parking: "Парковка",
        rent: "Аренда",
        salary: "Зарплата",
        other: "Другое",
      },
      scopeNone: "(Общий/Личный)",
      quickAdd: { cta: "Добавить расход", title: "Быстрое добавление расхода" },
      noteOverhead: "Если авто не выбрано, расход считается \u00abОбщий/Личный\u00bb и автоматически распределяется между активными машинами.",

    dashboard: {
      title: "Панель управления",
      subtitle: "Система управления автомобильным бизнесом. Все данные обновляются в реальном времени.",
      last30: "Данные за последние 30 дней",
      kpi: {
        totalProfit: "Общая прибыль",
        avgMargin: "Средняя маржа",
        medianDays: "Медианное время продажи",
        activeCars: "Активные авто",
      },
      cards: {
        total: {
          title: "Всего автомобилей",
          description: "Общее количество автомобилей"
        },
        in_transit: {
          title: "В пути",
          description: "Автомобили в пути"
        },
        garage: {
          title: "В гараже",
          description: "В гараже и на ремонте"
        },
        for_sale: {
          title: "В продаже",
          description: "Выставлены на продажу"
        },
        sold: {
          title: "Продано",
          description: "Проданные автомобили"
        },
        reserved: {
          title: "В резерве",
          description: "Забронированные"
        }
      },
      inventory: { title: "Статус инвентаря" },
      topProfit: { title: "Самые прибыльные авто", empty: "Нет данных" },
      lossCars: { title: "Убыточные авто", empty: "Убытков нет 🎉" },
      brands: { title: "Распределение по брендам", unit: "авто", avgProfit: "Средняя прибыль:", avgMargin: "Средняя маржа:" },
      activity: { title: "Последняя активность" },
      viewDetails: "Просмотр",
      quickActions: {
        title: "Быстрые действия",
        subtitle: "Часто используемые действия",
        viewCars: {
          title: "Автомобили",
          description: "Просмотр всех автомобилей"
        },
        addCar: {
          title: "Новый автомобиль",
          description: "Добавить новый автомобиль"
        },
        expenses: {
          title: "Расходы",
          description: "Управление расходами"
        },
        reports: {
          title: "Отчеты",
          description: "Финансовые отчеты"
        }
      },
    },
    reports: {
      title: "Отчеты",
      export: {
        carsCsv: "CSV — Автомобили",
        expensesCsv: "CSV — Расходы",
        incomesCsv: "CSV — Доходы",
        movementsCsv: "CSV — Движения капитала",
        dailyExpenses: "Ежедневные расходы",
      },
      dailyExpensesPage: {
        title: "Ежедневные расходы",
        today: "Сегодня",
        yesterday: "Вчера",
        filters: {
          scope: "Область",
          all: "Все",
          overhead: "Общий",
          personal: "Личный",
          onlyCar: "Только авто (car_id)",
          car: "Авто",
          category: "Категория",
        },
        summary: {
          totalAed: "Итого AED",
          byCategory: "По категориям",
          byCar: "По авто/счету",
        },
        table: {
          date: "Дата",
          amountAed: "Сумма (AED)",
          category: "Категория",
          car: "Авто/Счет",
          description: "Описание",
        },
        scope: { personal: "Личный" },
        export: { expensesCsvWithRange: "CSV — Расходы (сохранены фильтры, период)" },
      },
    },

    incomes: {
      title: "Доходы (вручную)",
      filters: "Фильтры",
      addTitle: "Добавить доход",
      noteSaleAuto: "Напоминание: доход от продажи создается автоматически.",
      fields: {
        date: "Дата",
        amount: "Сумма",
        currency: "Валюта",
        rate: "Курс в AED",
        description: "Описание",
        car: "Авто",
      },
      quickAdd: { cta: "Быстро добавить", title: "Быстрое добавление дохода" },
    },
    fx: {
      title: "Курсы валют",
      filters: "Фильтры",
      addTitle: "Добавить курс",
      table: { date: "Дата", pair: "Пара", rate: "Курс" },
    },
    capital: {
      title: "Капитал и движения",
      filters: "Фильтры",
      addTitle: "Добавить движение капитала",
      addCta: "Добавить",
      table: {
        date: "Дата",
        account: "Счет",
        amountAed: "Сумма (AED)",
        reason: "Причина",
        links: "Связки",
      },
      accounts: {
        investor: "инвестор",
        business: "бизнес",
        owner: "владелец",
        assistant: "ассистент",
      },
    },

    guide: {
      title: "Руководство",
    }
  }
}};

