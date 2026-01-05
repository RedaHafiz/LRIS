import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function WorkingSetsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's working sets
  const { data: workingSets } = await supabase
    .from('projects')
    .select(`
      *,
      project_users!inner (
        role
      )
    `)
    .eq('project_users.user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Working Sets</h1>
          <p className="text-gray-600 mt-1">
            Organize and group multiple threat assessments
          </p>
        </div>
        <Link
          href="/dashboard/working-sets/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Working Set
        </Link>
      </div>

      {!workingSets || workingSets.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No working sets yet</p>
          <Link
            href="/dashboard/working-sets/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Working Set
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workingSets.map((workingSet: any) => (
            <Link
              key={workingSet.id}
              href={`/dashboard/working-sets/${workingSet.id}`}
              className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {workingSet.name}
              </h3>
              {workingSet.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {workingSet.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Role: <span className="font-medium capitalize">{workingSet.project_users[0]?.role}</span>
                </span>
                <span>
                  {new Date(workingSet.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
