import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AddPublicationForm from '@/components/publications/AddPublicationForm'

export default async function NewPublicationPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <AddPublicationForm userId={user.id} />
      </div>
    </div>
  )
}
