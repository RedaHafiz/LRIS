import { createClient } from '@/lib/supabase/server'

export default async function NotificationsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-1">
          Stay updated with your assignments and project changes
        </p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg ${
                    notification.read
                      ? 'bg-white border-gray-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="ml-4 w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No notifications yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
