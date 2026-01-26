// Quick script to check Threat Assessments table structure
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
      .from('Threat Assessments')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error fetching data:', error)
      return
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0])
      const subcriteriaColumns = columns.filter(c => c.startsWith('Subcriteria_Scores_'))
      
      console.log('Total columns:', columns.length)
      console.log('\nSubcriteria columns:', subcriteriaColumns.length)
      console.log(subcriteriaColumns.sort())
    } else {
      console.log('No data in Threat Assessments table')
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

checkColumns()
