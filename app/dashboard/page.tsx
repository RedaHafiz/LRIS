import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CreateProjectButton from '@/components/projects/CreateProjectButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch user's projects
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      project_users!inner(role)
    `)
    .eq('project_users.user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage your threat assessment projects
          </p>
        </div>
        <CreateProjectButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects && projects.length > 0 ? (
          projects.map((project: any) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {project.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {project.description || 'No description'}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                  {project.project_users[0]?.role.replace('_', ' ')}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <p className="text-gray-500 mb-4">
              No projects yet. Create your first project to get started.
            </p>
            <CreateProjectButton />
          </div>
        )}
      </div>
    </div>
  )
}
