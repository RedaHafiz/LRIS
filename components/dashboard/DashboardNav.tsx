'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const mainNavItems = [
  { name: 'Home', href: '/dashboard' },
]

const workspaceNavItems = [
  { name: 'My assessments', href: '/dashboard/my-assessments' },
  { name: 'Threat Assessment Database', href: '/dashboard/assessments' },
  { name: 'Taxonomy', href: '/dashboard/taxonomy' },
  { name: 'Publications', href: '/dashboard/publications' },
]

export default function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">
          Threat Assessment
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Main Section */}
        <div>
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Workspace Section */}
        <div>
          <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Workspace
          </h3>
          <div className="space-y-1">
            {workspaceNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg transition-colors hover:bg-gray-50"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
