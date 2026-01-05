'use client'

import { useState } from 'react'
import CreateProjectModal from './CreateProjectModal'

export default function CreateProjectButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
      >
        + Create Project
      </button>
      {isOpen && (
        <CreateProjectModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}
