'use client'

export default function TestEnv() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Environment Variables Test</h1>
      <div className="space-y-2">
        <p>
          <strong>Google Maps API Key:</strong>{' '}
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <span className="text-green-600">✓ Present</span>
          ) : (
            <span className="text-red-600">✗ Missing</span>
          )}
        </p>
        <p className="text-sm text-gray-600">
          Key starts with: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.slice(0, 5)}...
        </p>
      </div>
    </div>
  )
} 