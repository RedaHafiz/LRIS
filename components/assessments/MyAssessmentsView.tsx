'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface MyAssessmentsViewProps {
  initialAssessments: any[]
  workingSets: any[]
  userId: string
}

export default function MyAssessmentsView({
  initialAssessments,
  workingSets: initialWorkingSets,
  userId,
}: MyAssessmentsViewProps) {
  const [activeTab, setActiveTab] = useState<'assessments' | 'working-sets'>('assessments')
  const [assessments, setAssessments] = useState(initialAssessments)
  const [workingSets, setWorkingSets] = useState(initialWorkingSets)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWorkingSetName, setNewWorkingSetName] = useState('')
  const [newWorkingSetDescription, setNewWorkingSetDescription] = useState('')
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

  const handleCreateWorkingSet = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newWorkingSetName,
          description: newWorkingSetDescription,
          owner_id: userId,
        })
        .select()
        .single()

      if (error) throw error

      setWorkingSets([data, ...workingSets])
      setShowCreateModal(false)
      setNewWorkingSetName('')
      setNewWorkingSetDescription('')
      router.refresh()
    } catch (error: any) {
      console.error('Error creating working set:', error)
      alert(`Failed to create working set: ${error.message}`)
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('assessments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assessments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Assessments ({assessments.length})
          </button>
          <button
            onClick={() => setActiveTab('working-sets')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'working-sets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Working Sets ({workingSets.length})
          </button>
        </nav>
      </div>

      {/* Assessments Tab */}
      {activeTab === 'assessments' && (
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
      )}

      {/* Working Sets Tab */}
      {activeTab === 'working-sets' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600">Organize assessments into working sets</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              + Create Working Set
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workingSets.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500">
                No working sets yet. Create one to organize your assessments.
              </div>
            ) : (
              workingSets.map((workingSet) => (
                <Link
                  key={workingSet.id}
                  href={`/dashboard/projects/${workingSet.id}`}
                  className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{workingSet.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{workingSet.description || 'No description'}</p>
                  <p className="text-xs text-gray-400 mt-4">
                    Created {new Date(workingSet.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Working Set Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Working Set</h3>
            <form onSubmit={handleCreateWorkingSet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newWorkingSetName}
                  onChange={(e) => setNewWorkingSetName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="e.g., Mediterranean Wheat Study"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newWorkingSetDescription}
                  onChange={(e) => setNewWorkingSetDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  rows={3}
                  placeholder="Describe the purpose of this working set..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewWorkingSetName('')
                    setNewWorkingSetDescription('')
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
