import { createClient } from '@/lib/supabase/server'
import LandraceAssessmentsView from '@/components/assessments/LandraceAssessmentsView'
import Link from 'next/link'

export default async function AssessmentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch all assessments (landrace threat assessments)
  const { data: assessments } = await supabase
    .from('Threat Assessments')
    .select('*')
    .order('Assess_Date', { ascending: false })

  // Get unique assessors and reviewers for filtering
  const projectUsers: any[] = []

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
        initialAssessments={assessments || []}
      />
    </div>
  )
}
