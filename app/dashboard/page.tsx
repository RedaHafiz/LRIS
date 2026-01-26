import { createClient } from '@/lib/supabase/server'
import AssessmentList from '@/components/assessments/AssessmentList'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch user's assessments
  const { data: assessments } = await supabase
    .from('Threat Assessments')
    .select(`
      *,
      profiles:created_by(name, email)
    `)
    .or(`created_by.eq.${user?.id},assignee_id.eq.${user?.id}`)
    .order('updated_at', { ascending: false })

  // Fetch notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Your threat assessments and recent activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Assessments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">My Assessments</h2>
            </div>
            <div className="p-6">
              <AssessmentList initialAssessments={assessments || []} />
            </div>
          </div>
        </div>

        {/* Sidebar - Notifications */}
        <div>
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {notifications && notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification: any) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg ${
                        notification.read
                          ? 'bg-gray-50'
                          : 'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0"></span>
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No recent activity.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
