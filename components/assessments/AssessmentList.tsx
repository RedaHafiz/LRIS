'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AssessmentListProps {
  initialAssessments: any[]
}

export default function AssessmentList({ initialAssessments }: AssessmentListProps) {
  const [assessments, setAssessments] = useState(initialAssessments)
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (e: React.MouseEvent, assessmentId: string) => {
    e.preventDefault() // Prevent link navigation
    e.stopPropagation()

    if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      return
    }

    setDeleting(assessmentId)
    try {
      const { error } = await supabase
        .from('Threat Assessments_duplicate')
        .delete()
        .eq('LR_Threat_Asses_ID', assessmentId)

      if (error) throw error

      // Remove from local state
      setAssessments(assessments.filter(a => a.LR_Threat_Asses_ID !== assessmentId))
      router.refresh()
    } catch (error: any) {
      alert('Failed to delete assessment: ' + error.message)
    } finally {
      setDeleting(null)
    }
  }

  if (assessments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No assessments yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {assessments.map((assessment: any) => (
        <div
          key={assessment.id}
          className="border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Link
            href={`/dashboard/assessments/edit/${assessment.LR_Threat_Asses_ID}`}
            className="block p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {assessment.LR_Name || 'Untitled Assessment'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Crop: {assessment.Crop || 'N/A'}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-gray-500">
                    ID: {assessment.LR_Threat_Asses_ID}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(assessment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    assessment.status === 'pending_review'
                      ? 'bg-blue-100 text-blue-800'
                      : assessment.status === 'returned'
                      ? 'bg-yellow-100 text-yellow-800'
                      : assessment.status === 'draft'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {assessment.status === 'pending_review' ? 'Pending Review' :
                   assessment.status === 'returned' ? 'Returned' :
                   assessment.status === 'draft' ? 'Draft' : 'Approved'}
                </span>
                <button
                  onClick={(e) => handleDelete(e, assessment.LR_Threat_Asses_ID)}
                  disabled={deleting === assessment.LR_Threat_Asses_ID}
                  className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed p-2"
                  title="Delete assessment"
                >
                  {deleting === assessment.LR_Threat_Asses_ID ? (
                    <span className="text-xs">Deleting...</span>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}
