'use client'

import { useState, useMemo } from 'react'

interface CropTaxon {
  id: string
  crop_group: string
  primary_crop_type: string
  primary_crop_subtype: string
  english_common_name: string
  family: string
  genus: string
  species: string
  authority: string
  notes: string
  source_1: string
  source_2: string
  source_3: string
}

interface CropTaxonomyViewProps {
  taxa: CropTaxon[]
}

export default function CropTaxonomyView({ taxa }: CropTaxonomyViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // Filter taxa by search
  const filteredTaxa = useMemo(() => {
    if (!searchQuery) return taxa
    const query = searchQuery.toLowerCase()
    return taxa.filter(
      (t) =>
        t.crop_group?.toLowerCase().includes(query) ||
        t.primary_crop_type?.toLowerCase().includes(query) ||
        t.english_common_name?.toLowerCase().includes(query) ||
        t.genus?.toLowerCase().includes(query) ||
        t.species?.toLowerCase().includes(query)
    )
  }, [taxa, searchQuery])

  // Group taxa hierarchically
  const hierarchy = useMemo(() => {
    const grouped: Record<string, Record<string, CropTaxon[]>> = {}

    filteredTaxa.forEach((taxon) => {
      const group = taxon.crop_group || 'Unknown'
      const type = taxon.primary_crop_type || 'Unknown'
      
      if (!grouped[group]) {
        grouped[group] = {}
      }
      if (!grouped[group][type]) {
        grouped[group][type] = []
      }
      grouped[group][type].push(taxon)
    })

    return grouped
  }, [filteredTaxa])

  const toggleGroup = (group: string) => {
    const newSet = new Set(expandedGroups)
    if (newSet.has(group)) {
      newSet.delete(group)
    } else {
      newSet.add(group)
    }
    setExpandedGroups(newSet)
  }

  const toggleType = (key: string) => {
    const newSet = new Set(expandedTypes)
    if (newSet.has(key)) {
      newSet.delete(key)
    } else {
      newSet.add(key)
    }
    setExpandedTypes(newSet)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar with taxonomy tree */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sticky top-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Crop Groups
          </h3>

          <input
            type="text"
            placeholder="Search crops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-gray-900"
          />

          <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
            {Object.keys(hierarchy).map((group) => {
              const isGroupExpanded = expandedGroups.has(group)
              const typeCount = Object.keys(hierarchy[group]).length

              return (
                <div key={group} className="border-l-2 border-gray-300 pl-2">
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">
                        {isGroupExpanded ? '▼' : '▶'}
                      </span>
                      <span className="font-medium text-gray-900">{group}</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {typeCount} types
                    </span>
                  </button>

                  {isGroupExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {Object.entries(hierarchy[group]).map(([type, crops]) => {
                        const typeKey = `${group}-${type}`
                        const isTypeExpanded = expandedTypes.has(typeKey)

                        return (
                          <div key={typeKey}>
                            <button
                              onClick={() => toggleType(typeKey)}
                              className="w-full flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded text-left"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-400 text-sm">
                                  {isTypeExpanded ? '▼' : '▶'}
                                </span>
                                <span className="text-sm text-gray-700">{type}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {crops.length}
                              </span>
                            </button>

                            {isTypeExpanded && (
                              <div className="ml-4 mt-1 space-y-1">
                                {crops.map((taxon) => (
                                  <div
                                    key={taxon.id}
                                    className="py-1 px-2 text-sm text-gray-600 hover:bg-blue-50 rounded cursor-pointer"
                                  >
                                    {taxon.primary_crop_subtype || taxon.english_common_name || 'Unknown'}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              All Crops ({filteredTaxa.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Common Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Scientific Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Family
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Crop Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Subtype
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTaxa.map((taxon) => (
                    <tr key={taxon.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {taxon.english_common_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 italic">
                        {taxon.genus && taxon.species
                          ? `${taxon.genus} ${taxon.species}`
                          : taxon.genus || taxon.species || '-'}
                        {taxon.authority && (
                          <span className="text-gray-500 text-xs ml-1">
                            {taxon.authority}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {taxon.family || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {taxon.primary_crop_type || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {taxon.primary_crop_subtype || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
