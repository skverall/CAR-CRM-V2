const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Конфигурация Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Пожалуйста, установите переменные окружения NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function executeSQLFile(filePath) {
  try {
    console.log(`📄 Выполняется миграция: ${filePath}`)
    const sql = fs.readFileSync(filePath, 'utf8')
    
    // Разделяем SQL на отдельные команды
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    for (const command of commands) {
      if (command.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: command })
        if (error) {
          console.error(`❌ Ошибка выполнения команды: ${command.substring(0, 100)}...`)
          console.error(error)
          throw error
        }
      }
    }
    
    console.log(`✅ Миграция выполнена: ${filePath}`)
  } catch (error) {
    console.error(`❌ Ошибка в файле ${filePath}:`, error)
    throw error
  }
}

async function runMigrations() {
  console.log('🚀 Начинаем выполнение миграций...')
  
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations')
  const migrationFiles = [
    '001_initial_schema.sql',
    '002_triggers_and_functions.sql', 
    '003_rls_policies.sql',
    '004_views_and_analytics.sql'
  ]
  
  try {
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file)
      if (fs.existsSync(filePath)) {
        await executeSQLFile(filePath)
      } else {
        console.warn(`⚠️  Файл не найден: ${filePath}`)
      }
    }
    
    console.log('🎉 Все миграции выполнены успешно!')
    
    // Добавляем базовые курсы валют
    console.log('💱 Добавляем базовые курсы валют...')
    await addBasicExchangeRates()
    
    console.log('✅ Настройка базы данных завершена!')
  } catch (error) {
    console.error('❌ Ошибка при выполнении миграций:', error)
    process.exit(1)
  }
}

async function addBasicExchangeRates() {
  const today = new Date().toISOString().split('T')[0]
  
  const rates = [
    { currency: 'EUR', rate_to_usd: 1.08, date: today },
    { currency: 'GBP', rate_to_usd: 1.25, date: today },
    { currency: 'RUB', rate_to_usd: 0.011, date: today },
    { currency: 'UZS', rate_to_usd: 0.000081, date: today },
    { currency: 'KZT', rate_to_usd: 0.0021, date: today },
  ]
  
  for (const rate of rates) {
    const { error } = await supabase
      .from('exchange_rates')
      .upsert(rate, { onConflict: 'currency,date' })
    
    if (error) {
      console.warn(`⚠️  Не удалось добавить курс для ${rate.currency}:`, error.message)
    } else {
      console.log(`✅ Добавлен курс ${rate.currency}: ${rate.rate_to_usd}`)
    }
  }
}

// Запускаем миграции
runMigrations()
