'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  name: string
  email: string
}

interface AssessmentMember {
  id: string
  user_id: string
  role: 'assessor' | 'co-assessor' | 'reviewer' | 'spectator'
  profiles: Profile
}

interface AssessmentMembersManagerProps {
  assessmentId: string
  currentUserId: string
  onClose?: () => void
}

export default function AssessmentMembersManager({ 
  assessmentId, 
  currentUserId,
  onClose 
}: AssessmentMembersManagerProps) {
  const supabase = createClient()
  const [members, setMembers] = useState<AssessmentMember[]>([])
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<'assessor' | 'co-assessor' | 'reviewer' | 'spectator'>('co-assessor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMembers()
    loadAllUsers()
  }, [assessmentId])

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
        user_id,
        role,
        profiles (
          id,
          name,
          email
        )
      `)
      .eq('assessment_id', assessmentId)

    if (!error && data) {
      setMembers(data as any)
    }
  }

  const loadAllUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .order('name')

    if (!error && data) {
      setAllUsers(data)
    }
  }

  const addMember = async () => {
    if (!selectedUserId) {
      setError('Please select a user')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: insertError } = await supabase
        .from('assessment_assignments')
        .insert({
          assessment_id: assessmentId,
          user_id: selectedUserId,
          role: selectedRole,
        })

      if (insertError) throw insertError

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedUserId,
          message: `You've been added to an assessment as ${selectedRole}`,
          type: 'assessment_assignment',
        })

      setSelectedUserId('')
      setSelectedRole('co-assessor')
      loadMembers()
    } catch (err: any) {
      setError(err.message || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (memberId: string) => {
    if (!confirm('Remove this member from the assessment?')) return

    const { error } = await supabase
      .from('assessment_assignments')
      .delete()
      .eq('id', memberId)

    if (!error) {
      loadMembers()
    }
  }

  const updateRole = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from('assessment_assignments')
      .update({ role: newRole })
      .eq('id', memberId)

    if (!error) {
      loadMembers()
    }
  }

  const availableUsers = allUsers.filter(
    user => user.id !== currentUserId && !members.some(m => m.user_id === user.id)
  )

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Assessment Team</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add new member */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Invite Member</h3>
        <div className="flex gap-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
          >
            <option value="">Select User</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
          >
            <option value="assessor">Assessor</option>
            <option value="co-assessor">Co-Assessor</option>
            <option value="reviewer">Reviewer</option>
            <option value="spectator">Spectator</option>
          </select>

          <button
            onClick={addMember}
            disabled={loading || !selectedUserId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          <strong>Roles:</strong>
          <ul className="mt-1 space-y-1">
            <li>• <strong>Assessor/Co-Assessor:</strong> Can edit assessment data</li>
            <li>• <strong>Reviewer:</strong> Can review and comment only</li>
            <li>• <strong>Spectator:</strong> Can view and comment only</li>
          </ul>
        </div>
      </div>

      {/* Current members */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Team Members ({members.length})</h3>
        {members.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No team members yet</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{member.profiles.name || member.profiles.email}</p>
                  <p className="text-sm text-gray-500">{member.profiles.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={member.role}
                    onChange={(e) => updateRole(member.id, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                  >
                    <option value="assessor">Assessor</option>
                    <option value="co-assessor">Co-Assessor</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="spectator">Spectator</option>
                  </select>
                  <button
                    onClick={() => removeMember(member.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
