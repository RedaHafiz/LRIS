// Quick script to check Passport Data table structure
// Run with: node scripts/check-passport-columns.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  try {
    // Fetch one row to see the structure
    const { data, error } = await supabase
      .from('Passport Data')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error fetching data:', error)
      return
    }

    if (data && data.length > 0) {
      console.log('Passport Data table columns:')
      console.log(Object.keys(data[0]))
      console.log('\nSample row:')
      console.log(JSON.stringify(data[0], null, 2))
    } else {
      console.log('No data in Passport Data table')
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

checkColumns()
