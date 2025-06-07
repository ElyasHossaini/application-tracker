'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from './Sidebar'
import { JobList } from './JobList'
import { Profile } from './Profile'
import { Settings } from './Settings'
import { CoverLetterGenerator } from './CoverLetterGenerator'

type Tab = 'jobs' | 'profile' | 'settings' | 'cover-letter'

export default function Dashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('jobs')

  return (
    <div className="flex h-screen">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto p-8">
        {activeTab === 'jobs' && <JobList />}
        {activeTab === 'cover-letter' && <CoverLetterGenerator />}
        {activeTab === 'profile' && <Profile />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  )
} 