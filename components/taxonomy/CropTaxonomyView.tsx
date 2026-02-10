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
    <div>
      {/* Main content area */}
      <div>
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              All Crops ({filteredTaxa.length})
            </h2>
            <input
              type="text"
              placeholder="Search by common name, scientific name, or crop type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
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
