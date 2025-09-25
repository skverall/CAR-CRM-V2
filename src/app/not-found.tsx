import { setRequestLocale } from 'next-intl/server'

export default function NotFound() {
  // Enable static rendering
  setRequestLocale('uz')
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Sahifa topilmadi
        </h2>
        <p className="text-gray-600 mb-8">
          Siz qidirayotgan sahifa mavjud emas yoki ko&apos;chirilgan.
        </p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Bosh sahifaga qaytish
        </a>
      </div>
    </div>
  )
}
