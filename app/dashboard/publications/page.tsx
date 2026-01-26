import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PublicationsTable from '@/components/publications/PublicationsTable'

export default async function PublicationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch publications with comments count
  const { data: publications } = await supabase
    .from('publications')
    .select(`
      *,
      profiles!publications_added_by_fkey (
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Publications</h1>
          <p className="text-gray-600 mt-1">
            Scientific publications related to landrace threat assessments
          </p>
        </div>
        <Link
          href="/dashboard/publications/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Publication
        </Link>
      </div>

      <PublicationsTable 
        publications={publications || []} 
        currentUserId={user.id}
      />
    </div>
  )
}
