import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <div className="relative w-full max-w-2xl h-96">
            <Image
              src="/LRIS (1).png"
              alt="LRIS Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12">
          Landrace Threat Assessment Platform
        </h1>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Threat Assessments */}
          <Link
            href="/login"
            className="group bg-white hover:bg-blue-600 border-2 border-blue-600 rounded-xl p-8 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-blue-600 group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 group-hover:text-white transition-colors mb-2">
              Threat Assessments
            </h2>
            <p className="text-gray-600 group-hover:text-blue-100 transition-colors">
              Access the platform to create and manage landrace threat assessments
            </p>
          </Link>

          {/* Query */}
          <Link
            href="/query"
            className="group bg-white hover:bg-green-600 border-2 border-green-600 rounded-xl p-8 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-green-600 group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 group-hover:text-white transition-colors mb-2">
              Query
            </h2>
            <p className="text-gray-600 group-hover:text-green-100 transition-colors">
              Search and explore existing threat assessment data
            </p>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 text-gray-500 text-sm">
          <p>Preserving agricultural biodiversity for future generations</p>
        </div>
      </div>
    </div>
  )
}
