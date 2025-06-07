'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrashIcon } from '@heroicons/react/24/outline'
import { BlacklistedCompany } from '@/generated/prisma'

export function Settings() {
  const [blacklistedCompanies, setBlacklistedCompanies] = useState<BlacklistedCompany[]>([])
  const [newCompany, setNewCompany] = useState({ companyName: '', reason: '' })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['blacklistedCompanies'],
    queryFn: async () => {
      const response = await fetch('/api/blacklist')
      if (!response.ok) {
        throw new Error('Failed to fetch blacklisted companies')
      }
      return response.json()
    },
  })

  const addToBlacklist = useMutation({
    mutationFn: async (company: { companyName: string; reason?: string }) => {
      const response = await fetch('/api/blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(company),
      })
      if (!response.ok) {
        throw new Error('Failed to add company to blacklist')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklistedCompanies'] })
      setNewCompany({ companyName: '', reason: '' })
    },
  })

  const removeFromBlacklist = useMutation({
    mutationFn: async (companyId: string) => {
      const response = await fetch(`/api/blacklist/${companyId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to remove company from blacklist')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklistedCompanies'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCompany.companyName.trim()) {
      addToBlacklist.mutate(newCompany)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-black">Blacklisted Companies</h2>
        <p className="mt-1 text-sm text-black">
          Companies added to this list will be excluded from your job search.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-black">Company Name</label>
          <input
            type="text"
            value={newCompany.companyName}
            onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black">Reason (Optional)</label>
          <input
            type="text"
            value={newCompany.reason}
            onChange={(e) => setNewCompany({ ...newCompany, reason: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={addToBlacklist.isPending}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {addToBlacklist.isPending ? 'Adding...' : 'Add to Blacklist'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        {data?.length === 0 ? (
          <p className="text-sm text-black">No companies blacklisted yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {data?.map((company: BlacklistedCompany) => (
              <li key={company.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-black">{company.companyName}</p>
                  {company.reason && (
                    <p className="text-sm text-black">{company.reason}</p>
                  )}
                  <p className="text-xs text-black">Added on {new Date(company.dateAdded).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => removeFromBlacklist.mutate(company.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
} 