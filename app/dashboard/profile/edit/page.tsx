import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditForm from '@/components/profile/ProfileEditForm'

export default async function EditProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch current profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <ProfileEditForm 
          userId={user.id}
          currentProfile={profile || {}}
        />
      </div>
    </div>
  )
}
