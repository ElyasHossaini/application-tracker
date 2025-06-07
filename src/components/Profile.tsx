'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DocumentIcon } from '@heroicons/react/24/outline'
import { AutocompleteInput } from './AutocompleteInput'
import { LocationAutocomplete } from './LocationAutocomplete'
import { jobTitles } from '@/lib/jobTitles'
import { GooglePlacesScript } from './GooglePlacesScript'

const profileSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  jobTitles: z.string().min(1, 'At least one job title is required'),
  isRemoteOnly: z.boolean(),
  minSalary: z.string().optional(),
  maxSalary: z.string().optional(),
  linkedInProfile: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  indeedProfile: z.string().url('Invalid Indeed URL').optional().or(z.literal('')),
  githubProfile: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface Profile {
  location: string
  resumeUrl?: string
  linkedInProfile?: string
  indeedProfile?: string
  githubProfile?: string
  jobPreferences?: {
    jobTitles: string[]
    isRemoteOnly: boolean
    minSalary?: number
    maxSalary?: number
  }
}

const fetchProfile = async (): Promise<Profile> => {
  const response = await axios.get('/api/profile')
  return response.data
}

const updateProfile = async (data: ProfileFormData): Promise<Profile> => {
  const formattedData = {
    ...data,
    jobTitles: data.jobTitles.split(',').map(title => title.trim()),
    minSalary: data.minSalary ? parseInt(data.minSalary) : undefined,
    maxSalary: data.maxSalary ? parseInt(data.maxSalary) : undefined,
  }

  const response = await axios.put('/api/profile', formattedData)
  return response.data
}

const uploadResume = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export function Profile() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [locationValue, setLocationValue] = useState('')
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const jobTitlesValue = watch('jobTitles')

  const { data: profile, error: fetchError } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await axios.get<Profile>('/api/profile')
      return response.data
    },
    retry: false,
  })

  useEffect(() => {
    if (profile) {
      reset({
        location: profile.location || '',
        jobTitles: profile.jobPreferences?.jobTitles?.join(', ') || '',
        isRemoteOnly: profile.jobPreferences?.isRemoteOnly || false,
        minSalary: profile.jobPreferences?.minSalary?.toString() || '',
        maxSalary: profile.jobPreferences?.maxSalary?.toString() || '',
        linkedInProfile: profile.linkedInProfile || '',
        indeedProfile: profile.indeedProfile || '',
        githubProfile: profile.githubProfile || '',
      })
      setLocationValue(profile.location || '')
    }
  }, [profile, reset])

  const { mutate: submitProfile, isPending: isSaving } = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setSaveStatus({ type: 'success', message: 'Profile saved successfully!' })
      setTimeout(() => setSaveStatus(null), 3000)
    },
    onError: (error) => {
      console.error('Save error:', error)
      setSaveStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to save profile. Please try again.' 
      })
      setTimeout(() => setSaveStatus(null), 5000)
    }
  })

  const { mutate: submitResume } = useMutation({
    mutationFn: uploadResume,
    onSuccess: async (data) => {
      await axios.put('/api/profile', { resumeUrl: data.url })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setIsUploading(false)
    },
    onError: () => {
      setIsUploading(false)
    },
  })

  const onSubmit = (data: ProfileFormData) => {
    submitProfile(data)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadStatus(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setUploadStatus({ type: 'success', message: 'Resume uploaded successfully!' })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    } catch (error) {
      setUploadStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to upload resume' 
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <GooglePlacesScript />
      <h1 className="text-2xl font-semibold text-black mb-6">Profile Settings</h1>

      {saveStatus && (
        <div className={`mb-4 p-4 rounded-lg ${
          saveStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {saveStatus.message}
        </div>
      )}

      {fetchError instanceof Error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
          {fetchError.message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black">Resume</label>
            <div className="mt-1 flex flex-col space-y-3">
              <div className="flex items-center">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="resume-upload"
                  className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploading ? 'Uploading...' : 'Upload Resume'}
                </label>
              </div>
              
              {profile?.resumeUrl && (
                <div className="flex items-center">
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                  >
                    <DocumentIcon className="h-5 w-5 mr-2" />
                    View Uploaded Resume
                  </a>
                  <span className="ml-2 text-sm text-gray-500">
                    (Opens in new tab)
                  </span>
                </div>
              )}
            </div>
            {uploadStatus && (
              <div className={`mt-2 text-sm ${
                uploadStatus.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {uploadStatus.message}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-black">Location</label>
            <LocationAutocomplete
              value={locationValue}
              onChange={(value) => {
                setLocationValue(value)
                setValue('location', value)
              }}
              placeholder="Enter a city name..."
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-black">Job Titles</label>
            <AutocompleteInput
              value={jobTitlesValue || ''}
              onChange={(value) => setValue('jobTitles', value)}
              suggestions={jobTitles}
              label="Job Titles"
              placeholder="Enter job titles (comma-separated)"
            />
            {errors.jobTitles && (
              <p className="mt-1 text-sm text-red-600">{errors.jobTitles.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Separate multiple titles with commas
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('isRemoteOnly')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-black">Remote jobs only</label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black">Min Salary</label>
              <input
                type="number"
                step="5000"
                {...register('minSalary')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black">Max Salary</label>
              <input
                type="number"
                step="5000"
                {...register('maxSalary')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black">LinkedIn Profile</label>
            <input
              type="url"
              placeholder="https://www.linkedin.com/in/your-profile"
              {...register('linkedInProfile')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.linkedInProfile && (
              <p className="mt-1 text-sm text-red-600">{errors.linkedInProfile.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Enter the full URL to your LinkedIn profile
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-black">GitHub Profile</label>
            <input
              type="url"
              placeholder="https://github.com/your-username"
              {...register('githubProfile')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.githubProfile && (
              <p className="mt-1 text-sm text-red-600">{errors.githubProfile.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Enter the full URL to your GitHub profile
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-black">Indeed Profile</label>
            <input
              type="url"
              placeholder="https://my.indeed.com/p/your-profile"
              {...register('indeedProfile')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.indeedProfile && (
              <p className="mt-1 text-sm text-red-600">{errors.indeedProfile.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Enter the full URL to your Indeed profile
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 