'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface CreateWorkingSetFormProps {
  userId: string
}

export default function CreateWorkingSetForm({ userId }: CreateWorkingSetFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Working set name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create the working set
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: formData.name,
          description: formData.description,
          created_by: userId,
        })
        .select()
        .single()

      if (projectError) throw projectError

      // Add creator as assessor
      const { error: memberError } = await supabase
        .from('project_users')
        .insert({
          project_id: project.id,
          user_id: userId,
          role: 'assessor',
        })

      if (memberError) throw memberError

      router.push(`/dashboard/working-sets/${project.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create working set')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Working Set</h2>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Working Set Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., Ethiopian Wheat Landraces 2024"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              rows={4}
              placeholder="Describe the purpose of this working set..."
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Working Sets</strong> allow you to group multiple threat assessments together
              and collaborate with team members. You can invite other users and assign roles after creation.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Working Set'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
