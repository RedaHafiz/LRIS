'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AssessmentReviewViewProps {
  assessment: any
  comments: any[]
  assignments: any[]
  userId: string
  assessmentId: string
}

export default function AssessmentReviewView({
  assessment,
  comments: initialComments,
  assignments,
  userId,
  assessmentId,
}: AssessmentReviewViewProps) {
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('assessment_comments')
        .insert({
          assessment_id: assessmentId,
          user_id: userId,
          comment: newComment.trim(),
        })
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      setComments([...comments, data])
      setNewComment('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      // Generate final LR ID for approved assessment
      const { count } = await supabase
        .from('Threat Assessments')
        .select('*', { count: 'exact', head: true })
      
      const finalId = `LR-${(count || 0) + 1}`
      
      // Copy draft to main Threat Assessments table with new ID
      const approvedData = {
        ...assessment,
        LR_Threat_Asses_ID: finalId,
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      }
      delete approvedData.id // Remove duplicate table's UUID
      
      const { error: insertError } = await supabase
        .from('Threat Assessments')
        .insert(approvedData)

      if (insertError) throw insertError
      
      // Delete draft from duplicate table
      const { error: deleteError } = await supabase
        .from('Threat Assessments_duplicate')
        .delete()
        .eq('LR_Threat_Asses_ID', assessmentId)
      
      if (deleteError) throw deleteError
      
      // Delete assignments (they're linked to draft ID)
      await supabase
        .from('assessment_assignments')
        .delete()
        .eq('assessment_id', assessmentId)
      
      // Delete taxa links
      await supabase
        .from('assessment_taxa')
        .delete()
        .eq('assessment_id', assessmentId)
      
      // Delete comments
      await supabase
        .from('assessment_comments')
        .delete()
        .eq('assessment_id', assessmentId)

      // Notify assessor and co-assessor
      const assessorIds = assignments
        .filter(a => a.role === 'assessor' || a.role === 'co-assessor')
        .map(a => a.profiles.id)

      for (const assessorId of assessorIds) {
        await supabase
          .from('notifications')
          .insert({
            user_id: assessorId,
            message: `Your threat assessment "${assessment.LR_Name}" has been approved and published to the database!`,
            type: 'approval',
            read: false,
          })
      }

      router.push('/dashboard/my-assessments')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReturn = async () => {
    if (comments.length === 0) {
      setError('Please add at least one comment before returning the assessment.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Update draft status in duplicate table
      const { error } = await supabase
        .from('Threat Assessments_duplicate')
        .update({
          status: 'returned',
        })
        .eq('LR_Threat_Asses_ID', assessmentId)

      if (error) throw error

      // Notify assessor and co-assessor
      const assessorIds = assignments
        .filter(a => a.role === 'assessor' || a.role === 'co-assessor')
        .map(a => a.profiles.id)

      for (const assessorId of assessorIds) {
        await supabase
          .from('notifications')
          .insert({
            user_id: assessorId,
            message: `Your threat assessment "${assessment.LR_Name}" has been returned for revisions. Please check the comments.`,
            type: 'returned',
            read: false,
          })
      }

      router.push('/dashboard/my-assessments')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Assessment Details */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Landrace Name</p>
            <p className="font-medium text-gray-900">{assessment.LR_Name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Crop</p>
            <p className="font-medium text-gray-900">{assessment.Crop}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Assessor</p>
            <p className="font-medium text-gray-900">{assessment.LR_Threat_Assessor}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Assessment Date</p>
            <p className="font-medium text-gray-900">{assessment.Assess_Date}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Threat Score</p>
            <p className="font-medium text-gray-900">{assessment.Threat_Scores} / {assessment.Threat_Max_Score}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Risk %</p>
            <p className="font-medium text-gray-900">{assessment['Threat_Risk_%']}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Category</p>
            <p className="font-medium text-gray-900">{assessment.Threat_Category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              assessment.status === 'approved' ? 'bg-green-100 text-green-800' :
              assessment.status === 'returned' ? 'bg-yellow-100 text-yellow-800' :
              assessment.status === 'pending_review' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {assessment.status === 'approved' ? 'Approved' :
               assessment.status === 'returned' ? 'Returned' :
               assessment.status === 'pending_review' ? 'Pending Review' :
               'Draft'}
            </span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Comments & Feedback</h2>
        
        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No comments yet. Add the first comment below.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900">
                    {comment.profiles?.first_name || comment.profiles?.last_name
                      ? `${comment.profiles.first_name || ''} ${comment.profiles.last_name || ''}`.trim()
                      : comment.profiles?.email || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-gray-700">{comment.comment}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Comment
          </label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            rows={3}
            placeholder="Add your feedback or comments here..."
          />
          <button
            onClick={handleAddComment}
            disabled={isSubmitting || !newComment.trim()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Comment'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Actions</h2>
        <div className="flex gap-4">
          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? 'Processing...' : 'Approve Assessment'}
          </button>
          <button
            onClick={handleReturn}
            disabled={isSubmitting}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? 'Processing...' : 'Return for Revisions'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          <strong>Approve:</strong> Mark this assessment as approved and notify the assessor.<br />
          <strong>Return:</strong> Send back to assessor/co-assessor for revisions based on your comments.
        </p>
      </div>
    </div>
  )
}
