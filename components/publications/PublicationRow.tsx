'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function PublicationRow({ publication, currentUserId, isExpanded, onToggleExpand }: any) {
  const supabase = createClient()
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isExpanded) {
      loadComments()
    }
  }, [isExpanded])

  const loadComments = async () => {
    const { data } = await supabase
      .from('publication_comments')
      .select(`
        *,
        profiles (name, email)
      `)
      .eq('publication_id', publication.id)
      .order('created_at', { ascending: true })

    if (data) setComments(data)
  }

  const addComment = async () => {
    if (!newComment.trim()) return

    setLoading(true)
    await supabase
      .from('publication_comments')
      .insert({
        publication_id: publication.id,
        user_id: currentUserId,
        comment: newComment.trim(),
      })

    setNewComment('')
    loadComments()
    setLoading(false)
  }

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-900">{publication.title}</div>
          {publication.doi && (
            <div className="text-xs text-gray-500 mt-1">DOI: {publication.doi}</div>
          )}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">{publication.authors}</td>
        <td className="px-6 py-4 text-sm text-gray-900">{publication.journal || '-'}</td>
        <td className="px-6 py-4 text-sm text-gray-900">{publication.year || '-'}</td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {publication.profiles?.name || publication.profiles?.email}
        </td>
        <td className="px-6 py-4 text-sm">
          <div className="flex gap-2">
            <button
              onClick={onToggleExpand}
              className="text-blue-600 hover:text-blue-800"
            >
              {isExpanded ? 'Hide' : 'View'}
            </button>
            {publication.file_url && (
              <a
                href={publication.file_url}
                download={publication.file_name}
                className="text-green-600 hover:text-green-800"
              >
                Download
              </a>
            )}
            {publication.url && (
              <a
                href={publication.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800"
              >
                Link
              </a>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-6 py-4 bg-gray-50">
            <div className="space-y-4">
              {publication.abstract && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Abstract</h4>
                  <p className="text-gray-700 text-sm">{publication.abstract}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Comments ({comments.length})</h4>
                <div className="space-y-3 mb-4">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="bg-white p-3 rounded border border-gray-200">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {comment.profiles.name || comment.profiles.email}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.comment}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                    onKeyPress={(e) => e.key === 'Enter' && addComment()}
                  />
                  <button
                    onClick={addComment}
                    disabled={loading || !newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
