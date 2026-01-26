'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PassportData {
  id: string
  [key: string]: any
}

export default function PassportDataSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<PassportData[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch suggestions as user types
  const handleInputChange = async (value: string) => {
    setSearchQuery(value)
    
    if (!value.trim() || value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const supabase = createClient()
    const { data } = await supabase
      .from('Passport Data')
      .select('ACCE_NAME, CROPNAME_English')
      .or(`ACCE_NAME.ilike.%${value}%,CROPNAME_English.ilike.%${value}%`)
      .limit(10)

    if (data) {
      const uniqueSuggestions = Array.from(new Set([
        ...data.map(d => d.ACCE_NAME).filter(Boolean),
        ...data.map(d => d.CROPNAME_English).filter(Boolean)
      ])).slice(0, 8)
      setSuggestions(uniqueSuggestions)
      setShowSuggestions(uniqueSuggestions.length > 0)
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return
    
    setShowSuggestions(false)

    setLoading(true)
    setSearched(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('Passport Data')
        .select('*')
        .or(`ACCE_NAME.ilike.%${searchQuery}%,CROPNAME_English.ilike.%${searchQuery}%,GENUS.ilike.%${searchQuery}%,SPECIES.ilike.%${searchQuery}%,ACCE_NUMB.ilike.%${searchQuery}%`)
        .order('ACCE_NAME', { ascending: true })

      if (error) {
        console.error('Search error:', error)
        setResults([])
      } else {
        setResults(data || [])
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative" ref={searchRef}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search by landrace name, common name, scientific name, or accession number..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
            
            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSearchQuery(suggestion)
                      setShowSuggestions(false)
                      handleSearch()
                    }}
                    className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b last:border-b-0 text-gray-900"
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Results */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-green-600"></div>
          <p className="mt-4 text-gray-600">Searching passport data...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">
            Try searching with a different landrace name or common name
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          <div className="mb-4">
            <p className="text-gray-700">
              Found <span className="font-semibold">{results.length}</span> result{results.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-4">
            {results.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Column 1: Identification */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.ACCE_NAME || 'Unnamed'}
                      </h3>
                      {item.CROPNAME_English && (
                        <p className="text-sm text-gray-600 mt-1">
                          Crop: {item.CROPNAME_English}
                        </p>
                      )}
                    </div>

                    {item.ACCE_NUMB && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Accession Number</span>
                        <p className="text-sm text-gray-900 font-mono">{item.ACCE_NUMB}</p>
                      </div>
                    )}

                    {item['LR_Threat Asses_ID'] && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Threat Assessment ID</span>
                        <p className="text-sm text-gray-900 font-mono">{item['LR_Threat Asses_ID']}</p>
                      </div>
                    )}

                    {(item.GENUS || item.SPECIES) && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Scientific Name</span>
                        <p className="text-sm text-gray-900 italic">
                          {[item.GENUS, item.SPECIES, item.SP_AUTHOR]
                            .filter(v => v && v !== 'NA')
                            .join(' ')}
                        </p>
                        {item.SUB_TAXA && item.SUB_TAXA !== 'NA' && (
                          <p className="text-sm text-gray-900 italic">
                            {item.SUB_TAXA} {item.SUBTA_AUTHOR && item.SUBTA_AUTHOR !== 'NA' ? item.SUBTA_AUTHOR : ''}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Column 2: Location */}
                  <div className="space-y-3">
                    {item.ORIG_CTY && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Country of Origin</span>
                        <p className="text-sm text-gray-900">{item.ORIG_CTY}</p>
                      </div>
                    )}

                    {item.SITE_NAME && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Site Name</span>
                        <p className="text-sm text-gray-900">{item.SITE_NAME}</p>
                      </div>
                    )}

                    {item.SITE_ADDRESS && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Site Address</span>
                        <p className="text-sm text-gray-900">{item.SITE_ADDRESS}</p>
                      </div>
                    )}

                    {(item.DECLATITUDE && item.DECLONGITUDE) && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Coordinates</span>
                        <p className="text-sm text-gray-900 font-mono">
                          {item.DECLATITUDE}, {item.DECLONGITUDE}
                        </p>
                      </div>
                    )}

                    {item.ELEVATION && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Elevation</span>
                        <p className="text-sm text-gray-900">{item.ELEVATION}m</p>
                      </div>
                    )}
                  </div>

                  {/* Column 3: Additional Information */}
                  <div className="space-y-3">
                    {item.SAMPSTAT && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Sample Status</span>
                        <p className="text-sm text-gray-900">{item.SAMPSTAT}</p>
                      </div>
                    )}

                    {item.POPSRC && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Population Source</span>
                        <p className="text-sm text-gray-900">{item.POPSRC}</p>
                      </div>
                    )}

                    {item.POP_ID && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Population ID</span>
                        <p className="text-sm text-gray-900">{item.POP_ID}</p>
                      </div>
                    )}

                    {item.PU_ID && item.PU_ID !== 'NA' && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">PU ID</span>
                        <p className="text-sm text-gray-900">{item.PU_ID}</p>
                      </div>
                    )}

                    {item.OBSERVATION_DATE && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Observation Date</span>
                        <p className="text-sm text-gray-900">{item.OBSERVATION_DATE}</p>
                      </div>
                    )}

                    {item.STORAGE && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Storage</span>
                        <p className="text-sm text-gray-900">{item.STORAGE}</p>
                      </div>
                    )}

                    {item.MLSSTAT && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">MLS Status</span>
                        <p className="text-sm text-gray-900">{item.MLSSTAT}</p>
                      </div>
                    )}

                    {item.DUPL_SITE && item.DUPL_SITE !== 'NA' && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Duplicate Site</span>
                        <p className="text-sm text-gray-900">{item.DUPL_SITE}</p>
                        {item.DUPL_ST_NAME && item.DUPL_ST_NAME !== 'NA' && (
                          <p className="text-sm text-gray-600">{item.DUPL_ST_NAME}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
