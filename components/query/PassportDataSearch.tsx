'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PassportData {
  id: string
  [key: string]: any
}

interface ThreatAssessment {
  LR_Threat_Asses_ID: string
  LR_Name: string
  Crop: string
  LR_Threat_Assessor: string
  Assess_Date: string
  Threat_Scores: string
  Threat_Max_Score: string
  'Threat_Risk_%': string
  Threat_Category: string
  status: string
  [key: string]: any // For all subcriteria scores
}

export default function PassportDataSearch() {
  console.log('PassportDataSearch component loaded - version 2.0')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<PassportData[]>([])
  const [allResults, setAllResults] = useState<PassportData[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [threatAssessments, setThreatAssessments] = useState<Record<string, ThreatAssessment[]>>({})
  const [loadingThreat, setLoadingThreat] = useState<string | null>(null)
  const [popupUrl, setPopupUrl] = useState<string>('')
  
  // Filter states
  const [selectedCrop, setSelectedCrop] = useState<string>('')
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedRisk, setSelectedRisk] = useState<string>('')
  const [availableCrops, setAvailableCrops] = useState<string[]>([])
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [availableRiskLevels, setAvailableRiskLevels] = useState<string[]>([])
  
  const searchRef = useRef<HTMLDivElement>(null)

  // Load popup URL from API
  useEffect(() => {
    const loadPopupUrl = async () => {
      try {
        const response = await fetch('/api/popup-url')
        if (response.ok) {
          const data = await response.json()
          setPopupUrl(data.url)
        }
      } catch (err) {
        console.error('Error loading popup URL:', err)
      }
    }
    loadPopupUrl()
  }, [])

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
    setExpandedCard(null)
    setThreatAssessments({})

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
        setAllResults([])
        setResults([])
      } else {
        const results = data || []
        setAllResults(results)
        setResults(results)
        
        // Extract unique crops and countries for filters (normalize to remove duplicates)
        const crops = [...new Set(results.map(r => r.CROPNAME_English).filter(Boolean))].sort()
        const countriesMap = new Map()
        results.forEach(r => {
          if (r.ORIG_CTY) {
            const normalized = r.ORIG_CTY.trim()
            const key = normalized.toLowerCase()
            if (!countriesMap.has(key)) {
              countriesMap.set(key, normalized)
            }
          }
        })
        const countries = Array.from(countriesMap.values()).sort()
        setAvailableCrops(crops)
        setAvailableCountries(countries)
        
        // Fetch threat assessments to get available risk levels
        fetchAvailableRiskLevels(results.map(r => r.ACCE_NAME).filter(Boolean))
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setAllResults([])
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableRiskLevels = async (landraceNames: string[]) => {
    if (landraceNames.length === 0) return
    
    const supabase = createClient()
    const { data } = await supabase
      .from('Threat Assessments')
      .select('Threat_Category')
      .in('LR_Name', landraceNames)
    
    if (data) {
      const categories = [...new Set(data.map(d => d.Threat_Category).filter(Boolean))].sort()
      setAvailableRiskLevels(categories)
    }
  }

  // Apply filters when filter values change
  useEffect(() => {
    if (!searched || allResults.length === 0) return

    const applyFilters = async () => {
      let filtered = [...allResults]

      // Filter by crop
      if (selectedCrop) {
        filtered = filtered.filter(item => item.CROPNAME_English === selectedCrop)
      }

      // Filter by country
      if (selectedCountry) {
        filtered = filtered.filter(item => item.ORIG_CTY === selectedCountry)
      }

      // Filter by risk level (requires fetching threat assessments)
      if (selectedRisk) {
        const supabase = createClient()
        const landraceNames = filtered.map(item => item.ACCE_NAME).filter(Boolean)
        
        const { data: threatData } = await supabase
          .from('Threat Assessments')
          .select('LR_Name, Threat_Category')
          .in('LR_Name', landraceNames)
          .eq('Threat_Category', selectedRisk)
        
        if (threatData) {
          const matchingNames = new Set(threatData.map(t => t.LR_Name))
          filtered = filtered.filter(item => matchingNames.has(item.ACCE_NAME))
        }
      }

      setResults(filtered)
    }
    
    applyFilters()
  }, [selectedCrop, selectedCountry, selectedRisk, allResults, searched])

  const toggleThreatAssessment = async (lrThreatAssesId: string, itemId: string) => {
    if (expandedCard === itemId) {
      setExpandedCard(null)
      return
    }

    setExpandedCard(itemId)

    // If already fetched, don't fetch again (temporarily disabled for debugging)
    // if (threatAssessments[itemId]) {
    //   return
    // }

    console.log('Fetching threat assessment for ID:', lrThreatAssesId)
    setLoadingThreat(itemId)
    const supabase = createClient()

    try {
      // Fetch all and filter client-side to debug
      const { data: allData, error } = await supabase
        .from('Threat Assessments')
        .select('*')
      
      console.log('Total records fetched:', allData?.length || 0)
      console.log('Looking for ID:', JSON.stringify(lrThreatAssesId))
      console.log('Sample IDs from database:', allData?.slice(0, 5).map(a => JSON.stringify(a.LR_Threat_Asses_ID)))
      
      const data = allData?.filter(item => item.LR_Threat_Asses_ID === lrThreatAssesId)
      console.log('Filtered results count:', data?.length || 0)
      
      if (data && data.length > 0) {
        console.log('Match found:', data[0])
      } else {
        console.log('No exact match found. Trying case-insensitive and trimmed comparison...')
        const dataFuzzy = allData?.filter(item => 
          item.LR_Threat_Asses_ID?.toString().trim().toLowerCase() === lrThreatAssesId?.toString().trim().toLowerCase()
        )
        console.log('Fuzzy match results:', dataFuzzy?.length || 0)
        if (dataFuzzy && dataFuzzy.length > 0) {
          console.log('Fuzzy match found:', dataFuzzy[0])
        }
      }
      
      console.log('Query result:', { data, error })

      if (error) {
        console.error('Error fetching threat assessments:', error)
      } else {
        setThreatAssessments(prev => ({
          ...prev,
          [itemId]: data || []
        }))
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoadingThreat(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Subcriteria Information Button */}
      {popupUrl && (
        <div className="mb-6 flex justify-end">
          <a
            href={popupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Click here for subcriteria information
          </a>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
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
          </div>

          {/* Filters - Only show after search */}
          {searched && allResults.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
                
                {/* Crop Filter */}
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                >
                  <option value="">All Crops</option>
                  {availableCrops.map((crop) => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>

                {/* Country Filter */}
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                >
                  <option value="">All Countries</option>
                  {availableCountries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>

                {/* Risk Level Filter */}
                <select
                  value={selectedRisk}
                  onChange={(e) => setSelectedRisk(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                >
                  <option value="">All Threat Categories</option>
                  {availableRiskLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>

                {/* Clear Filters */}
                {(selectedCrop || selectedCountry || selectedRisk) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCrop('')
                      setSelectedCountry('')
                      setSelectedRisk('')
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
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

                    {item.LR_Threat_Asses_ID && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Threat Assessment ID</span>
                        <p className="text-sm text-gray-900 font-mono">{item.LR_Threat_Asses_ID}</p>
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

                {/* Show Threat Assessment Button */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      try {
                        console.log('Button clicked for item:', item.ACCE_NAME, 'ID:', item.LR_Threat_Asses_ID)
                        console.log('About to call toggleThreatAssessment')
                        toggleThreatAssessment(item.LR_Threat_Asses_ID || '', item.id)
                      } catch (error) {
                        console.error('Error in button click:', error)
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-sm"
                    type="button"
                  >
                    {expandedCard === item.id ? 'Hide Threat Assessment' : 'Show Threat Assessment'}
                  </button>
                </div>

                {/* Threat Assessment Dropdown */}
                {expandedCard === item.id && (
                  <div className="mt-6 pt-4 border-t-2 border-yellow-300">
                    {loadingThreat === item.id ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading threat assessments...</span>
                      </div>
                    ) : threatAssessments[item.id] && threatAssessments[item.id].length > 0 ? (
                      <div className="space-y-6">
                        {threatAssessments[item.id].map((assessment) => (
                          <div key={assessment.LR_Threat_Asses_ID} className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                            {/* Header Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-4 border-b border-yellow-200">
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Assessment ID</span>
                                <p className="text-sm text-gray-900 font-mono">{assessment.LR_Threat_Asses_ID}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Assessor</span>
                                <p className="text-sm text-gray-900">{assessment.LR_Threat_Assessor}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Assessment Date</span>
                                <p className="text-sm text-gray-900">{assessment.Assess_Date}</p>
                              </div>
                            </div>

                            {/* Threat Criteria Scores */}
                            <div className="space-y-6">
                              {/* Criterion A: LR Population Range */}
                              <div>
                                <h5 className="font-semibold text-gray-900 mb-3 text-sm">A. LR Population Range</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-600">A1.1: Geographic range <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_A1.1'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">A1.2: Geographic concentration <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_A1.2'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">A1.3: LR maintainer number <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_A1.3'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">A2.1: Geographic range reduction <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_A2.1'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">A2.2: Geographic concentration reduction <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_A2.2'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">A2.3: Geographic constancy <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_A2.3'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">A2.4: Maintainer number reduction <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_A2.4'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">A3.1: LR phenotypic diversity <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_A3.1'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">A3.2: LR exchange <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_A3.2'] || 'N/A'}</span></span>
                                  </div>
                                </div>
                              </div>

                              {/* Criterion B: LR Population Trend */}
                              <div>
                                <h5 className="font-semibold text-gray-900 mb-3 text-sm">B. LR Population Trend</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-600">B1: Production sustainability <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_B1.1'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">B1.1: Ease of multiplication <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_B1.2'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">B1.2: Maintainer continuation <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_B1.3'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">B1.3: LR known loss <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_B1.4'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">B1.4: Cultivation of modern cultivars <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_C1.1'] || 'N/A'}</span></span>
                                  </div>
                                </div>
                              </div>

                              {/* Criterion C: Market Farmer Characteristics */}
                              <div>
                                <h5 className="font-semibold text-gray-900 mb-3 text-sm">C. Market Farmer Characteristics</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-600">C1: Market prospects <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_C1.2'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">C1.1: LR support applied <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_C1.3'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">C1.2: Market range <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_C2.1'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">C1.3: Food system embeddedness <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_D1.1'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">C2.1: Maintainer Age <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_D1.2'] || 'N/A'}</span></span>
                                  </div>
                                </div>
                              </div>

                              {/* Criterion D: LR Context */}
                              <div>
                                <h5 className="font-semibold text-gray-900 mb-3 text-sm">D. LR Context</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-600">D1.1: Conserved in situ <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_D1.3'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">D1.2: Conserved in situ backup <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_D2.1'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">D1.3: Conserved ex-situ <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_D2.2'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">D2.1: Type of cultivation system <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_D3.1'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">D2.2: Herbicide and fertilizer usage <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_A1.1'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">D3.1: Distorting incentives <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_A1.2'] || 'N/A'}</span></span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">D3.2: Global stochastic impact <span className="font-medium text-gray-900">{assessment['Subcriteria_Scores_A1.3'] || 'N/A'}</span></span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Final Results */}
                            <div className="mt-6 pt-4 border-t border-yellow-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Threat Score</span>
                                <p className="text-base text-gray-900 font-semibold">{assessment.Threat_Scores} / {assessment.Threat_Max_Score}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Risk Percentage</span>
                                <p className="text-base text-gray-900 font-semibold">{assessment['Threat_Risk_%']}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Final Result</span>
                                <p className="text-xl font-bold text-gray-900">{assessment.Threat_Category}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No threat assessments found for this landrace.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
