const fs = require('fs')
const path = require('path')

// Конфигурация Supabase
const SUPABASE_URL = 'https://xixjtczhnyggwotkvbhh.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeGp0Y3pobnlnZ3dvdGt2YmhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwNTc1NiwiZXhwIjoyMDc0MjgxNzU2fQ.YYbstDN7VYEG2RW2cNir68B3MZ54AproGN94iedJZGg'

async function executeSQL(sql) {
  // Используем прямое подключение к PostgreSQL через Supabase API
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      sql: sql.trim()
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`HTTP ${response.status}: ${error}`)

    // Попробуем альтернативный способ через SQL Editor API
    return await executeSQLDirect(sql)
  }

  return response.json()
}

async function executeSQLDirect(sql) {
  // Альтернативный способ через прямое выполнение SQL
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data, error } = await supabase.rpc('exec', { sql })
  if (error) throw error
  return data
}

async function runMigration(filePath) {
  console.log(`📄 Выполняется: ${path.basename(filePath)}`)
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8')
    await executeSQL(sql)
    console.log(`✅ Выполнено: ${path.basename(filePath)}`)
  } catch (error) {
    console.error(`❌ Ошибка в ${path.basename(filePath)}:`, error.message)
    throw error
  }
}

async function main() {
  console.log('🚀 Начинаем миграцию базы данных...')
  
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations')
  const files = [
    '001_initial_schema.sql',
    '002_triggers_and_functions.sql',
    '003_rls_policies.sql', 
    '004_views_and_analytics.sql'
  ]

  try {
    for (const file of files) {
      const filePath = path.join(migrationsDir, file)
      if (fs.existsSync(filePath)) {
        await runMigration(filePath)
      } else {
        console.warn(`⚠️  Файл не найден: ${file}`)
      }
    }

    // Добавляем базовые данные
    console.log('💱 Добавляем базовые курсы валют...')
    await addExchangeRates()

    console.log('🎉 Миграция завершена успешно!')
  } catch (error) {
    console.error('❌ Ошибка миграции:', error)
    process.exit(1)
  }
}

async function addExchangeRates() {
  const today = new Date().toISOString().split('T')[0]
  
  const insertSQL = `
    INSERT INTO exchange_rates (currency, rate_to_usd, date) VALUES
    ('EUR', 1.08, '${today}'),
    ('GBP', 1.25, '${today}'),
    ('RUB', 0.011, '${today}'),
    ('UZS', 0.000081, '${today}'),
    ('KZT', 0.0021, '${today}')
    ON CONFLICT (currency, date) DO UPDATE SET
    rate_to_usd = EXCLUDED.rate_to_usd;
  `
  
  try {
    await executeSQL(insertSQL)
    console.log('✅ Курсы валют добавлены')
  } catch (error) {
    console.warn('⚠️  Не удалось добавить курсы валют:', error.message)
  }
}

main()
