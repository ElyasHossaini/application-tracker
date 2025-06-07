'use client'

import { useSearchParams } from 'next/navigation'

const errorMessages: Record<string, string> = {
  OAuthAccountNotLinked: 'This email is already associated with a different sign-in method. Please use your original sign-in method.',
  UseGoogleToSignIn: 'This account was created with Google. Please sign in with Google instead.',
  AccountLinkingFailed: 'Failed to link your Google account. Please try again or contact support.',
  Default: 'There was an error signing in. Please try again.',
}

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-black">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-black">
            {errorMessage}
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <a
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 