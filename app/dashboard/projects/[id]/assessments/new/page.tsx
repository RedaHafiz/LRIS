import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ThreatAssessmentWizard from '@/components/assessments/ThreatAssessmentWizard'

export default async function NewAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Verify user has access to this project
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_users!inner(role, user_id)
    `)
    .eq('id', id)
    .eq('project_users.user_id', user?.id)
    .single()

  if (error || !project) {
    redirect('/dashboard')
  }

  // Check if user has permission to create assessments
  const userRole = project.project_users[0]?.role
  if (userRole === 'reviewer') {
    redirect(`/dashboard/projects/${id}`)
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
        <h1 className="text-3xl font-bold text-gray-900">New Threat Assessment</h1>
        <p className="text-gray-600 mt-1">
          Create a new threat assessment for {project.name}
        </p>
      </div>

      <ThreatAssessmentWizard 
        existingCrops={existingCrops}
        existingLandraces={existingLandraces}
        taxa={taxa || []} 
        userId={user?.id || ''}
        projectId={id}
      />
    </div>
  )
}
