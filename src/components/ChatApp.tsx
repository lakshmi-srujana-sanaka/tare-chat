'use client'

import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { ChatArea } from './ChatArea'

export function ChatApp() {
  const { user } = useUser()
  const syncUser = useMutation(api.users.syncUser)
  const setOnline = useMutation(api.users.setOnline)
  const markAsRead = useMutation(api.conversations.markAsRead)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)

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
    <div className="flex h-screen bg-white">
      <Sidebar
        currentUserId={currentUserId}
        onSelectConversation={handleSelectConversation}
      />
      {selectedConversation ? (
        <ChatArea conversationId={selectedConversation} currentUserId={currentUserId} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Welcome to Tars Chat</h2>
            <p className="text-gray-500">Select a user or conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  )
}