import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MyAssessmentsView from '@/components/assessments/MyAssessmentsView'

export default async function MyAssessmentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's assignments to know their role in each assessment
  const { data: userAssignments } = await supabase
    .from('assessment_assignments')
    .select('assessment_id, role')
    .eq('user_id', user.id)

  // Get assessment IDs where user has a role
  const assignedAssessmentIds = userAssignments?.map(a => a.assessment_id) || []

  // Fetch only draft assessments where user has a role (assessor, co-assessor, or reviewer)
  let assessments = []
  if (assignedAssessmentIds.length > 0) {
    const { data } = await supabase
      .from('Threat Assessments_duplicate')
      .select('*')
      .in('LR_Threat_Asses_ID', assignedAssessmentIds)
      .order('Assess_Date', { ascending: false })
    assessments = data || []
  }

  // Enrich assessments with user role and comment counts
  const enrichedAssessments = await Promise.all(assessments.map(async (assessment) => {
    const userRole = userAssignments?.find(a => a.assessment_id === assessment.LR_Threat_Asses_ID)?.role
    
    // Get comment count
    const { count } = await supabase
      .from('assessment_comments')
      .select('*', { count: 'exact', head: true })
      .eq('assessment_id', assessment.LR_Threat_Asses_ID)
    
    return {
      ...assessment,
      userRole,
      commentCount: count || 0
    }
  }))

  // Fetch user's working sets
  const { data: workingSets } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Assessments</h1>
        <p className="text-gray-600 mt-1">
          Manage your threat assessments and working sets
        </p>
      </div>

      <MyAssessmentsView
        initialAssessments={enrichedAssessments}
        workingSets={workingSets || []}
        userId={user.id}
      />
    </div>
  )
}
