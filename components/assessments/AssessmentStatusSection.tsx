'use client'

import { useState } from 'react'
import { AssessmentStatus } from '@/lib/types/database.types'
import AssessmentRow from './AssessmentRow'

interface AssessmentStatusSectionProps {
  status: AssessmentStatus
  label: string
  color: string
  assessments: any[]
  projectUsers: any[]
  onUpdate: (assessment: any) => void
}

export default function AssessmentStatusSection({
  status,
  label,
  color,
  assessments,
  projectUsers,
  onUpdate,
}: AssessmentStatusSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className={`w-1 h-8 ${color} rounded`}></div>
          <span className="font-semibold text-gray-900">
            {label} ({assessments.length})
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && assessments.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Common Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scientific Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxonomy
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assessments.map((assessment) => (
                  <AssessmentRow
                    key={assessment.id}
                    assessment={assessment}
                    projectUsers={projectUsers}
                    onUpdate={onUpdate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
