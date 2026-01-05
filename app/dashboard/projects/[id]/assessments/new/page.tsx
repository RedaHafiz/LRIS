import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewAssessmentForm from '@/components/assessments/NewAssessmentForm'

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

  // Fetch all taxa for selection
  const { data: taxa } = await supabase
    .from('Taxa')
    .select('*')
    .order('kingdom')
    .order('phylum')
    .order('class')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">New Threat Assessment</h1>
        <p className="text-gray-600 mt-1">
          Create a new threat assessment for {project.name}
        </p>
      </div>

      <NewAssessmentForm projectId={id} taxa={taxa || []} userId={user?.id || ''} />
    </div>
  )
}
