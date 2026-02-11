import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile data
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching profile:', error)
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading profile: {error.message}
        </div>
      </div>
    )
  }

  if (!profile) {
    notFound()
  }

  // Get current date/time in user's timezone
  const userTimeZone = profile.time_zone || 'UTC'
  const currentDateTime = new Date().toLocaleString('en-US', {
    timeZone: userTimeZone,
    dateStyle: 'full',
    timeStyle: 'long',
  })

  const joinedDate = new Date(profile.date_joined).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const isOwnProfile = user.id === params.id

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isOwnProfile ? 'Your Profile' : 'Member Profile'}
          </h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-12">
            <div className="flex items-center">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile avatar" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-white"
                />
              ) : (
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-blue-600">
                  {profile.first_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                </div>
              )}
              <div className="ml-6 text-white">
                <h2 className="text-3xl font-bold">
                  {profile.first_name || profile.last_name 
                    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
                    : 'Anonymous'}
                </h2>
                <p className="text-blue-100 mt-1">{profile.email}</p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="px-8 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Organization */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Organization
                </label>
                <p className="text-lg text-gray-900">
                  {profile.organization || 'Not specified'}
                </p>
              </div>

              {/* Member Since */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Member Since
                </label>
                <p className="text-lg text-gray-900">{joinedDate}</p>
              </div>

              {/* Time Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Time Zone
                </label>
                <p className="text-lg text-gray-900">{userTimeZone}</p>
              </div>

              {/* Current Date/Time */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Current Local Time
                </label>
                <p className="text-lg text-gray-900">{currentDateTime}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-200 flex gap-3">
              {isOwnProfile && (
                <Link
                  href="/dashboard/profile/edit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Profile
                </Link>
              )}
              <Link
                href="/dashboard/publications"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                View Publications
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> All platform members can view your profile information.
            {isOwnProfile && ' You can edit your details by clicking "Edit Profile" above.'}
          </p>
        </div>
      </div>
    </div>
  )
}
