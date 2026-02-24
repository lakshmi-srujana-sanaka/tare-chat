'use client'

import { useQuery, useMutation } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import Image from 'next/image'
import { Search, Users, MessageCircle } from 'lucide-react'
import { useTheme } from './ChatApp'

interface SidebarProps {
  currentUserId: string
  onSelectConversation: (id: string) => void
}

export function Sidebar({ currentUserId, onSelectConversation }: SidebarProps) {
  const { isDark } = useTheme()
  const users = useQuery(api.users.getUsers)
  const conversations = useQuery(api.conversations.getConversations, { userId: currentUserId as any })
  const createConversation = useMutation(api.conversations.createConversation)
  const markAsRead = useMutation(api.conversations.markAsRead)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'conversations'>('users')
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')

  const filteredUsers = users?.filter(u => u._id !== currentUserId && u.name.toLowerCase().includes(search.toLowerCase()))

  const handleUserClick = async (userId: string) => {
    if (creatingGroup) {
      if (selectedUsers.includes(userId)) {
        setSelectedUsers(selectedUsers.filter(id => id !== userId))
      } else {
        setSelectedUsers([...selectedUsers, userId])
      }
    } else {
      const convId = await createConversation({
        participants: [currentUserId as any, userId as any],
        isGroup: false,
      })
      onSelectConversation(convId)
    }
  }

  const handleCreateGroup = async () => {
    if (selectedUsers.length > 0 && groupName.trim()) {
      const convId = await createConversation({
        participants: [currentUserId as any, ...selectedUsers as any],
        isGroup: true,
        name: groupName.trim(),
      })
      onSelectConversation(convId)
      setCreatingGroup(false)
      setSelectedUsers([])
      setGroupName('')
    }
  }

  return (
    <div className={`w-80 border-r flex flex-col ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex space-x-1 mb-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center p-2 rounded-md text-sm font-medium ${
              activeTab === 'users' 
                ? isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                : `${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex-1 flex items-center justify-center p-2 rounded-md text-sm font-medium ${
              activeTab === 'conversations' 
                ? isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                : `${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
            }`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chats
          </button>
        </div>
        {activeTab === 'users' && (
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>
        )}
        {activeTab === 'users' && !creatingGroup && (
          <button
            onClick={() => setCreatingGroup(true)}
            className="w-full mt-2 p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            New Group
          </button>
        )}
        {creatingGroup && (
          <div className="mt-2">
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className={`w-full p-2 border rounded-md mb-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
            <button
              onClick={handleCreateGroup}
              disabled={selectedUsers.length === 0 || !groupName.trim()}
              className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
            >
              Create Group ({selectedUsers.length})
            </button>
            <button
              onClick={() => { setCreatingGroup(false); setSelectedUsers([]); setGroupName(''); }}
              className={`w-full mt-1 p-2 text-white rounded-md ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-500 hover:bg-gray-600'}`}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <div className={`flex-1 overflow-y-auto ${isDark ? 'bg-gray-900' : ''}`}>
        {activeTab === 'users' ? (
          <>
            {filteredUsers?.length ? (
              filteredUsers.map(u => (
                <div
                  key={u._id}
                  className={`p-3 border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} cursor-pointer flex items-center`}
                  onClick={() => handleUserClick(u._id)}
                >
                  {creatingGroup && (
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u._id)}
                      onChange={() => {}} // Handled by onClick
                      className="mr-2"
                    />
                  )}
                  <div className="relative">
                    <Image
                      src={u.imageUrl || '/default-avatar.png'}
                      alt={u.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    {u.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`font-medium ${isDark ? 'text-gray-100' : ''}`}>{u.name}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{u.isOnline ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className={`p-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Users className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                No users found
              </div>
            )}
          </>
        ) : (
          <>
            {conversations?.length ? (
              conversations.map(c => (
                <div
                  key={c._id}
                  className={`p-3 border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} cursor-pointer flex items-center`}
                  onClick={() => onSelectConversation(c._id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isDark ? 'bg-blue-900' : 'bg-blue-100'}`}>
                    <MessageCircle className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    {c.isGroup ? (
                      <>
                        <p className={`font-medium ${isDark ? 'text-gray-100' : ''}`}>{c.name || 'Group Chat'}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {c.participants.length} members
                        </p>
                      </>
                    ) : (
                      (() => {
                        const otherUserId = c.participants.find(p => p !== currentUserId)
                        const otherUser = users?.find(u => u._id === otherUserId)
                        return (
                          <>
                            <p className={`font-medium ${isDark ? 'text-gray-100' : ''}`}>{otherUser?.name || 'Unknown User'}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {c.lastMessageContent ? c.lastMessageContent.substring(0, 30) + (c.lastMessageContent.length > 30 ? '...' : '') : 'No messages yet'}
                            </p>
                          </>
                        )
                      })()
                    )}
                  </div>
                  {c.unreadCount > 0 && (
                    <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {c.unreadCount}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className={`p-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <MessageCircle className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                No conversations yet
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}