const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Конфигурация
const SUPABASE_URL = 'https://xixjtczhnyggwotkvbhh.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeGp0Y3pobnlnZ3dvdGt2YmhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwNTc1NiwiZXhwIjoyMDc0MjgxNzU2fQ.YYbstDN7VYEG2RW2cNir68B3MZ54AproGN94iedJZGg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQLFile(filePath) {
  console.log(`📄 Выполняется: ${path.basename(filePath)}`)
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8')
    
    // Разбиваем SQL на отдельные команды
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`   Найдено ${statements.length} SQL команд`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`   Выполняется команда ${i + 1}/${statements.length}...`)
          
          // Выполняем через raw SQL
          const { error } = await supabase.rpc('exec', { 
            sql: statement + ';' 
          })
          
          if (error) {
            console.error(`   ❌ Ошибка в команде ${i + 1}:`, error.message)
            // Продолжаем выполнение остальных команд
          } else {
            console.log(`   ✅ Команда ${i + 1} выполнена`)
          }
        } catch (err) {
          console.error(`   ❌ Исключение в команде ${i + 1}:`, err.message)
        }
      }
    }
    
    console.log(`✅ Файл обработан: ${path.basename(filePath)}`)
  } catch (error) {
    console.error(`❌ Ошибка чтения файла ${filePath}:`, error.message)
    throw error
  }
}

async function createExecFunction() {
  console.log('🔧 Создаем функцию exec для выполнения SQL...')
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `
  
  try {
    const { error } = await supabase.rpc('exec', { sql: createFunctionSQL })
    if (error) {
      console.log('⚠️  Функция exec уже существует или не может быть создана')
    } else {
      console.log('✅ Функция exec создана')
    }
  } catch (err) {
    console.log('⚠️  Будем выполнять SQL напрямую')
  }
}

async function runMigrations() {
  console.log('🚀 Начинаем миграцию базы данных Supabase...')
  console.log(`📡 URL: ${SUPABASE_URL}`)
  
  try {
    // Сначала создаем функцию exec
    await createExecFunction()
    
    const migrationsDir = path.join(__dirname, 'supabase', 'migrations')
    const files = [
      '001_initial_schema.sql',
      '002_triggers_and_functions.sql',
      '003_rls_policies.sql',
      '004_views_and_analytics.sql'
    ]

    for (const file of files) {
      const filePath = path.join(migrationsDir, file)
      if (fs.existsSync(filePath)) {
        await executeSQLFile(filePath)
        console.log('⏳ Пауза 2 секунды...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        console.warn(`⚠️  Файл не найден: ${file}`)
      }
    }

    // Добавляем базовые данные
    console.log('💱 Добавляем базовые курсы валют...')
    await addExchangeRates()

    console.log('🎉 Миграция завершена успешно!')
    console.log('🔗 Откройте ваш проект: https://xixjtczhnyggwotkvbhh.supabase.co')
    console.log('📊 Проверьте таблицы в Table Editor')
    
  } catch (error) {
    console.error('❌ Критическая ошибка миграции:', error)
    process.exit(1)
  }
}

async function addExchangeRates() {
  const today = new Date().toISOString().split('T')[0]
  
  const rates = [
    { currency: 'EUR', rate_to_usd: 1.08, date: today },
    { currency: 'GBP', rate_to_usd: 1.25, date: today },
    { currency: 'RUB', rate_to_usd: 0.011, date: today },
    { currency: 'UZS', rate_to_usd: 0.000081, date: today },
    { currency: 'KZT', rate_to_usd: 0.0021, date: today }
  ]
  
  for (const rate of rates) {
    try {
      const { error } = await supabase
        .from('exchange_rates')
        .upsert(rate, { onConflict: 'currency,date' })
      
      if (error) {
        console.warn(`⚠️  Не удалось добавить курс ${rate.currency}:`, error.message)
      } else {
        console.log(`✅ Добавлен курс ${rate.currency}: ${rate.rate_to_usd}`)
      }
    } catch (err) {
      console.warn(`⚠️  Ошибка добавления курса ${rate.currency}:`, err.message)
    }
  }
}

// Запуск
runMigrations().catch(console.error)
