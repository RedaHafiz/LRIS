'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SelectedUser {
  id: string
  email: string
  name: string
  role: 'working_set_admin' | 'edit_assessments' | 'comment_only'
}

export default function CreateProjectModal({
  isOpen,
  onClose,
}: CreateProjectModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Step 1 fields
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')

  // Step 2 fields - Assessments
  const [availableAssessments, setAvailableAssessments] = useState<any[]>([])
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([])
  const [assessmentsLoaded, setAssessmentsLoaded] = useState(false)

  const loadAvailableAssessments = async () => {
    if (assessmentsLoaded) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('Threat Assessments')
      .select('*')
      .or(`created_by.eq.${user.id},assignee_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    setAvailableAssessments(data || [])
    setAssessmentsLoaded(true)
  }

  const toggleAssessmentSelection = (assessmentId: string) => {
    if (selectedAssessments.includes(assessmentId)) {
      setSelectedAssessments(selectedAssessments.filter(id => id !== assessmentId))
    } else {
      setSelectedAssessments([...selectedAssessments, assessmentId])
    }
  }


  const handleCreateProject = async () => {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          description: description,
          created_by: user.id,
        })
        .select()
        .single()

      if (projectError) throw projectError

      // Add creator as admin
      await supabase.from('project_users').insert({
        project_id: project.id,
        user_id: user.id,
        role: 'working_set_admin',
      })

      // Link selected assessments to project
      if (selectedAssessments.length > 0) {
        await supabase
          .from('Threat Assessments')
          .update({ project_id: project.id })
          .in('id', selectedAssessments)
      }

      router.push(`/dashboard/projects/${project.id}`)
      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Create a new working set
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 p-6 border-r border-gray-200">
            <div className="space-y-2">
              <div
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  step === 1 ? 'bg-blue-50' : ''
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step > 1
                      ? 'bg-green-500 text-white'
                      : step === 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step > 1 ? '✓' : '1'}
                </div>
                <span className="font-medium text-gray-900">
                  Basic information
                </span>
              </div>
              <div
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  step === 2 ? 'bg-blue-50' : ''
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step === 2
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  2
                </div>
                <span className="font-medium text-gray-900">Select assessments</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name your working set
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Indonesian Rattan"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description for this working set to help organize your assessments."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SELECT THREAT ASSESSMENTS
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose existing threat assessments to include in this working set.
                  </p>
                  {!assessmentsLoaded && (
                    <button
                      onClick={loadAvailableAssessments}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Load available assessments
                    </button>
                  )}
                  {assessmentsLoaded && availableAssessments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No assessments available. You can add assessments later.</p>
                    </div>
                  )}
                  {assessmentsLoaded && availableAssessments.length > 0 && (
                    <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                      {availableAssessments.map((assessment) => (
                        <label
                          key={assessment.id}
                          className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAssessments.includes(assessment.id)}
                            onChange={() => toggleAssessmentSelection(assessment.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {assessment.common_name || assessment.scientific_name || 'Untitled Assessment'}
                            </p>
                            {assessment.scientific_name && assessment.common_name && (
                              <p className="text-xs text-gray-600 italic">
                                {assessment.scientific_name}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Status: {assessment.status?.replace(/_/g, ' ') || 'Unknown'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  {selectedAssessments.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedAssessments.length} assessment{selectedAssessments.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Back
            </button>
          )}
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              disabled={!projectName}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: select assessments
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleCreateProject}
              disabled={loading || selectedAssessments.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create working set'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
