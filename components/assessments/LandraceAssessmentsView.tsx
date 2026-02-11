'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface LandraceAssessmentsViewProps {
  initialAssessments: any[]
  userId: string
  showActions?: boolean // Whether to show edit/delete/review buttons
}

export default function LandraceAssessmentsView({
  initialAssessments,
  userId,
  showActions = true, // Default to true for backward compatibility
}: LandraceAssessmentsViewProps) {
  const [assessments, setAssessments] = useState(initialAssessments)
  const [searchQuery, setSearchQuery] = useState('')
  const [cropFilter, setCropFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const matchesSearch =
        searchQuery === '' ||
        assessment.LR_Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.Crop?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.LR_Threat_Assessor?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCrop =
        cropFilter === 'all' || assessment.Crop === cropFilter

      const matchesCategory =
        categoryFilter === 'all' || assessment.Threat_Category === categoryFilter

      return matchesSearch && matchesCrop && matchesCategory
    })
  }, [assessments, searchQuery, cropFilter, categoryFilter])

  // Get unique values for filters
  const uniqueCrops = useMemo(() => {
    return [...new Set(assessments.map((a) => a.Crop).filter(Boolean))]
  }, [assessments])

  const uniqueCategories = useMemo(() => {
    return [...new Set(assessments.map((a) => a.Threat_Category).filter(Boolean))]
  }, [assessments])

  const getCategoryColor = (category: string) => {
    if (!category) return 'bg-gray-100 text-gray-800'
    const lower = category.toLowerCase()
    if (lower.includes('high') || lower.includes('critical')) return 'bg-red-100 text-red-800'
    if (lower.includes('medium') || lower.includes('moderate')) return 'bg-yellow-100 text-yellow-800'
    if (lower.includes('low')) return 'bg-green-100 text-green-800'
    return 'bg-blue-100 text-blue-800'
  }

  const handleEdit = (assessmentId: string) => {
    router.push(`/dashboard/assessments/edit/${assessmentId}`)
  }

  const handleReview = (assessmentId: string) => {
    router.push(`/dashboard/assessments/edit/${assessmentId}`)
  }

  const handleDelete = async (assessmentId: string) => {
    if (deleteConfirm !== assessmentId) {
      setDeleteConfirm(assessmentId)
      return
    }

    try {
      // Delete from assessment_assignments
      await supabase
        .from('assessment_assignments')
        .delete()
        .eq('assessment_id', assessmentId)

      // Delete from assessment_taxa if exists
      await supabase
        .from('assessment_taxa')
        .delete()
        .eq('assessment_id', assessmentId)

      // Delete from notifications if exists
      await supabase
        .from('notifications')
        .delete()
        .like('message', `%${assessmentId}%`)

      // Delete the assessment itself
      const { error } = await supabase
        .from('Threat Assessments')
        .delete()
        .eq('LR_Threat_Asses_ID', assessmentId)

      if (error) throw error

      // Update local state
      setAssessments(assessments.filter(a => a.LR_Threat_Asses_ID !== assessmentId))
      setDeleteConfirm(null)
      
      // Refresh the page to get updated data
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting assessment:', error)
      alert(`Failed to delete assessment: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SEARCH
            </label>
            <input
              type="text"
              placeholder="Search by landrace name, crop, assessor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CROP TYPE
            </label>
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">All</option>
              {uniqueCrops.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              THREAT CATEGORY
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">All</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assessments Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Landrace Threat Assessments ({filteredAssessments.length})
          </h2>
          <button
            onClick={() => window.open('https://www.frontiersin.org/files/Articles/1336876/fpls-15-1336876-HTML/image_m/fpls-15-1336876-t001.jpg', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            Click here for subcriteria information
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Assessment ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-32 bg-gray-50 z-10">
                  Landrace Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crop
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assess Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reviewer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review Date
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-red-50" colSpan={9}>
                  Criterion A
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50" colSpan={4}>
                  Criterion B
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50" colSpan={4}>
                  Criterion C
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50" colSpan={7}>
                  Criterion D
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Threat Scores
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk %
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                {showActions && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                )}
                {showActions && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                )}
                {showActions && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase sticky left-0 bg-gray-50 z-10"></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase sticky left-32 bg-gray-50 z-10"></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase"></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase"></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase"></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase"></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase"></th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-red-50">A1.1</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-red-50">A1.2</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-red-50">A1.3</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-red-50">A2.1</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-red-50">A2.2</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-red-50">A2.3</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-red-50">A2.4</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-red-50">A3.1</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-red-50">A3.2</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-blue-50">B1.1</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-blue-50">B1.2</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-blue-50">B1.3</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-blue-50">B1.4</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-green-50">C1.1</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-green-50">C1.2</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-green-50">C1.3</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-green-50">C2.1</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-yellow-50">D1.1</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-yellow-50">D1.2</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-yellow-50">D1.3</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-yellow-50">D2.1</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-yellow-50">D2.2</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-yellow-50">D3.1</th>
                <th className="px-2 py-2 text-center text-xs text-gray-400 bg-yellow-50">D3.2</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase"></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase"></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase"></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase"></th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAssessments.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs sticky left-0 bg-white">
                    {assessment.LR_Threat_Asses_ID || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium sticky left-32 bg-white">
                    {assessment.LR_Name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {assessment.Crop || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {assessment.LR_Threat_Assessor || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {assessment.Assess_Date || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {assessment.LR_Threat_Reviewer || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {assessment.Review_Date || '-'}
                  </td>
                  {/* Criterion A scores */}
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-red-50">
                    {assessment['Subcriteria_Scores_A1.1'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-red-50">
                    {assessment['Subcriteria_Scores_A1.2'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-red-50">
                    {assessment['Subcriteria_Scores_A1.3'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-red-50">
                    {assessment['Subcriteria_Scores_A2.1'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-red-50">
                    {assessment['Subcriteria_Scores_A2.2'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-red-50">
                    {assessment['Subcriteria_Scores_A2.3'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-red-50">
                    {assessment['Subcriteria_Scores_A2.4'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-red-50">
                    {assessment['Subcriteria_Scores_A3.1'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-red-50">
                    {assessment['Subcriteria_Scores_A3.2'] || '-'}
                  </td>
                  {/* Criterion B scores */}
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-blue-50">
                    {assessment['Subcriteria_Scores_B1.1'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-blue-50">
                    {assessment['Subcriteria_Scores_B1.2'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-blue-50">
                    {assessment['Subcriteria_Scores_B1.3'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-blue-50">
                    {assessment['Subcriteria_Scores_B1.4'] || '-'}
                  </td>
                  {/* Criterion C scores */}
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-green-50">
                    {assessment['Subcriteria_Scores_C1.1'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-green-50">
                    {assessment['Subcriteria_Scores_C1.2'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-green-50">
                    {assessment['Subcriteria_Scores_C1.3'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-green-50">
                    {assessment['Subcriteria_Scores_C2.1'] || '-'}
                  </td>
                  {/* Criterion D scores */}
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-yellow-50">
                    {assessment['Subcriteria_Scores_D1.1'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-yellow-50">
                    {assessment['Subcriteria_Scores_D1.2'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-yellow-50">
                    {assessment['Subcriteria_Scores_D1.3'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-yellow-50">
                    {assessment['Subcriteria_Scores_D2.1'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-yellow-50">
                    {assessment['Subcriteria_Scores_D2.2'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-yellow-50">
                    {assessment['Subcriteria_Scores_D3.1'] || '-'}
                  </td>
                  <td className="px-2 py-3 text-sm text-center text-gray-700 bg-yellow-50">
                    {assessment['Subcriteria_Scores_D3.2'] || '-'}
                  </td>
                  {/* Summary scores */}
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                    {assessment.Threat_Scores || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {assessment.Threat_Max_Score || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                    {assessment['Threat_Risk_%'] || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(assessment.Threat_Category)}`}>
                      {assessment.Threat_Category || 'N/A'}
                    </span>
                  </td>
                  {showActions && (
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
                  )}
                  {showActions && (
                    <td className="px-4 py-3 text-sm text-center">
                      {assessment.commentCount > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {assessment.commentCount}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  {showActions && (
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        {assessment.userRole === 'reviewer' ? (
                          <button
                            onClick={() => handleReview(assessment.LR_Threat_Asses_ID)}
                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-medium transition-colors"
                            title="Review assessment"
                          >
                            Review
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(assessment.LR_Threat_Asses_ID)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium transition-colors"
                              title="Edit assessment"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(assessment.LR_Threat_Asses_ID)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                deleteConfirm === assessment.LR_Threat_Asses_ID
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                              title={deleteConfirm === assessment.LR_Threat_Asses_ID ? 'Click again to confirm' : 'Delete assessment'}
                            >
                              {deleteConfirm === assessment.LR_Threat_Asses_ID ? 'Confirm?' : 'Delete'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
