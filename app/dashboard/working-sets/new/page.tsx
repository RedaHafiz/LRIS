'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CreateProjectModal from '@/components/projects/CreateProjectModal'

export default function NewWorkingSetPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <CreateProjectModal 
        isOpen={true} 
        onClose={() => router.push('/dashboard/working-sets')} 
      />
    </div>
  )
}
