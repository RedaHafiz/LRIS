'use client'

import { useState, useMemo } from 'react'
import { AssessmentStatus } from '@/lib/types/database.types'
import AssessmentStatusSection from './AssessmentStatusSection'

const statusConfig: Record<
  AssessmentStatus,
  { label: string; color: string }
> = {
  not_started: { label: 'NOT STARTED', color: 'bg-orange-400' },
  in_progress: { label: 'IN PROGRESS', color: 'bg-orange-400' },
  to_review: { label: 'TO REVIEW', color: 'bg-orange-400' },
  to_submit: { label: 'TO SUBMIT', color: 'bg-orange-400' },
  returned_with_comments: {
    label: 'RETURNED WITH COMMENTS',
    color: 'bg-blue-500',
  },
  submitted: { label: 'SUBMITTED', color: 'bg-green-500' },
  to_publish: { label: 'TO PUBLISH', color: 'bg-green-500' },
  published: { label: 'PUBLISHED', color: 'bg-green-500' },
}

interface AssessmentsViewProps {
  initialAssessments: any[]
  projectUsers: any[]
}

export default function AssessmentsView({
  initialAssessments,
  projectUsers,
}: AssessmentsViewProps) {
  const [assessments, setAssessments] = useState(initialAssessments)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [taxaFilter, setTaxaFilter] = useState<string>('all')

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const taxa = assessment.assessment_taxa?.[0]?.taxa
      const matchesSearch =
        searchQuery === '' ||
        assessment.common_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        assessment.scientific_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        assessment.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        taxa?.kingdom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        taxa?.phylum?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        taxa?.class?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || assessment.status === statusFilter

      const matchesAssignee =
        assigneeFilter === 'all' || assessment.assignee_id === assigneeFilter

      const matchesType =
        typeFilter === 'all' || assessment.type_of_assessment === typeFilter

      const matchesTaxa =
        taxaFilter === 'all' ||
        assessment.assessment_taxa?.[0]?.taxa?.class === taxaFilter

      return matchesSearch && matchesStatus && matchesAssignee && matchesType && matchesTaxa
    })
  }, [assessments, searchQuery, statusFilter, assigneeFilter, typeFilter])

  // Group assessments by status
  const groupedAssessments = useMemo(() => {
    const groups: Record<AssessmentStatus, any[]> = {
      not_started: [],
      in_progress: [],
      to_review: [],
      to_submit: [],
      returned_with_comments: [],
      submitted: [],
      to_publish: [],
      published: [],
    }

    filteredAssessments.forEach((assessment) => {
      if (groups[assessment.status as AssessmentStatus]) {
        groups[assessment.status as AssessmentStatus].push(assessment)
      }
    })

    return groups
  }, [filteredAssessments])

  // Get unique values for filters
  const uniqueAssignees = useMemo(() => {
    const assignees = new Map()
    assessments.forEach((a) => {
      if (a.assignee_id && a.profiles) {
        assignees.set(a.assignee_id, a.profiles)
      }
    })
    return Array.from(assignees.entries())
  }, [assessments])

  const uniqueTypes = useMemo(() => {
    return [...new Set(assessments.map((a) => a.type_of_assessment).filter(Boolean))]
  }, [assessments])

  const uniqueTaxaClasses = useMemo(() => {
    const classes = assessments
      .map((a) => a.assessment_taxa?.[0]?.taxa)
      .filter(Boolean)
    return [...new Map(classes.map((t) => [t.class, t])).values()]
  }, [assessments])

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SEARCH PROJECT
            </label>
            <input
              type="text"
              placeholder="Search by name, taxonomy (kingdom/phylum/class), or status"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              STATUS
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              {Object.entries(statusConfig).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ASSIGNEE
            </label>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              {uniqueAssignees.map(([id, profile]) => (
                <option key={id} value={id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TYPE OF ASSESSMENT
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TAXONOMIC CLASS
            </label>
            <select
              value={taxaFilter}
              onChange={(e) => setTaxaFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              {uniqueTaxaClasses.map((taxa) => (
                <option key={taxa.id} value={taxa.class}>
                  {taxa.class}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Status Sections */}
      <div className="space-y-2">
        {(Object.entries(statusConfig) as [AssessmentStatus, typeof statusConfig[AssessmentStatus]][]).map(
          ([status, config]) => (
            <AssessmentStatusSection
              key={status}
              status={status}
              label={config.label}
              color={config.color}
              assessments={groupedAssessments[status]}
              projectUsers={projectUsers}
              onUpdate={(updatedAssessment) => {
                setAssessments((prev) =>
                  prev.map((a) =>
                    a.id === updatedAssessment.id ? updatedAssessment : a
                  )
                )
              }}
            />
          )
        )}
      </div>
    </div>
  )
}
