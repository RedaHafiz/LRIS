'use client'

import { useState, useMemo } from 'react'

interface Taxa {
  id: string
  kingdom: string
  phylum: string
  class: string
  spp_count: number
}

interface TaxonomyViewProps {
  taxa: Taxa[]
}

export default function TaxonomyView({ taxa }: TaxonomyViewProps) {
  const [expandedKingdoms, setExpandedKingdoms] = useState<Set<string>>(new Set())
  const [expandedPhyla, setExpandedPhyla] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // Filter taxa by search
  const filteredTaxa = useMemo(() => {
    if (!searchQuery) return taxa
    const query = searchQuery.toLowerCase()
    return taxa.filter(
      (t) =>
        t.kingdom.toLowerCase().includes(query) ||
        t.phylum.toLowerCase().includes(query) ||
        t.class.toLowerCase().includes(query)
    )
  }, [taxa, searchQuery])

  // Group taxa hierarchically
  const hierarchy = useMemo(() => {
    const grouped: Record<string, Record<string, Taxa[]>> = {}

    filteredTaxa.forEach((taxon) => {
      if (!grouped[taxon.kingdom]) {
        grouped[taxon.kingdom] = {}
      }
      if (!grouped[taxon.kingdom][taxon.phylum]) {
        grouped[taxon.kingdom][taxon.phylum] = []
      }
      grouped[taxon.kingdom][taxon.phylum].push(taxon)
    })

    return grouped
  }, [filteredTaxa])

  const toggleKingdom = (kingdom: string) => {
    const newSet = new Set(expandedKingdoms)
    if (newSet.has(kingdom)) {
      newSet.delete(kingdom)
    } else {
      newSet.add(kingdom)
    }
    setExpandedKingdoms(newSet)
  }

  const togglePhylum = (key: string) => {
    const newSet = new Set(expandedPhyla)
    if (newSet.has(key)) {
      newSet.delete(key)
    } else {
      newSet.add(key)
    }
    setExpandedPhyla(newSet)
  }

  const getTotalSpeciesForKingdom = (kingdom: string) => {
    return Object.values(hierarchy[kingdom] || {})
      .flat()
      .reduce((sum, taxon) => sum + taxon.spp_count, 0)
  }

  const getTotalSpeciesForPhylum = (classes: Taxa[]) => {
    return classes.reduce((sum, taxon) => sum + taxon.spp_count, 0)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar with taxonomy tree */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sticky top-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Taxonomic Hierarchy
          </h3>

          <input
            type="text"
            placeholder="Search taxonomy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />

          <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
            {Object.keys(hierarchy).map((kingdom) => {
              const isKingdomExpanded = expandedKingdoms.has(kingdom)
              const speciesCount = getTotalSpeciesForKingdom(kingdom)

              return (
                <div key={kingdom} className="border-l-2 border-gray-300 pl-2">
                  <button
                    onClick={() => toggleKingdom(kingdom)}
                    className="w-full flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">
                        {isKingdomExpanded ? '▼' : '▶'}
                      </span>
                      <span className="font-medium text-gray-900">{kingdom}</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {speciesCount} spp.
                    </span>
                  </button>

                  {isKingdomExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {Object.entries(hierarchy[kingdom]).map(([phylum, classes]) => {
                        const phylumKey = `${kingdom}-${phylum}`
                        const isPhylumExpanded = expandedPhyla.has(phylumKey)
                        const phylumSpeciesCount = getTotalSpeciesForPhylum(classes)

                        return (
                          <div key={phylumKey}>
                            <button
                              onClick={() => togglePhylum(phylumKey)}
                              className="w-full flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded text-left"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-400 text-sm">
                                  {isPhylumExpanded ? '▼' : '▶'}
                                </span>
                                <span className="text-sm text-gray-700">{phylum}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {phylumSpeciesCount} spp.
                              </span>
                            </button>

                            {isPhylumExpanded && (
                              <div className="ml-4 mt-1 space-y-1">
                                {classes.map((taxon) => (
                                  <div
                                    key={taxon.id}
                                    className="py-1 px-2 text-sm text-gray-600 hover:bg-blue-50 rounded cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{taxon.class}</span>
                                      <span className="text-xs text-gray-500">
                                        {taxon.spp_count} spp.
                                      </span>
                                    </div>
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
              All Taxa ({filteredTaxa.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Kingdom
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Phylum
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Class
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Species Count
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTaxa.map((taxon) => (
                    <tr key={taxon.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {taxon.kingdom}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {taxon.phylum}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {taxon.class}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {taxon.spp_count}
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
