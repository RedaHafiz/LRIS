'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Comment {
  id: string
  user_id: string
  comment: string
  created_at: string
  profiles: {
    name: string
    email: string
  }
}

interface AssessmentReviewPanelProps {
  assessmentId: string
  currentUserId: string
  currentUserRole: 'assessor' | 'co-assessor' | 'reviewer' | 'spectator'
  currentStatus: 'draft' | 'pending_review' | 'returned' | 'approved'
  onStatusChange?: () => void
}

export default function AssessmentReviewPanel({
  assessmentId,
  currentUserId,
  currentUserRole,
  currentStatus,
  onStatusChange,
}: AssessmentReviewPanelProps) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadComments()
  }, [assessmentId])

  const loadComments = async () => {
    const { data, error } = await supabase
      .from('assessment_comments')
      .select(`
        id,
        user_id,
        comment,
        created_at,
        profiles (
          name,
          email
        )
      `)
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setComments(data as any)
    }
  }

  const addComment = async () => {
    if (!newComment.trim()) return

    setLoading(true)
    setError('')

    try {
      const { error: insertError } = await supabase
        .from('assessment_comments')
        .insert({
          assessment_id: assessmentId,
          user_id: currentUserId,
          comment: newComment.trim(),
        })

      if (insertError) throw insertError

      setNewComment('')
      loadComments()
    } catch (err: any) {
      setError(err.message || 'Failed to add comment')
    } finally {
      setLoading(false)
    }
  }

  const submitForReview = async () => {
    if (!confirm('Submit this assessment for review?')) return

    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('Threat Assessments')
        .update({
          status: 'pending_review',
          submitted_for_review_at: new Date().toISOString(),
        })
        .eq('id', assessmentId)

      if (updateError) throw updateError

      // Notify reviewers
      const { data: reviewers } = await supabase
        .from('assessment_assignments')
        .select('user_id')
        .eq('assessment_id', assessmentId)
        .eq('role', 'reviewer')

      if (reviewers && reviewers.length > 0) {
        await supabase
          .from('notifications')
          .insert(
            reviewers.map((r) => ({
              user_id: r.user_id,
              message: 'An assessment has been submitted for your review',
              type: 'review_requested',
            }))
          )
      }

      onStatusChange?.()
    } catch (err: any) {
      setError(err.message || 'Failed to submit for review')
    } finally {
      setLoading(false)
    }
  }

  const returnToAssessor = async () => {
    if (!confirm('Return this assessment to the assessor for revisions?')) return

    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('Threat Assessments')
        .update({
          status: 'returned',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUserId,
        })
        .eq('id', assessmentId)

      if (updateError) throw updateError

      // Notify assessors
      const { data: assessors } = await supabase
        .from('assessment_assignments')
        .select('user_id')
        .eq('assessment_id', assessmentId)
        .in('role', ['assessor', 'co-assessor'])

      if (assessors && assessors.length > 0) {
        await supabase
          .from('notifications')
          .insert(
            assessors.map((a) => ({
              user_id: a.user_id,
              message: 'Your assessment has been returned for revisions',
              type: 'review_returned',
            }))
          )
      }

      onStatusChange?.()
    } catch (err: any) {
      setError(err.message || 'Failed to return assessment')
    } finally {
      setLoading(false)
    }
  }

  const approveAssessment = async () => {
    if (!confirm('Approve this assessment? This action marks it as complete.')) return

    setLoading(true)
    setError('')

    try {
      // Get reviewer's name
      const { data: reviewerProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', currentUserId)
        .single()

      const reviewerName = reviewerProfile?.name || reviewerProfile?.email || 'Unknown Reviewer'
      const reviewDate = new Date().toISOString().split('T')[0]

      const { error: updateError } = await supabase
        .from('Threat Assessments')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUserId,
          LR_Threat_Reviewer: reviewerName,
          Review_Date: reviewDate,
        })
        .eq('id', assessmentId)

      if (updateError) throw updateError

      // Notify assessors
      const { data: assessors } = await supabase
        .from('assessment_assignments')
        .select('user_id')
        .eq('assessment_id', assessmentId)
        .in('role', ['assessor', 'co-assessor'])

      if (assessors && assessors.length > 0) {
        await supabase
          .from('notifications')
          .insert(
            assessors.map((a) => ({
              user_id: a.user_id,
              message: 'Your assessment has been approved!',
              type: 'review_approved',
            }))
          )
      }

      onStatusChange?.()
    } catch (err: any) {
      setError(err.message || 'Failed to approve assessment')
    } finally {
      setLoading(false)
    }
  }

  const canEdit = currentUserRole === 'assessor' || currentUserRole === 'co-assessor'
  const isReviewer = currentUserRole === 'reviewer'
  const canSubmit = canEdit && (currentStatus === 'draft' || currentStatus === 'returned')
  const canReview = isReviewer && currentStatus === 'pending_review'

  const getStatusBadge = () => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      returned: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
    }

    const labels = {
      draft: 'Draft',
      pending_review: 'Pending Review',
      returned: 'Returned for Revision',
      approved: 'Approved',
    }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[currentStatus]}`}>
        {labels[currentStatus]}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Review & Comments</h3>
        {getStatusBadge()}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex gap-3">
        {canSubmit && (
          <button
            onClick={submitForReview}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Submit for Review
          </button>
        )}

        {canReview && (
          <>
            <button
              onClick={returnToAssessor}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              Return to Assessor
            </button>
            <button
              onClick={approveAssessment}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Approve Assessment
            </button>
          </>
        )}
      </div>

      {/* Comments Section */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Comments ({comments.length})</h4>

        {/* Add Comment */}
        <div className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            rows={3}
            placeholder="Add a comment..."
          />
          <button
            onClick={addComment}
            disabled={loading || !newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post Comment
          </button>
        </div>

        {/* Comments List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      {comment.profiles.name || comment.profiles.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
