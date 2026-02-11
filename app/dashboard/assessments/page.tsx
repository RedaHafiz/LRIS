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

  // Fetch all threat assessments from database
  const { data: assessments } = await supabase
    .from('Threat Assessments')
    .select('*')
    .order('Assess_Date', { ascending: false })

  // No need to enrich with user roles or comments for public database
  // These are approved assessments accessible to everyone

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Threat Assessment Database</h1>
          <p className="text-gray-600 mt-1">
            Browse approved threat assessments
          </p>
        </div>
      </div>
      <LandraceAssessmentsView
        initialAssessments={assessments || []}
        userId={user.id}
        showActions={false}
      />
    </div>
  )
}
