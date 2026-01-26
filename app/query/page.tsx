import Link from 'next/link'
import PassportDataSearch from '@/components/query/PassportDataSearch'

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
