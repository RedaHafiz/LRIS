export default function SearchPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Search</h1>
        <p className="text-gray-600 mt-1">
          Search across assessments, projects, and taxonomy
        </p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mt-6 text-center text-gray-500">
          <p>Search functionality coming soon...</p>
        </div>
      </div>
    </div>
  )
}
