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
        .from('Threat Assessments')
        .delete()
        .eq('id', assessmentId)

      if (error) throw error

      // Remove from local state
      setAssessments(assessments.filter(a => a.id !== assessmentId))
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
            href={`/dashboard/assessments/${assessment.id}`}
            className="block p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {assessment.common_name || assessment.scientific_name || 'Untitled Assessment'}
                </h3>
                {assessment.scientific_name && assessment.common_name && (
                  <p className="text-sm text-gray-600 italic mt-1">
                    {assessment.scientific_name}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Updated {new Date(assessment.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    assessment.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : assessment.status === 'submitted'
                      ? 'bg-green-100 text-green-800'
                      : assessment.status === 'to_review'
                      ? 'bg-yellow-100 text-yellow-800'
                      : assessment.status === 'returned_with_comments'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {assessment.status.replace(/_/g, ' ')}
                </span>
                <button
                  onClick={(e) => handleDelete(e, assessment.id)}
                  disabled={deleting === assessment.id}
                  className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed p-2"
                  title="Delete assessment"
                >
                  {deleting === assessment.id ? (
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
