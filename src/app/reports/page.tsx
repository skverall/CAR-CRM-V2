import Link from "next/link";
import Text from "@/app/components/i18n/Text";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  const reportCards = [
    {
      title: "reports.analytics.title",
      description: "reports.analytics.description",
      href: "/reports/analytics",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      gradient: "from-blue-500 to-blue-600",
      fallbackTitle: "Analitika",
      fallbackDescription: "Foyda va sotuvlar tahlili, grafik va statistika"
    },
    {
      title: "reports.dailyExpenses.title",
      description: "reports.dailyExpenses.description",
      href: "/reports/daily-expenses",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      gradient: "from-amber-500 to-amber-600",
      fallbackTitle: "Kunlik xarajatlar",
      fallbackDescription: "Kunlik xarajatlar hisoboti va filtrlash"
    },
    {
      title: "reports.export.title",
      description: "reports.export.description",
      href: "#export",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gradient: "from-green-500 to-green-600",
      fallbackTitle: "Eksport",
      fallbackDescription: "Ma'lumotlarni CSV formatida yuklab olish"
    },
    {
      title: "reports.financial.title",
      description: "reports.financial.description",
      href: "#financial",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: "from-purple-500 to-purple-600",
      fallbackTitle: "Moliyaviy hisobot",
      fallbackDescription: "Umumiy moliyaviy ko'rsatkichlar va tahlil"
    }
  ];

  const exportOptions = [
    {
      label: "reports.export.carsCsv",
      description: "reports.export.carsDescription",
      href: "/api/export/cars",
      fallback: "Avtomobillar (CSV)"
    },
    {
      label: "reports.export.expensesCsv",
      description: "reports.export.expensesDescription",
      href: "/api/export/expenses",
      fallback: "Xarajatlar (CSV)"
    },
    {
      label: "reports.export.incomesCsv",
      description: "reports.export.incomesDescription",
      href: "/api/export/incomes",
      fallback: "Daromadlar (CSV)"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <Text path="reports.badge" fallback="Hisobotlar markazi" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
          <Text path="reports.title" fallback="Hisobotlar" />
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          <Text path="reports.subtitle" fallback="Moliyaviy hisobotlar, analitika va ma'lumotlarni eksport qilish" />
        </p>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((card, index) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
            
            <div className="relative p-8">
              <div className="flex items-start gap-6">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0`}>
                  {card.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    <Text path={card.title} fallback={card.fallbackTitle} />
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <Text path={card.description} fallback={card.fallbackDescription} />
                  </p>

                  {/* Arrow indicator */}
                  <div className="mt-4 flex items-center text-sm font-medium text-gray-400 group-hover:text-blue-600 transition-colors">
                    <span><Text path="reports.viewReport" fallback="Hisobotni ko'rish" /></span>
                    <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Export Section */}
      <div id="export" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              <Text path="reports.export.sectionTitle" fallback="Ma'lumotlarni eksport qilish" />
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              <Text path="reports.export.sectionDescription" fallback="Barcha ma'lumotlarni CSV formatida yuklab oling" />
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exportOptions.map((option) => (
            <a
              key={option.href}
              href={option.href}
              download
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">
                  <Text path={option.label} fallback={option.fallback} />
                </div>
                {option.description && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    <Text path={option.description} fallback="" />
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              <Text path="reports.info.title" fallback="Hisobotlar haqida" />
            </h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              <Text path="reports.info.description" fallback="Barcha hisobotlar real vaqtda yangilanadi va sizning tashkilotingiz ma'lumotlariga asoslangan. Eksport qilingan fayllar Excel yoki Google Sheets da ochilishi mumkin." />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

