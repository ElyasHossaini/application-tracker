import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function CoverLetterGenerator() {
  const [jobDescription, setJobDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [error, setError] = useState('')

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await axios.get('/api/profile')
      return response.data
    }
  })

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await axios.post('/api/generate-cover-letter', {
        jobDescription,
        profile
      })
      setCoverLetter(response.data.coverLetter)
    } catch (err) {
      setError('Failed to generate cover letter. Please try again.')
      console.error('Error generating cover letter:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <h2 className="text-xl font-semibold text-black">Auto Cover Letter Generator</h2>
      
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Job Description
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Paste the job description here..."
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`px-4 py-2 rounded-md text-white ${
            isGenerating
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
        </button>
      </div>

      {coverLetter && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-black">Generated Cover Letter</h3>
            <button
              onClick={handleCopy}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Copy to Clipboard
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <pre className="whitespace-pre-wrap text-sm text-black">{coverLetter}</pre>
          </div>
        </div>
      )}
    </div>
  )
} 