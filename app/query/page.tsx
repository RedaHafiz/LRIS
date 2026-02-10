import Link from 'next/link'
import PassportDataSearch from '@/components/query/PassportDataSearch'

export default function QueryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-green-600 hover:text-green-700 inline-block">
              ← Back to Home
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Go to Threat Assessment Platform
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Landrace Query System
          </h1>
          <p className="text-xl text-gray-600">
            Search and explore passport data for landraces
          </p>
        </div>

        {/* Search Component */}
        <PassportDataSearch />
      </div>
    </div>
  )
}
