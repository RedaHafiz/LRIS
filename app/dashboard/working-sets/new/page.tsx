import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreateWorkingSetForm from '@/components/working-sets/CreateWorkingSetForm'

export default async function NewWorkingSetPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="p-8">
      <CreateWorkingSetForm userId={user.id} />
    </div>
  )
}
