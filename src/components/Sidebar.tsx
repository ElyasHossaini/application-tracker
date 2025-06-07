'use client'

import { useSession, signOut } from 'next-auth/react'
import {
  HomeIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

type Tab = 'jobs' | 'profile' | 'settings' | 'cover-letter'

interface SidebarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { data: session } = useSession()

  const tabs = [
    { id: 'jobs' as Tab, name: 'Jobs', icon: HomeIcon },
    { id: 'cover-letter' as Tab, name: 'Cover Letter', icon: DocumentTextIcon },
    { id: 'profile' as Tab, name: 'Profile', icon: UserCircleIcon },
    { id: 'settings' as Tab, name: 'Settings', icon: Cog6ToothIcon },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-8">
          <img
            src={session?.user?.image || '/default-avatar.png'}
            alt="Profile"
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h2 className="font-semibold text-black">{session?.user?.name}</h2>
            <p className="text-sm text-black">{session?.user?.email}</p>
          </div>
        </div>

        <nav className="flex-1">
          <ul className="space-y-2">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-black hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-2 text-black hover:bg-gray-50 rounded-lg"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  )
} 