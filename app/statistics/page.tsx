import Link from 'next/link'

export default function StatisticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-purple-600 hover:text-purple-700 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Statistics & Analytics
          </h1>
          <p className="text-xl text-gray-600">
            Insights and trends from threat assessment data
          </p>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center max-w-2xl mx-auto">
          <div className="mb-6">
            <svg
              className="w-24 h-24 mx-auto text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
          <p className="text-lg text-gray-600 mb-8">
            Comprehensive statistics and data visualization features are under development.
            You'll soon be able to analyze threat patterns, track assessment trends,
            and generate detailed reports.
          </p>
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-gray-900 text-center mb-4">Planned Features:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span>Threat category distribution charts</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span>Geographic heat maps of at-risk landraces</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span>Temporal trend analysis</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span>Crop-specific threat patterns</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span>Criteria score comparisons</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span>Downloadable statistical reports</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
