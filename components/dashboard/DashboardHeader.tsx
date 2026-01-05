'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

interface DashboardHeaderProps {
  user: User
  profile: any
}

export default function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0].toUpperCase()

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center flex-1">
        <input
          type="text"
          placeholder="Search projects, assessments..."
          className="w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
      </div>
      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <span className="text-xl">🔔</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg"
          >
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
              {initials}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {profile?.name || user.email}
            </span>
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
