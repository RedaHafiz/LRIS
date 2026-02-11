'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface CropTaxon {
  id: string
  crop_group: string
  primary_crop_type: string
  primary_crop_subtype: string
  english_common_name: string
  genus: string
  species: string
}

interface ThreatAssessmentWizardProps {
  existingCrops: string[]
  existingLandraces: string[]
  taxa: CropTaxon[]
  userId: string
  projectId?: string
  existingAssessment?: any
  existingReviewerId?: string
  existingCoAssessorId?: string
  existingTaxaId?: string
  isEditMode?: boolean
  existingComments?: any[]
}

// Threat category based on risk percentage
const getThreatCategory = (riskPercentage: number): string => {
  if (riskPercentage >= 80) return 'Very High (VH)'
  if (riskPercentage >= 70) return 'High (HI)'
  if (riskPercentage >= 60) return 'Moderate (MO)'
  if (riskPercentage >= 50) return 'Low (LO)'
  if (riskPercentage >= 40) return 'Very Low (VL)'
  if (riskPercentage >= 30) return 'Near Threatened (NT)'
  return 'Least Concern (LC)'
}

export default function ThreatAssessmentWizard({ existingCrops, existingLandraces, taxa, userId, projectId, existingAssessment, existingReviewerId, existingCoAssessorId, existingTaxaId, isEditMode = false, existingComments = [] }: ThreatAssessmentWizardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitForReview, setSubmitForReview] = useState(false)
  const [error, setError] = useState('')
  
  // Member management
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [coAssessorSearchQuery, setCoAssessorSearchQuery] = useState('')
  const [selectedReviewer, setSelectedReviewer] = useState(existingReviewerId || '')
  const [selectedCoAssessor, setSelectedCoAssessor] = useState(existingCoAssessorId || '')
  const [reviewerError, setReviewerError] = useState(false)

  // Form data - pre-fill if editing existing assessment
  const [formData, setFormData] = useState({
    // Step 1: Assessment Unit
    lr_name: existingAssessment?.LR_Name || '',
    crop: existingAssessment?.Crop || '',
    taxa_id: existingTaxaId || '',
    
    // Step 2: Representative Data
    lr_threat_assessor: existingAssessment?.LR_Threat_Assessor || '',
    assess_date: existingAssessment?.Assess_Date || new Date().toISOString().split('T')[0],
    
    // Step 3: Threat Criteria Scores
    'Subcriteria_Scores_A1.1': existingAssessment?.['Subcriteria_Scores_A1.1'] || '',
    'Subcriteria_Scores_A1.2': existingAssessment?.['Subcriteria_Scores_A1.2'] || '',
    'Subcriteria_Scores_A1.3': existingAssessment?.['Subcriteria_Scores_A1.3'] || '',
    'Subcriteria_Scores_A2.1': existingAssessment?.['Subcriteria_Scores_A2.1'] || '',
    'Subcriteria_Scores_A2.2': existingAssessment?.['Subcriteria_Scores_A2.2'] || '',
    'Subcriteria_Scores_A2.3': existingAssessment?.['Subcriteria_Scores_A2.3'] || '',
    'Subcriteria_Scores_A2.4': existingAssessment?.['Subcriteria_Scores_A2.4'] || '',
    'Subcriteria_Scores_A3.1': existingAssessment?.['Subcriteria_Scores_A3.1'] || '',
    'Subcriteria_Scores_A3.2': existingAssessment?.['Subcriteria_Scores_A3.2'] || '',
    'Subcriteria_Scores_B1.1': existingAssessment?.['Subcriteria_Scores_B1.1'] || '',
    'Subcriteria_Scores_B1.2': existingAssessment?.['Subcriteria_Scores_B1.2'] || '',
    'Subcriteria_Scores_B1.3': existingAssessment?.['Subcriteria_Scores_B1.3'] || '',
    'Subcriteria_Scores_B1.4': existingAssessment?.['Subcriteria_Scores_B1.4'] || '',
    'Subcriteria_Scores_C1.1': existingAssessment?.['Subcriteria_Scores_C1.1'] || '',
    'Subcriteria_Scores_C1.2': existingAssessment?.['Subcriteria_Scores_C1.2'] || '',
    'Subcriteria_Scores_C1.3': existingAssessment?.['Subcriteria_Scores_C1.3'] || '',
    'Subcriteria_Scores_C2.1': existingAssessment?.['Subcriteria_Scores_C2.1'] || '',
    'Subcriteria_Scores_D1.1': existingAssessment?.['Subcriteria_Scores_D1.1'] || '',
    'Subcriteria_Scores_D1.2': existingAssessment?.['Subcriteria_Scores_D1.2'] || '',
    'Subcriteria_Scores_D1.3': existingAssessment?.['Subcriteria_Scores_D1.3'] || '',
    'Subcriteria_Scores_D2.1': existingAssessment?.['Subcriteria_Scores_D2.1'] || '',
    'Subcriteria_Scores_D2.2': existingAssessment?.['Subcriteria_Scores_D2.2'] || '',
    'Subcriteria_Scores_D3.1': existingAssessment?.['Subcriteria_Scores_D3.1'] || '',
    'Subcriteria_Scores_D3.2': existingAssessment?.['Subcriteria_Scores_D3.2'] || '',
  })

  // Landrace name autocomplete
  const [showLandraceSuggestions, setShowLandraceSuggestions] = useState(false)
  const [landraceSearchTerm, setLandraceSearchTerm] = useState('')
  
  const landraceNames = useMemo(() => {
    return existingLandraces.sort()
  }, [existingLandraces])

  const filteredLandraceNames = useMemo(() => {
    if (!landraceSearchTerm) return landraceNames
    return landraceNames.filter(name => 
      name.toLowerCase().includes(landraceSearchTerm.toLowerCase())
    )
  }, [landraceNames, landraceSearchTerm])

  // Crop name autocomplete
  const [showCropSuggestions, setShowCropSuggestions] = useState(false)
  const [cropSearchTerm, setCropSearchTerm] = useState('')
  
  const cropNames = useMemo(() => {
    return existingCrops.sort()
  }, [existingCrops])

  const filteredCropNames = useMemo(() => {
    if (!cropSearchTerm) return cropNames
    return cropNames.filter(name => 
      name.toLowerCase().includes(cropSearchTerm.toLowerCase())
    )
  }, [cropNames, cropSearchTerm])

  const filteredTaxa = useMemo(() => {
    if (!formData.crop) return taxa
    return taxa.filter(t => t.english_common_name === formData.crop)
  }, [taxa, formData.crop])

  // Load current user and all users for member selection
  useEffect(() => {
    const loadUsersAndCurrentUser = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Load user profile
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setCurrentUser(profile)
        }
      }
      
      // Load all users
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, avatar_url')
        .order('first_name')
      
      if (data) {
        setAllUsers(data)
      }
    }
    
    loadUsersAndCurrentUser()
  }, [supabase])

  // Filter users based on search query for reviewer
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return allUsers
    const query = searchQuery.toLowerCase()
    return allUsers.filter(user => 
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    )
  }, [allUsers, searchQuery])

  // Filter users based on search query for co-assessor
  const filteredCoAssessors = useMemo(() => {
    if (!coAssessorSearchQuery) return allUsers.filter(u => u.id !== userId)
    const query = coAssessorSearchQuery.toLowerCase()
    return allUsers.filter(user => 
      user.id !== userId && (
        user.first_name?.toLowerCase().includes(query) ||
        user.last_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      )
    )
  }, [allUsers, coAssessorSearchQuery, userId])

  // Calculate threat scores with NA handling
  // Base max score is 120 (24 criteria × 5 points each)
  // For each NA value, deduct 5 from the max score
  const calculateThreatScores = () => {
    const BASE_MAX_SCORE = 120
    const POINTS_PER_CRITERIA = 5
    
    const criteriaKeys = Object.keys(formData).filter(key => key.startsWith('Subcriteria_Scores_'))
    
    let totalScore = 0
    let naCount = 0
    
    criteriaKeys.forEach(key => {
      const value = (formData[key as keyof typeof formData] as string).trim().toUpperCase()
      if (value === 'NA' || value === 'N/A') {
        naCount++
      } else {
        const numValue = parseInt(value)
        if (!isNaN(numValue)) {
          totalScore += numValue
        }
      }
    })
    
    // Adjusted max score = base max score - (NA count × points per criteria)
    const adjustedMaxScore = BASE_MAX_SCORE - (naCount * POINTS_PER_CRITERIA)
    const riskPercentage = adjustedMaxScore > 0 ? (totalScore / adjustedMaxScore) * 100 : 0
    
    return {
      threat_scores: totalScore.toString(),
      threat_max_score: adjustedMaxScore.toString(),
      threat_risk: riskPercentage.toFixed(1) + '%',
      threat_category: getThreatCategory(riskPercentage)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')
    
    // Validate reviewer is selected
    if (!selectedReviewer) {
      setReviewerError(true)
      setError('Please select a reviewer before submitting.')
      setIsSubmitting(false)
      return
    }

    try {
      const scores = calculateThreatScores()
      
      let assessmentId: string
      
      if (isEditMode && existingAssessment) {
        // Edit mode: use existing ID
        assessmentId = existingAssessment.LR_Threat_Asses_ID
      } else {
        // Create mode: generate new chronological ID based on drafts table
        const { count, error: countError } = await supabase
          .from('Threat Assessments_duplicate')
          .select('*', { count: 'exact', head: true })
        
        if (countError) throw countError
        
        const nextNumber = (count || 0) + 1
        assessmentId = `DRAFT-${nextNumber}`
      }
      
      // Get assessor name from current user
      const assessorName = currentUser?.first_name && currentUser?.last_name
        ? `${currentUser.first_name} ${currentUser.last_name}`.trim()
        : currentUser?.email || 'Unknown'
      
      // Prepare data
      const assessmentData = {
        LR_Threat_Asses_ID: assessmentId,
        LR_Name: formData.lr_name,
        Crop: formData.crop,
        LR_Threat_Assessor: assessorName,
        Assess_Date: formData.assess_date,
        ...Object.keys(formData)
          .filter(key => key.startsWith('Subcriteria_Scores_'))
          .reduce((acc, key) => ({
            ...acc,
            [key]: formData[key as keyof typeof formData] || null
          }), {}),
        Threat_Scores: scores.threat_scores,
        Threat_Max_Score: scores.threat_max_score,
        'Threat_Risk_%': scores.threat_risk,
        Threat_Category: scores.threat_category,
        status: submitForReview ? 'pending_review' : 'draft',
      }

      if (isEditMode) {
        // Update existing draft
        const { error: updateError } = await supabase
          .from('Threat Assessments_duplicate')
          .update(assessmentData)
          .eq('LR_Threat_Asses_ID', assessmentId)

        if (updateError) throw updateError
        
        // Delete old assignments and taxa link to recreate
        await supabase
          .from('assessment_assignments')
          .delete()
          .eq('assessment_id', assessmentId)
        
        await supabase
          .from('assessment_taxa')
          .delete()
          .eq('assessment_id', assessmentId)
      } else {
        // Insert new draft
        const { error: insertError } = await supabase
          .from('Threat Assessments_duplicate')
          .insert(assessmentData)

        if (insertError) throw insertError
      }

      // Link to taxa if selected
      if (formData.taxa_id) {
        await supabase
          .from('assessment_taxa')
          .insert({
            assessment_id: assessmentId,
            taxa_id: formData.taxa_id,
          })
      }
      
      // Assign assessor (current user)
      const { error: assessorError } = await supabase
        .from('assessment_assignments')
        .insert({
          assessment_id: assessmentId,
          user_id: userId,
          role: 'assessor',
        })
      
      if (assessorError) {
        console.error('Error assigning assessor:', assessorError)
        throw assessorError
      }
      
      // Assign co-assessor if selected
      if (selectedCoAssessor) {
        const { error: coAssessorError } = await supabase
          .from('assessment_assignments')
          .insert({
            assessment_id: assessmentId,
            user_id: selectedCoAssessor,
            role: 'co-assessor',
          })
        
        if (coAssessorError) {
          console.error('Error assigning co-assessor:', coAssessorError)
          throw coAssessorError
        }
        
        // Create notification for co-assessor
        const coAssessorData = allUsers.find(u => u.id === selectedCoAssessor)
        const coAssessorName = coAssessorData?.first_name || coAssessorData?.last_name 
          ? `${coAssessorData.first_name || ''} ${coAssessorData.last_name || ''}`.trim()
          : coAssessorData?.email || 'Co-assessor'
        
        const coAssessorMessage = `You have been assigned as a co-assessor for the threat assessment: "${formData.lr_name}" (${formData.crop})`
        
        // Create in-platform notification for co-assessor
        await supabase
          .from('notifications')
          .insert({
            user_id: selectedCoAssessor,
            message: coAssessorMessage,
            type: 'assignment',
            read: false,
          })
        
        // Send email notification to co-assessor
        if (coAssessorData?.email) {
          try {
            await fetch('/api/send-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: coAssessorData.email,
                subject: 'Co-Assessor Assignment - Threat Assessment Platform',
                message: coAssessorMessage,
              }),
            })
          } catch (emailError) {
            console.error('Failed to send co-assessor email notification:', emailError)
          }
        }
      }
      
      // Assign reviewer
      if (selectedReviewer) {
        const { error: reviewerError } = await supabase
          .from('assessment_assignments')
          .insert({
            assessment_id: assessmentId,
            user_id: selectedReviewer,
            role: 'reviewer',
          })
        
        if (reviewerError) {
          console.error('Error assigning reviewer:', reviewerError)
          throw reviewerError
        }
        
        // Create notification for the reviewer
        const reviewerData = allUsers.find(u => u.id === selectedReviewer)
        const reviewerName = reviewerData?.first_name || reviewerData?.last_name 
          ? `${reviewerData.first_name || ''} ${reviewerData.last_name || ''}`.trim()
          : reviewerData?.email || 'Reviewer'
        
        const notificationMessage = `You have been assigned as a reviewer for the threat assessment: "${formData.lr_name}" (${formData.crop})`
        
        // Create in-platform notification
        await supabase
          .from('notifications')
          .insert({
            user_id: selectedReviewer,
            message: notificationMessage,
            type: 'assignment',
            read: false,
          })
        
        // Send email notification
        if (reviewerData?.email) {
          try {
            await fetch('/api/send-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: reviewerData.email,
                subject: 'New Reviewer Assignment - Threat Assessment Platform',
                message: notificationMessage,
              }),
            })
          } catch (emailError) {
            console.error('Failed to send email notification:', emailError)
            // Don't fail the whole submission if email fails
          }
        }
      }

      router.push('/dashboard/my-assessments')
    } catch (err: any) {
      setError(err.message || 'Failed to create assessment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step === currentStep 
                ? 'bg-blue-600 text-white' 
                : step < currentStep 
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step < currentStep ? '✓' : step}
            </div>
            {step < 6 && (
              <div className={`flex-1 h-1 mx-2 ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        <span>Assessment Unit</span>
        <span>Add Members</span>
        <span>Data Collection</span>
        <span>Criteria Scoring</span>
        <span>Review Category</span>
        <span>Submit</span>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        {renderStepIndicator()}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Step 1: Assessment Unit */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 1: Choose Assessment Unit</h2>
            <p className="text-gray-600">Select the landrace to be assessed and link it to crop taxonomy.</p>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landrace Name *
              </label>
              <input
                type="text"
                value={formData.lr_name}
                onChange={(e) => {
                  const value = e.target.value
                  setLandraceSearchTerm(value)
                  setFormData({ ...formData, lr_name: value })
                  setShowLandraceSuggestions(true)
                }}
                onFocus={() => setShowLandraceSuggestions(true)}
                onBlur={() => setTimeout(() => setShowLandraceSuggestions(false), 200)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Type to search landrace names..."
                required
              />
              {showLandraceSuggestions && filteredLandraceNames.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredLandraceNames.map((name) => (
                    <div
                      key={name}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setFormData({ ...formData, lr_name: name })
                        setLandraceSearchTerm(name)
                        setShowLandraceSuggestions(false)
                      }}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-gray-900"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crop Name *
              </label>
              <input
                type="text"
                value={formData.crop}
                onChange={(e) => {
                  const value = e.target.value
                  setCropSearchTerm(value)
                  setFormData({ ...formData, crop: value, taxa_id: '' })
                  setShowCropSuggestions(true)
                }}
                onFocus={() => setShowCropSuggestions(true)}
                onBlur={() => setTimeout(() => setShowCropSuggestions(false), 200)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Type to search crop names..."
                required
              />
              {showCropSuggestions && filteredCropNames.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCropNames.map((name) => (
                    <div
                      key={name}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setFormData({ ...formData, crop: name, taxa_id: '' })
                        setCropSearchTerm(name)
                        setShowCropSuggestions(false)
                      }}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-gray-900"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formData.crop && filteredTaxa.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link to Taxonomy (Optional)
                </label>
                <select
                  value={formData.taxa_id}
                  onChange={(e) => setFormData({ ...formData, taxa_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Select Taxonomic Classification</option>
                  {filteredTaxa.map((taxon) => (
                    <option key={taxon.id} value={taxon.id}>
                      {taxon.genus} {taxon.species}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Add Members */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 2: Add Members</h2>
            <p className="text-gray-600">Select a reviewer (required) and optionally add a co-assessor.</p>

            {/* Reviewer Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                reviewerError ? 'text-red-600' : 'text-gray-700'
              }`}>
                Reviewer * {reviewerError && <span className="text-red-600">(Please select a reviewer)</span>}
              </label>
              
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 mb-3"
              />
              
              <div className={`border rounded-lg max-h-64 overflow-y-auto ${
                reviewerError ? 'border-red-500' : 'border-gray-300'
              }`}>
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No users found</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => {
                        setSelectedReviewer(user.id)
                        setReviewerError(false)
                      }}
                      className={`p-3 cursor-pointer border-b last:border-b-0 hover:bg-blue-50 ${
                        selectedReviewer === user.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt="Avatar" 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                              {user.first_name?.[0] || user.email[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.first_name || user.last_name 
                                ? `${user.first_name || ''} ${user.last_name || ''}`.trim() 
                                : 'No name'}
                            </p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        {selectedReviewer === user.id && (
                          <span className="text-blue-600 font-semibold">✓</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Co-Assessor Selection (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Co-Assessor (Optional)
              </label>
              <p className="text-sm text-gray-600 mb-3">Add a co-assessor to collaborate on this assessment</p>
              
              <input
                type="text"
                value={coAssessorSearchQuery}
                onChange={(e) => setCoAssessorSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 mb-3"
              />
              
              <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                {filteredCoAssessors.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No users found</div>
                ) : (
                  filteredCoAssessors.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedCoAssessor(user.id === selectedCoAssessor ? '' : user.id)}
                      className={`p-3 cursor-pointer border-b last:border-b-0 hover:bg-green-50 ${
                        selectedCoAssessor === user.id ? 'bg-green-100 border-l-4 border-l-green-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt="Avatar" 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                              {user.first_name?.[0] || user.email[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.first_name || user.last_name 
                                ? `${user.first_name || ''} ${user.last_name || ''}`.trim() 
                                : 'No name'}
                            </p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        {selectedCoAssessor === user.id && (
                          <span className="text-green-600 font-semibold">✓</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Data Collection */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 3: Representative Data Collection</h2>
            <p className="text-gray-600">Enter population descriptive and management data for this landrace.</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Date *
              </label>
              <input
                type="date"
                value={formData.assess_date}
                onChange={(e) => setFormData({ ...formData, assess_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> In the next step, you'll score this landrace against threat criteria based on the representative data you've collected.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Criteria Scoring */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 4: Match Data Against Threat Criteria</h2>
            <p className="text-gray-600">Score each criterion based on your collected data (1-5 scale).</p>
            
            <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 p-4 rounded">
              <p>
                <a 
                  href="https://www.frontiersin.org/files/Articles/1336876/fpls-15-1336876-HTML/image_m/fpls-15-1336876-t001.jpg" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Refer to this for criteria
                </a>
              </p>
              <p className="mt-2"><strong>Note:</strong> If a criterion is not applicable (NA), please type NA.</p>
            </div>

            <div className="space-y-8 max-h-[600px] overflow-y-auto pr-4">
              {/* Criterion A: LR Population Range */}
              <div className="border-l-4 border-red-500 pl-4 bg-red-50 p-4 rounded-r">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">Criterion A: LR Population Range</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">A1: LR cultivation estimate</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_A1.1']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_A1.1': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">A1.1: Geographic range</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_A1.2']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_A1.2': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">A1.2: Geographic concentration</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_A1.3']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_A1.3': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">A1.3: LR maintainer number</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_A2.1']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_A2.1': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">A2.1: Geographic range reduction</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_A2.2']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_A2.2': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">A2.2: Geographic concentration reduction</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_A2.3']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_A2.3': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">A2.3: Geographic constancy</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_A2.4']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_A2.4': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">A2.4: Maintainer number reduction</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_A3.1']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_A3.1': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">A3.1: LR phenotypic diversity</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_A3.2']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_A3.2': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">A3.2: LR exchange</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_B1.1']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_B1.1': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                </div>
              </div>

              {/* Criterion B: LR Population Trend */}
              <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded-r">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">Criterion B: LR Population Trend</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">B1: Production sustainability</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_B1.2']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_B1.2': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">B1.1: Ease of multiplication</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_B1.3']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_B1.3': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">B1.2: Maintainer continuation</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_B1.4']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_B1.4': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">B1.3: LR known loss</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_C1.1']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_C1.1': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">B1.4: Cultivation of modern cultivars</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_C1.2']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_C1.2': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                </div>
              </div>

              {/* Criterion C: Market Farmer Characteristics */}
              <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded-r">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">Criterion C: Market Farmer Characteristics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">C1: Market prospects</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_C1.3']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_C1.3': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">C1.1: LR support applied</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_C2.1']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_C2.1': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">C1.2: Market range</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_D1.1']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_D1.1': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">C1.3: Food system embeddedness</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_D1.2']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_D1.2': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">C2.1: Maintainer Age</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_D1.3']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_D1.3': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                </div>
              </div>

              {/* Criterion D: LR Context */}
              <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-50 p-4 rounded-r">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">Criterion D: LR Context</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">D1.1: Conserved in situ</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_D2.1']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_D2.1': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">D1.2: Conserved in situ backup</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_D2.2']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_D2.2': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">D1.3: Conserved ex-situ</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_D3.1']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_D3.1': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">D2.1: Type of cultivation system</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_D3.2']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_D3.2': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">D2.2: Herbicide and fertilizer usage</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_A1.1']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_A1.1': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">D3.1: Distorting incentives</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_A1.2']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_A1.2': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">D3.2: Global stochastic impact</label>
                    <input type="text" placeholder="1-5 or NA"
                      value={formData['Subcriteria_Scores_A1.3']}
                      onChange={(e) => setFormData({ ...formData, 'Subcriteria_Scores_A1.3': e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 5: Review Threat Category</h2>
            <p className="text-gray-600">Review the automatically calculated threat assessment results.</p>

            {(() => {
              const scores = calculateThreatScores()
              return (
                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Landrace:</p>
                      <p className="font-semibold text-gray-900">{formData.lr_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Crop:</p>
                      <p className="font-semibold text-gray-900">{formData.crop}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Threat Score:</p>
                      <p className="font-semibold text-gray-900">{scores.threat_scores} / {scores.threat_max_score}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Threat Risk:</p>
                      <p className="font-semibold text-gray-900">{scores.threat_risk}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Assigned Threat Category:</p>
                    <p className="text-2xl font-bold text-blue-600">{scores.threat_category}</p>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Step 6: Submit */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 6: Submit for Expert Verification</h2>
            <p className="text-gray-600">Your assessment is ready to be submitted. Choose whether to save as draft or submit for review.</p>

            {/* Display comments if assessment was returned */}
            {existingComments && existingComments.length > 0 && existingAssessment?.status === 'returned' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-3">Reviewer Comments</h3>
                <div className="space-y-3">
                  {existingComments.map((comment: any) => (
                    <div key={comment.id} className="border-l-4 border-yellow-500 pl-3 py-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {comment.profiles?.first_name || comment.profiles?.last_name
                            ? `${comment.profiles.first_name || ''} ${comment.profiles.last_name || ''}`.trim()
                            : comment.profiles?.email || 'Reviewer'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-gray-700 text-sm">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-green-50 p-6 rounded-lg">
              <p className="text-green-800 font-semibold mb-2">✓ Assessment Complete</p>
              <p className="text-sm text-green-700">
                You can save this assessment as a draft or submit it for expert review.
              </p>
            </div>

            {/* Submit options */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={submitForReview}
                  onChange={(e) => setSubmitForReview(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <p className="font-medium text-gray-900">Submit for Review</p>
                  <p className="text-sm text-gray-600">Check this box to send the assessment to the reviewer immediately. Otherwise, it will be saved as a draft.</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={
                (currentStep === 1 && (!formData.lr_name || !formData.crop)) ||
                (currentStep === 3 && !formData.assess_date)
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : (submitForReview ? 'Submit for Review' : 'Save as Draft')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
