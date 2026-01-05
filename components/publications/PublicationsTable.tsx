'use client'

import { useState } from 'react'
import PublicationRow from './PublicationRow'

interface Publication {
  id: string
  title: string
  authors: string
  journal: string
  year: number
  doi: string
  url: string
  abstract: string
  added_by: string
  created_at: string
  profiles: {
    name: string
    email: string
  }
}

interface PublicationsTableProps {
  publications: Publication[]
  currentUserId: string
}

export default function PublicationsTable({ publications, currentUserId }: PublicationsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (publications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
        <p className="text-gray-500 mb-4">No publications yet</p>
        <p className="text-sm text-gray-400">Add your first publication to get started</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Authors
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Journal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Added By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {publications.map((publication) => (
              <PublicationRow
                key={publication.id}
                publication={publication}
                currentUserId={currentUserId}
                isExpanded={expandedId === publication.id}
                onToggleExpand={() => setExpandedId(expandedId === publication.id ? null : publication.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
