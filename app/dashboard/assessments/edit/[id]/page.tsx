import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ThreatAssessmentWizard from '@/components/assessments/ThreatAssessmentWizard'

export default async function EditAssessmentPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the existing draft assessment
  const { data: assessment, error } = await supabase
    .from('Threat Assessments_duplicate')
    .select('*')
    .eq('LR_Threat_Asses_ID', params.id)
    .single()

  if (error || !assessment) {
    notFound()
  }

  // Fetch existing crop and landrace names from drafts
  const { data: assessments } = await supabase
    .from('Threat Assessments_duplicate')
    .select('Crop, LR_Name')

  const existingCrops = [...new Set(assessments?.map(a => a.Crop).filter(Boolean) || [])]
  const existingLandraces = [...new Set(assessments?.map(a => a.LR_Name).filter(Boolean) || [])]

  // Fetch all taxa for optional taxonomy linking
  const { data: taxa } = await supabase
    .from('Taxa')
    .select('*')
    .order('crop_group')
    .order('primary_crop_type')

  // Fetch existing assignments (reviewer and co-assessor)
  const { data: assignments } = await supabase
    .from('assessment_assignments')
    .select('user_id, role')
    .eq('assessment_id', params.id)

  const reviewer = assignments?.find(a => a.role === 'reviewer')
  const coAssessor = assignments?.find(a => a.role === 'co-assessor')

  // Fetch taxa link if exists
  const { data: taxaLink } = await supabase
    .from('assessment_taxa')
    .select('taxa_id')
    .eq('assessment_id', params.id)
    .single()

  // Fetch comments for this assessment
  const { data: comments } = await supabase
    .from('assessment_comments')
    .select(`
      *,
      profiles:user_id (
        first_name,
        last_name,
        email
      )
    `)
    .eq('assessment_id', params.id)
    .order('created_at', { ascending: true })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Threat Assessment</h1>
        <p className="text-gray-600 mt-1">Assessment ID: {params.id}</p>
      </div>

      <ThreatAssessmentWizard 
        existingCrops={existingCrops}
        existingLandraces={existingLandraces}
        taxa={taxa || []} 
        userId={user?.id || ''}
        existingAssessment={assessment}
        existingReviewerId={reviewer?.user_id}
        existingCoAssessorId={coAssessor?.user_id}
        existingTaxaId={taxaLink?.taxa_id}
        isEditMode={true}
        existingComments={comments || []}
      />
    </div>
  )
}
