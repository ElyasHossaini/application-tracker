'use client'

import { useState } from 'react'
import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import axios from 'axios'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from './Modal'

const jobSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  status: z.enum(['APPLIED', 'REJECTED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'NO_RESPONSE']).default('APPLIED')
})

type JobStatus = z.infer<typeof jobSchema>['status']
type JobFormData = z.infer<typeof jobSchema>

interface Job {
  id: string
  jobTitle: string
  company: string
  applicationDate: string
  status: JobStatus
}

const fetchJobs = async (): Promise<Job[]> => {
  const response = await axios.get('/api/jobs')
  return response.data
}

const createJob = async (data: JobFormData): Promise<Job> => {
  const response = await axios.post('/api/jobs', data)
  return response.data
}

const updateJobStatus = async (jobId: string, status: JobStatus): Promise<Job> => {
  const response = await axios.put('/api/jobs', { id: jobId, status })
  return response.data
}

export function JobList() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
  })

  const { mutate: submitJob, isPending: isSubmitting } = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      setIsModalOpen(false)
      reset()
    },
  })

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: JobStatus }) =>
      updateJobStatus(jobId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      status: 'APPLIED'
    }
  })

  const onSubmit = (data: JobFormData) => {
    submitJob(data)
  }

  const handleStatusChange = (jobId: string, newStatus: JobStatus) => {
    updateStatus({ jobId, status: newStatus })
  }

  const statusColors: Record<JobStatus, string> = {
    APPLIED: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-red-100 text-red-800',
    INTERVIEW_SCHEDULED: 'bg-green-100 text-green-800',
    OFFER_RECEIVED: 'bg-purple-100 text-purple-800',
    NO_RESPONSE: 'bg-gray-100 text-black',
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading jobs</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-black">Job Applications</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          New Application
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <BriefcaseIcon className="mx-auto h-12 w-12 text-black" />
          <h3 className="mt-2 text-sm font-semibold text-black">No applications</h3>
          <p className="mt-1 text-sm text-black">
            Start by adding your first job application.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <li key={job.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-black">{job.jobTitle}</h3>
                    <div className="mt-2 flex items-center text-sm text-black">
                      <BuildingOfficeIcon className="mr-1.5 h-5 w-5 flex-shrink-0" />
                      {job.company}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-black">
                      <CalendarIcon className="mr-1.5 h-5 w-5 flex-shrink-0" />
                      Applied on {new Date(job.applicationDate).toLocaleDateString()}
                    </div>
                  </div>
                  <select
                    value={job.status}
                    onChange={(e) => handleStatusChange(job.id, e.target.value as JobStatus)}
                    className={`ml-4 px-2.5 py-1 rounded text-sm font-medium ${statusColors[job.status]} border-0 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                    <option value="OFFER_RECEIVED">Offer Received</option>
                    <option value="NO_RESPONSE">No Response</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Job Application"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black">Job Title</label>
            <input
              type="text"
              {...register('jobTitle')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            {errors.jobTitle && (
              <p className="mt-1 text-sm text-red-600">{errors.jobTitle.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-black">Company</label>
            <input
              type="text"
              {...register('company')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            {errors.company && (
              <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              {isSubmitting ? 'Submitting...' : 'Add Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
} 