import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AssessmentReviewView from '@/components/assessments/AssessmentReviewView'

export default async function ReviewAssessmentPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the draft assessment
  const { data: assessment, error } = await supabase
    .from('Threat Assessments_duplicate')
    .select('*')
    .eq('LR_Threat_Asses_ID', params.id)
    .single()

  if (error || !assessment) {
    notFound()
  }

  // Verify user is reviewer for this assessment
  const { data: assignment } = await supabase
    .from('assessment_assignments')
    .select('role')
    .eq('assessment_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!assignment || assignment.role !== 'reviewer') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          You do not have permission to review this assessment.
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
    .eq('assessment_id', params.id)
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
    .eq('assessment_id', params.id)
    .in('role', ['assessor', 'co-assessor'])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Review Assessment</h1>
        <p className="text-gray-600 mt-1">Assessment ID: {params.id}</p>
      </div>

      <AssessmentReviewView
        assessment={assessment}
        comments={comments || []}
        assignments={assignments || []}
        userId={user.id}
        assessmentId={params.id}
      />
    </div>
  )
}
