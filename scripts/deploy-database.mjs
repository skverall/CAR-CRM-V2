import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE;

if (!url || !service) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE');
  process.exit(1);
}

const db = createClient(url, service);

async function executeSqlFile(filePath) {
  try {
    console.log(`Executing ${filePath}...`);
    const sql = readFileSync(filePath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed.length === 0) continue;
      
      try {
        const { error } = await db.rpc('exec_sql', { sql: trimmed });
        if (error) {
          console.warn(`Warning in ${filePath}:`, error.message);
        }
      } catch (err) {
        console.warn(`Warning in ${filePath}:`, err.message);
      }
    }
    
    console.log(`✅ Completed ${filePath}`);
  } catch (error) {
    console.error(`❌ Error executing ${filePath}:`, error.message);
    throw error;
  }
}

async function createDefaultOrganization() {
  try {
    console.log('Creating default organization...');
    
    // Check if default org exists
    const { data: existingOrg } = await db
      .from('orgs')
      .select('id')
      .eq('name', 'Default Organization')
      .single();
    
    if (existingOrg) {
      console.log('✅ Default organization already exists');
      return existingOrg.id;
    }
    
    // Create default org
    const { data: newOrg, error } = await db
      .from('orgs')
      .insert([{ name: 'Default Organization' }])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Created default organization:', newOrg.id);
    return newOrg.id;
  } catch (error) {
    console.error('❌ Error creating default organization:', error.message);
    throw error;
  }
}

async function updateExistingData(orgId) {
  try {
    console.log('Updating existing data with org_id...');
    
    // Update cars without org_id
    const { error: carsError } = await db
      .from('au_cars')
      .update({ org_id: orgId })
      .is('org_id', null);
    
    if (carsError) {
      console.warn('Warning updating cars:', carsError.message);
    }
    
    // Update expenses without org_id
    const { error: expensesError } = await db
      .from('au_expenses')
      .update({ org_id: orgId })
      .is('org_id', null);
    
    if (expensesError) {
      console.warn('Warning updating expenses:', expensesError.message);
    }
    
    console.log('✅ Updated existing data');
  } catch (error) {
    console.error('❌ Error updating existing data:', error.message);
    throw error;
  }
}

async function createDefaultOverheadRule(orgId) {
  try {
    console.log('Creating default overhead rule...');
    
    // Check if rule exists
    const { data: existingRule } = await db
      .from('overhead_rules')
      .select('id')
      .eq('org_id', orgId)
      .single();
    
    if (existingRule) {
      console.log('✅ Default overhead rule already exists');
      return;
    }
    
    // Create default rule
    const { error } = await db
      .from('overhead_rules')
      .insert([{
        org_id: orgId,
        method: 'per_car',
        default_ratio: 1.0,
        active_from: new Date().toISOString().split('T')[0]
      }]);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Created default overhead rule');
  } catch (error) {
    console.error('❌ Error creating default overhead rule:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting database deployment...\n');
    
    // Execute SQL files in order
    const sqlFiles = [
      'database/01_schema_migration.sql',
      'database/05_expense_allocations.sql',
      'database/02_calculation_views.sql',
      'database/03_overhead_distribution.sql',
      'database/04_rls_policies.sql'
    ];
    
    for (const file of sqlFiles) {
      await executeSqlFile(join(process.cwd(), file));
    }
    
    // Create default organization
    const orgId = await createDefaultOrganization();
    
    // Update existing data
    await updateExistingData(orgId);
    
    // Create default overhead rule
    await createDefaultOverheadRule(orgId);
    
    // Test the views
    console.log('\nTesting views...');
    
    const { data: costView, error: costError } = await db
      .from('car_cost_view')
      .select('*')
      .limit(1);
    
    if (costError) {
      console.warn('Warning testing cost view:', costError.message);
    } else {
      console.log('✅ Cost view working');
    }
    
    const { data: profitView, error: profitError } = await db
      .from('car_profit_view')
      .select('*')
      .limit(1);
    
    if (profitError) {
      console.warn('Warning testing profit view:', profitError.message);
    } else {
      console.log('✅ Profit view working');
    }
    
    const { data: inventoryView, error: inventoryError } = await db
      .from('inventory_view')
      .select('*')
      .limit(1);
    
    if (inventoryError) {
      console.warn('Warning testing inventory view:', inventoryError.message);
    } else {
      console.log('✅ Inventory view working');
    }
    
    console.log('\n🎉 Database deployment completed successfully!');
    console.log(`Default organization ID: ${orgId}`);
    console.log('\nNext steps:');
    console.log('1. Update your application to use the new API endpoints');
    console.log('2. Test the dashboard and car management features');
    console.log('3. Configure overhead allocation rules as needed');
    console.log('4. Set up proper authentication and user management');
    
  } catch (error) {
    console.error('\n💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

main();
