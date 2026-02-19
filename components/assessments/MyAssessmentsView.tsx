'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface MyAssessmentsViewProps {
  initialAssessments: any[]
  userId: string
}

export default function MyAssessmentsView({
  initialAssessments,
  userId,
}: MyAssessmentsViewProps) {
  const [assessments, setAssessments] = useState(initialAssessments)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleReview = (assessmentId: string) => {
    router.push(`/dashboard/assessments/review/${assessmentId}`)
  }

  const handleEdit = (assessmentId: string) => {
    router.push(`/dashboard/assessments/edit/${assessmentId}`)
  }

  const handleDelete = async (assessmentId: string) => {
    if (deleteConfirm !== assessmentId) {
      setDeleteConfirm(assessmentId)
      return
    }

    try {
      // Delete cascading records
      await supabase.from('assessment_assignments').delete().eq('assessment_id', assessmentId)
      await supabase.from('assessment_taxa').delete().eq('assessment_id', assessmentId)
      await supabase.from('assessment_comments').delete().eq('assessment_id', assessmentId)
      
      const { error } = await supabase
        .from('Threat Assessments')
        .delete()
        .eq('LR_Threat_Asses_ID', assessmentId)

      if (error) throw error

      setAssessments(assessments.filter(a => a.LR_Threat_Asses_ID !== assessmentId))
      setDeleteConfirm(null)
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting assessment:', error)
      alert(`Failed to delete assessment: ${error.message}`)
    }
  }

  return (
    <div>
      {/* Assessments */}
        <div>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600">Assessments you've created or are assigned to</p>
            <Link
              href="/dashboard/assessments/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              + Create New Assessment
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Landrace</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assessments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No assessments yet. Create your first assessment to get started.
                    </td>
                  </tr>
                ) : (
                  assessments.map((assessment) => (
                    <tr key={assessment.LR_Threat_Asses_ID} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{assessment.LR_Threat_Asses_ID}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{assessment.LR_Name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{assessment.Crop}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          assessment.userRole === 'assessor' ? 'bg-blue-100 text-blue-800' :
                          assessment.userRole === 'co-assessor' ? 'bg-green-100 text-green-800' :
                          assessment.userRole === 'reviewer' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {assessment.userRole || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          assessment.status === 'approved' ? 'bg-green-100 text-green-800' :
                          assessment.status === 'returned' ? 'bg-yellow-100 text-yellow-800' :
                          assessment.status === 'pending_review' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {assessment.status === 'approved' ? 'Approved' :
                           assessment.status === 'returned' ? 'Returned' :
                           assessment.status === 'pending_review' ? 'Pending Review' :
                           'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{assessment.Threat_Category}</td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        {assessment.userRole === 'reviewer' && (
                          <button
                            onClick={() => handleReview(assessment.LR_Threat_Asses_ID)}
                            className="text-purple-600 hover:text-purple-800 font-medium"
                          >
                            Review
                          </button>
                        )}
                        {(assessment.userRole === 'assessor' || assessment.userRole === 'co-assessor') && (
                          <>
                            <button
                              onClick={() => handleEdit(assessment.LR_Threat_Asses_ID)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(assessment.LR_Threat_Asses_ID)}
                              className={`font-medium ${
                                deleteConfirm === assessment.LR_Threat_Asses_ID
                                  ? 'text-red-600 hover:text-red-800'
                                  : 'text-gray-600 hover:text-gray-800'
                              }`}
                            >
                              {deleteConfirm === assessment.LR_Threat_Asses_ID ? 'Confirm?' : 'Delete'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  )
}
