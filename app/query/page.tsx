import Link from 'next/link'

export default function QueryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-green-600 hover:text-green-700 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Query System
          </h1>
          <p className="text-xl text-gray-600">
            Search and explore threat assessment data
          </p>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center max-w-2xl mx-auto">
          <div className="mb-6">
            <svg
              className="w-24 h-24 mx-auto text-green-600"
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
          <p className="text-lg text-gray-600 mb-8">
            Advanced search and query capabilities are currently under development.
            You'll soon be able to search assessments by landrace, crop, threat category,
            location, and more.
          </p>
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-gray-900 text-center mb-4">Planned Features:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Full-text search across all assessment fields</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Advanced filtering by criteria scores</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Geographic and taxonomic search</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Export search results to CSV/Excel</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
