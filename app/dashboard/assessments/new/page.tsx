import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ThreatAssessmentWizard from '@/components/assessments/ThreatAssessmentWizard'

export default async function NewAssessmentPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch existing crop and landrace names from Threat Assessments
  const { data: assessments } = await supabase
    .from('Threat Assessments')
    .select('Crop, LR_Name')

  const existingCrops = [...new Set(assessments?.map(a => a.Crop).filter(Boolean) || [])]
  const existingLandraces = [...new Set(assessments?.map(a => a.LR_Name).filter(Boolean) || [])]

  // Fetch all taxa for optional taxonomy linking
  const { data: taxa } = await supabase
    .from('Taxa')
    .select('*')
    .order('crop_group')
    .order('primary_crop_type')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Threat Assessment</h1>
      </div>

      <ThreatAssessmentWizard 
        existingCrops={existingCrops}
        existingLandraces={existingLandraces}
        taxa={taxa || []} 
        userId={user?.id || ''}
      />
    </div>
  )
}
