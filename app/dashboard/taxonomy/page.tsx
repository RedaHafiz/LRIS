import { createClient } from '@/lib/supabase/server'
import CropTaxonomyView from '@/components/taxonomy/CropTaxonomyView'

export default async function TaxonomyPage() {
  const supabase = await createClient()

  // Fetch all crop taxonomy
  const { data: taxa } = await supabase
    .from('Taxa')
    .select('*')
    .order('crop_group')
    .order('primary_crop_type')
    .order('primary_crop_subtype')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Crop Taxonomy</h1>
        <p className="text-gray-600 mt-1">
          Browse crop taxonomic classifications and scientific names
        </p>
      </div>

      <CropTaxonomyView taxa={taxa || []} />
    </div>
  )
}
