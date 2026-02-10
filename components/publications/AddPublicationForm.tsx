'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AddPublicationFormProps {
  userId: string
}

export default function AddPublicationForm({ userId }: AddPublicationFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    journal: '',
    year: '',
    doi: '',
    abstract: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [linkToProfile, setLinkToProfile] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [doiCheckLoading, setDoiCheckLoading] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [existingPublication, setExistingPublication] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      // Check file type (PDF, DOC, DOCX)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Only PDF, DOC, and DOCX files are allowed')
        return
      }
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const checkDOI = async (doi: string) => {
    if (!doi.trim()) return false
    
    setDoiCheckLoading(true)
    try {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .eq('doi', doi.trim())
        .maybeSingle()
      
      if (error) throw error
      
      if (data) {
        setExistingPublication(data)
        setShowDuplicateModal(true)
        return true
      }
      return false
    } catch (err) {
      console.error('Error checking DOI:', err)
      return false
    } finally {
      setDoiCheckLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.authors || !formData.doi || !file) {
      setError('Title, authors, DOI, and file upload are required')
      return
    }
    
    // Check for duplicate DOI
    const isDuplicate = await checkDOI(formData.doi)
    if (isDuplicate) {
      return
    }

    setLoading(true)
    setError('')
    setUploadProgress(0)

    try {
      // File is now required, so no need to check
      if (!file) {
        setError('File upload is required')
        return
      }
      const fileExt = file.name.split('.').pop()
      const fileName_storage = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName_storage}`

      setUploadProgress(30)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('publications')
        .upload(filePath, file)

      if (uploadError) {
        // If bucket doesn't exist, provide helpful error
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Publications storage bucket not set up. Please contact administrator.')
        }
        throw uploadError
      }

      setUploadProgress(60)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('publications')
        .getPublicUrl(filePath)

      const fileUrl = urlData.publicUrl
      const fileName = file.name
      const fileSize = file.size

      setUploadProgress(80)

      // Insert publication record
      const { error: insertError } = await supabase
        .from('publications')
        .insert({
          title: formData.title,
          authors: formData.authors,
          journal: formData.journal || null,
          year: formData.year ? parseInt(formData.year) : null,
          doi: formData.doi.trim(),
          url: null,
          abstract: formData.abstract || null,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          added_by: linkToProfile ? userId : null,
        })

      if (insertError) throw insertError

      setUploadProgress(100)
      router.push('/dashboard/publications')
    } catch (err: any) {
      setError(err.message || 'Failed to add publication')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div>
      {/* Duplicate DOI Modal */}
      {showDuplicateModal && existingPublication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-3">Duplicate DOI Found</h3>
            <p className="text-gray-700 mb-4">
              A publication with DOI <strong>{existingPublication.doi}</strong> already exists in the database:
            </p>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-4">
              <p className="font-medium text-gray-900">{existingPublication.title}</p>
              <p className="text-sm text-gray-600 mt-1">{existingPublication.authors}</p>
              {existingPublication.year && (
                <p className="text-sm text-gray-500 mt-1">Year: {existingPublication.year}</p>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              To avoid duplicates, please verify the DOI or check if this publication is already in the system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDuplicateModal(false)
                  setExistingPublication(null)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <Link href="/dashboard/publications" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Publications
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add Publication</h1>
        <p className="text-gray-600 mt-1">Upload a publication file with DOI information</p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-700">Uploading...</span>
              <span className="text-sm text-gray-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Publication File *
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
            {file && (
              <p className="text-sm text-green-600 mt-2">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX (Max 10MB) - Required</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Publication title"
              required
            />
          </div>

          {/* Authors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authors *
            </label>
            <input
              type="text"
              value={formData.authors}
              onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Author names (separated by commas)"
              required
            />
          </div>

          {/* Journal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Journal / Conference
            </label>
            <input
              type="text"
              value={formData.journal}
              onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Publication venue"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="2024"
                min="1900"
                max="2100"
              />
            </div>

            {/* DOI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DOI *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.doi}
                  onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="10.1234/example"
                  required
                />
                {doiCheckLoading && (
                  <div className="absolute right-3 top-2.5">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Will be checked for duplicates</p>
            </div>
          </div>

          {/* Abstract */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Abstract
            </label>
            <textarea
              value={formData.abstract}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              rows={5}
              placeholder="Publication abstract or summary"
            />
          </div>

          {/* Link to Profile */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="linkToProfile"
              checked={linkToProfile}
              onChange={(e) => setLinkToProfile(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="linkToProfile" className="ml-2 text-sm text-gray-700">
              Link this publication to my profile
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Publication...' : 'Add Publication'}
            </button>
            <Link
              href="/dashboard/publications"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
