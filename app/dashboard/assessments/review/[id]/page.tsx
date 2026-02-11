import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AssessmentReviewView from '@/components/assessments/AssessmentReviewView'

export default async function ReviewAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the draft assessment
  const { data: assessment, error: assessmentError } = await supabase
    .from('Threat Assessments_duplicate')
    .select('*')
    .eq('LR_Threat_Asses_ID', id)
    .maybeSingle()

  if (assessmentError) {
    console.error('Error fetching assessment:', assessmentError)
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Error loading assessment</p>
          <p className="text-sm mt-1">{assessmentError.message}</p>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p className="font-semibold">Assessment not found</p>
          <p className="text-sm mt-1">Could not find draft with ID: {id}</p>
          <p className="text-sm mt-2">This draft may have been deleted or already approved.</p>
        </div>
      </div>
    )
  }

  // Verify user is reviewer for this assessment (user may have multiple roles)
  const { data: userAssignments } = await supabase
    .from('assessment_assignments')
    .select('role')
    .eq('assessment_id', id)
    .eq('user_id', user.id)

  const hasReviewerRole = userAssignments?.some(a => a.role === 'reviewer')
  const userRoles = userAssignments?.map(a => a.role).join(', ') || 'None'

  if (!hasReviewerRole) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">You do not have permission to review this assessment.</p>
          <p className="text-sm mt-2">Your role(s): {userRoles}</p>
          <p className="text-sm">Required role: reviewer</p>
        </div>
      </div>
    )
  }

  // Fetch all comments for this assessment
  const { data: comments } = await supabase
    .from('assessment_comments')
    .select(`
      *,
      profiles:user_id (
        first_name,
        last_name,
        email,
        avatar_url
      )
    `)
    .eq('assessment_id', id)
    .order('created_at', { ascending: true })

  // Fetch assessor and co-assessor info
  const { data: assignments } = await supabase
    .from('assessment_assignments')
    .select(`
      role,
      profiles:user_id (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('assessment_id', id)
    .in('role', ['assessor', 'co-assessor'])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Review Assessment</h1>
        <p className="text-gray-600 mt-1">Assessment ID: {id}</p>
      </div>

      <AssessmentReviewView
        assessment={assessment}
        comments={comments || []}
        assignments={assignments || []}
        userId={user.id}
        assessmentId={id}
      />
    </div>
  )
}
