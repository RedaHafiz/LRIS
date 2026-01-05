import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch project with user's role
  const { data: project, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      project_users!inner(role, user_id)
    `
    )
    .eq('id', id)
    .eq('project_users.user_id', user?.id)
    .single()

  if (error || !project) {
    redirect('/dashboard')
  }

  // Fetch assessments for this project
  const { data: assessments } = await supabase
    .from('Threat Assessments')
    .select(
      `
      *,
      profiles!assessments_assignee_id_fkey(name)
    `
    )
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  // Fetch project members
  const { data: members } = await supabase
    .from('project_users')
    .select('*, profiles(name, email)')
    .eq('project_id', id)

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">
            Projects
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{project.name}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        {project.description && (
          <p className="text-gray-600 mt-2">{project.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assessments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Assessments ({assessments?.length || 0})
              </h2>
              <Link
                href={`/dashboard/projects/${id}/assessments/new`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                + New Assessment
              </Link>
            </div>
            <div className="p-6">
              {assessments && assessments.length > 0 ? (
                <div className="space-y-3">
                  {assessments.map((assessment: any) => (
                    <Link
                      key={assessment.id}
                      href={`/dashboard/assessments/${assessment.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {assessment.common_name || assessment.scientific_name || 'Untitled Assessment'}
                          </h3>
                          {assessment.scientific_name && assessment.common_name && (
                            <p className="text-sm text-gray-600 italic mt-1">
                              {assessment.scientific_name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              assessment.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : assessment.status === 'submitted'
                                ? 'bg-green-100 text-green-800'
                                : assessment.status === 'returned_with_comments'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {assessment.status.replace('_', ' ')}
                          </span>
                          {assessment.profiles && (
                            <span className="text-sm text-gray-600">
                              {assessment.profiles.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No assessments yet.</p>
                  <Link
                    href={`/dashboard/projects/${id}/assessments/new`}
                    className="text-blue-600 hover:underline mt-2 inline-block"
                  >
                    Create your first assessment
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Members */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Team Members ({members?.length || 0})
            </h3>
            <div className="space-y-3">
              {members?.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.profiles?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.profiles?.email}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {member.role.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Project Stats */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Statistics
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessments?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {assessments?.filter((a) => a.status === 'published').length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">
                  {assessments?.filter((a) => a.status === 'in_progress').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
