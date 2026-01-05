'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface AssessmentRowProps {
  assessment: any
  projectUsers: any[]
  onUpdate: (assessment: any) => void
}

export default function AssessmentRow({
  assessment,
  projectUsers,
  onUpdate,
}: AssessmentRowProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClient()

  const handleAssigneeChange = async (newAssigneeId: string) => {
    setIsUpdating(true)
    try {
      const { data, error } = await supabase
        .from('Threat Assessments')
        .update({ assignee_id: newAssigneeId || null })
        .eq('id', assessment.id)
        .select(
          `
          *,
          profiles!assessments_assignee_id_fkey(name)
        `
        )
        .single()

      if (error) throw error

      // Create notification for the assigned user
      if (newAssigneeId) {
        await supabase.from('notifications').insert({
          user_id: newAssigneeId,
          message: `You've been assigned to assessment: ${
            assessment.common_name || assessment.scientific_name || 'Untitled'
          }`,
          type: 'assignment',
        })
      }

      onUpdate(data)
    } catch (error) {
      console.error('Error updating assignee:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Get users for this project
  const availableUsers = projectUsers
    .filter((pu) => pu.project_id === assessment.project_id)
    .map((pu) => pu.profiles)
    .filter(Boolean)

  // Get taxa information
  const taxa = assessment.assessment_taxa?.[0]?.taxa
  const taxonomyDisplay = taxa
    ? `${taxa.kingdom} / ${taxa.phylum} / ${taxa.class}`
    : '-'

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">
        <Link
          href={`/dashboard/assessments/${assessment.id}`}
          className="hover:text-blue-600 hover:underline"
        >
          {assessment.common_name || '-'}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 italic">
        {assessment.scientific_name || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        <span className="text-xs bg-gray-100 px-2 py-1 rounded" title={taxonomyDisplay}>
          {taxa ? taxa.class : '-'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {assessment.type_of_assessment || '-'}
      </td>
      <td className="px-4 py-3 text-sm">
        <select
          value={assessment.assignee_id || ''}
          onChange={(e) => handleAssigneeChange(e.target.value)}
          disabled={isUpdating}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">Unassigned</option>
              {availableUsers.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
        </select>
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${assessment.progress}%` }}
            ></div>
          </div>
          <span className="text-gray-600 text-xs">{assessment.progress}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        <Link
          href={`/dashboard/assessments/${assessment.id}`}
          className="text-blue-600 hover:text-blue-700 hover:underline"
        >
          View
        </Link>
      </td>
    </tr>
  )
}
