'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Taxa {
  id: string
  kingdom: string
  phylum: string
  class: string
  spp_count: number
}

interface NewAssessmentFormProps {
  projectId: string
  taxa: Taxa[]
  userId: string
}

export default function NewAssessmentForm({
  projectId,
  taxa,
  userId,
}: NewAssessmentFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    common_name: '',
    scientific_name: '',
    type_of_assessment: '',
    taxa_id: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Filtered taxa list
  const sortedTaxa = useMemo(() => {
    return taxa.sort((a, b) => {
      const nameA = a.english_common_name || a.genus || ''
      const nameB = b.english_common_name || b.genus || ''
      return nameA.localeCompare(nameB)
    })
  }, [taxa])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Create the assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('Threat Assessments')
        .insert({
          project_id: projectId,
          common_name: formData.common_name || null,
          scientific_name: formData.scientific_name || null,
          type_of_assessment: formData.type_of_assessment || null,
          created_by: userId,
          status: 'not_started',
          progress: 0,
        })
        .select()
        .single()

      if (assessmentError) throw assessmentError

      // Link taxa if selected
      if (formData.taxa_id) {
        const { error: taxaError } = await supabase
          .from('assessment_taxa')
          .insert({
            assessment_id: assessment.id,
            taxa_id: formData.taxa_id,
          })

        if (taxaError) throw taxaError
      }

      // Redirect back to project page
      router.push(`/dashboard/projects/${projectId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create assessment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-gray-200 p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Common Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Common Name
          </label>
          <input
            type="text"
            value={formData.common_name}
            onChange={(e) => setFormData({ ...formData, common_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="e.g., African Elephant"
          />
        </div>

        {/* Scientific Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scientific Name
          </label>
          <input
            type="text"
            value={formData.scientific_name}
            onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="e.g., Loxodonta africana"
          />
        </div>

        {/* Taxonomic Classification (Optional) */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Link to Crop Taxonomy (Optional)
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Crop Taxonomy
            </label>
            <select
              value={formData.taxa_id}
              onChange={(e) => setFormData({ ...formData, taxa_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">None (Optional)</option>
              {sortedTaxa.map((taxon) => (
                <option key={taxon.id} value={taxon.id}>
                  {taxon.english_common_name || taxon.genus} - {taxon.genus} {taxon.species}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type of Assessment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type of Assessment
          </label>
          <input
            type="text"
            value={formData.type_of_assessment}
            onChange={(e) => setFormData({ ...formData, type_of_assessment: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="e.g., Full Assessment, Rapid Assessment"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.taxa_id}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Assessment'}
          </button>
        </div>
      </form>
    </div>
  )
}
