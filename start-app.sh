#!/bin/bash

echo "🚀 Запуск Car Expense Tracker"
echo "================================"

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 18+ и попробуйте снова."
    exit 1
fi

# Проверяем версию Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js версии 18 или выше. Текущая версия: $(node -v)"
    exit 1
fi

echo "✅ Node.js версия: $(node -v)"

# Проверяем наличие .env.local
if [ ! -f ".env.local" ]; then
    echo "❌ Файл .env.local не найден!"
    echo "Создайте файл .env.local с настройками Supabase"
    exit 1
fi

echo "✅ Файл .env.local найден"

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Ошибка установки зависимостей"
    exit 1
fi

echo "✅ Зависимости установлены"

# Запускаем приложение
echo "🌐 Запускаем приложение..."
echo "Приложение будет доступно по адресу: http://localhost:3000"
echo "Тест подключения: http://localhost:3000/test-connection"
echo ""
echo "Нажмите Ctrl+C для остановки"
echo ""

npm run dev
