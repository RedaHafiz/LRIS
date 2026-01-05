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
  first_name: string
  last_name: string
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
  const [assessmentType, setAssessmentType] = useState('Red List Assessment')
  const [locale, setLocale] = useState('Global')
  const [description, setDescription] = useState('')

  // Step 2 fields
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([])

  const handleSearchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10)

    setSearchResults(data || [])
  }

  const handleAddUser = (user: any) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([
        ...selectedUsers,
        { ...user, role: 'edit_assessments' as const },
      ])
    }
    setSearchQuery('')
    setSearchResults([])
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId))
  }

  const handleRoleChange = (userId: string, role: any) => {
    setSelectedUsers(
      selectedUsers.map((u) => (u.id === userId ? { ...u, role } : u))
    )
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

      // Add selected users
      if (selectedUsers.length > 0) {
        const userInserts = selectedUsers.map((u) => ({
          project_id: project.id,
          user_id: u.id,
          role: u.role,
        }))

        await supabase.from('project_users').insert(userInserts)

        // Create notifications for added users
        const notifications = selectedUsers.map((u) => ({
          user_id: u.id,
          message: `You've been added to project: ${projectName}`,
          type: 'project_invitation',
        }))

        await supabase.from('notifications').insert(notifications)
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
                <span className="font-medium text-gray-900">Add users</span>
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
                    Type of assessment
                  </label>
                  <select
                    value={assessmentType}
                    onChange={(e) => setAssessmentType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Red List Assessment</option>
                    <option>Species Status Assessment</option>
                    <option>Threat Assessment</option>
                    <option>Conservation Assessment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Locale
                  </label>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Global</option>
                    <option>Regional</option>
                    <option>National</option>
                    <option>Local</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="You can add a short description to help assessors understand the scope and requirements of this working set specifically."
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
                    SEARCH FOR USERS
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        handleSearchUsers(e.target.value)
                      }}
                      placeholder="Search by first name, last name or email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleAddUser(user)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50"
                          >
                            {user.first_name} {user.last_name} ({user.email})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedUsers.length > 0 && (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            User
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Permissions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedUsers.map((user) => (
                          <tr key={user.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-900">
                                  {user.first_name} {user.last_name}
                                </span>
                                <button
                                  onClick={() => handleRemoveUser(user.id)}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={user.role}
                                onChange={(e) =>
                                  handleRoleChange(user.id, e.target.value)
                                }
                                className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="working_set_admin">
                                  Working set admin
                                </option>
                                <option value="edit_assessments">
                                  Edit assessments
                                </option>
                                <option value="comment_only">
                                  Comment only
                                </option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Back
            </button>
          )}
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!projectName}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: add users
            </button>
          ) : (
            <button
              onClick={handleCreateProject}
              disabled={loading}
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
