'use client'

import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useUser } from '@clerk/nextjs'
import { useState, useEffect, createContext, useContext } from 'react'
import { Sidebar } from './Sidebar'
import { ChatArea } from './ChatArea'

interface ThemeContextType {
  isDark: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export function ChatApp() {
  const { user } = useUser()
  const syncUser = useMutation(api.users.syncUser)
  const setOnline = useMutation(api.users.setOnline)
  const markAsRead = useMutation(api.conversations.markAsRead)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(false)

  // Initialize dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = saved ? saved === 'dark' : prefersDark
    setIsDark(shouldBeDark)
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    setIsDark(!isDark)
    if (!isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id)
  }

  useEffect(() => {
    if (user) {
      syncUser({
        clerkId: user.id,
        name: user.fullName || user.username || 'Anonymous',
        imageUrl: user.imageUrl || '',
        email: user.primaryEmailAddress?.emailAddress || '',
      }).then((id) => {
        setCurrentUserId(id)
        setOnline({ clerkId: user.id, online: true })
      })
    }
  }, [user, syncUser, setOnline])

  if (!currentUserId) return <div>Loading...</div>

  return (
    <ThemeContext.Provider value={{ isDark, toggleDarkMode }}>
      <div className={`flex h-screen ${isDark ? 'dark' : ''}`}>
        <div className="flex h-screen w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Sidebar
            currentUserId={currentUserId}
            onSelectConversation={handleSelectConversation}
          />
          {selectedConversation ? (
            <ChatArea conversationId={selectedConversation} currentUserId={currentUserId} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Welcome to Tars Chat</h2>
                <p className="text-gray-500 dark:text-gray-400">Select a user or conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ThemeContext.Provider>
  )
}