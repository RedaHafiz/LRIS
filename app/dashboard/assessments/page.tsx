import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandraceAssessmentsView from '@/components/assessments/LandraceAssessmentsView'
import Link from 'next/link'

export default async function AssessmentsPage() {
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

  // Fetch all assessments (landrace threat assessments)
  const { data: assessments } = await supabase
    .from('Threat Assessments')
    .select('*')
    .order('Assess_Date', { ascending: false })

  // Enrich assessments with user role and comment counts
  const enrichedAssessments = await Promise.all((assessments || []).map(async (assessment) => {
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

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Landrace Threat Assessments</h1>
          <p className="text-gray-600 mt-1">
            Browse and search landrace threat assessments
          </p>
        </div>
        <Link
          href="/dashboard/assessments/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Create New Assessment
        </Link>
      </div>
      <LandraceAssessmentsView
        initialAssessments={enrichedAssessments}
        userId={user.id}
      />
    </div>
  )
}
