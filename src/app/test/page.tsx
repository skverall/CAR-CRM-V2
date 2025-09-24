export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Сайт работает!</h1>
        <p className="text-gray-600">Деплой прошел успешно</p>
        <div className="mt-4 space-y-2">
          <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}</p>
          <p><strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}</p>
        </div>
      </div>
    </div>
  )
}
