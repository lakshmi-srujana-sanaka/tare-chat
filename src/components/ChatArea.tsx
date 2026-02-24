'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Send, Trash2, MessageCircle, ChevronDown, Copy, Smile, Edit2, X, Search, Moon, Sun, Check } from 'lucide-react'
import { useTheme } from './ChatApp'

interface ChatAreaProps {
  conversationId: string
  currentUserId: string
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢']

const EMOJI_GRID = ['👍', '❤️', '😂', '😮', '😢', '😍', '🤔', '😎', '🎉', '🚀', '💯', '🔥', '✨', '👏', '😇', '😜', '😭', '🤩', '😱', '🤣', '😴', '👻', '🎈', '🌟', '💪', '👋', '🙏', '😌', '😳', '🤗']

export function ChatArea({ conversationId, currentUserId }: ChatAreaProps) {
  const messages = useQuery(api.messages.getMessages, { conversationId })
  const allUsers = useQuery(api.users.getUsers)
  const conversation = useQuery(api.conversations.getConversation, { id: conversationId })
  const typingUsers = useQuery(api.typing.getTypingUsers, { conversationId })
  const sendMessage = useMutation(api.messages.sendMessage)
  const deleteMessage = useMutation(api.messages.deleteMessage)
  const updateMessage = useMutation(api.messages.updateMessage)
  const setTyping = useMutation(api.typing.setTyping)
  const markAsRead = useMutation(api.conversations.markAsRead)
  const addReaction = useMutation(api.messages.addReaction)
  const { isDark, toggleDarkMode } = useTheme()

  const [messageInput, setMessageInput] = useState('')
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showNewMessages, setShowNewMessages] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [showReactMenu, setShowReactMenu] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [searchResultIndex, setSearchResultIndex] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Scroll tracking
  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const atBottom = scrollTop + clientHeight >= scrollHeight - 20
    setIsAtBottom(atBottom)
    if (atBottom && conversation) markAsRead({ conversationId, userId: currentUserId })
  }

  // Auto scroll & new message badge
  useEffect(() => {
    if (!messages) return

    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setShowNewMessages(false)
      if (conversation) markAsRead({ conversationId, userId: currentUserId })
    } else {
      setShowNewMessages(messages.some(m => m.senderId !== currentUserId))
    }
  }, [messages, isAtBottom, conversation])

  // Handle input change + typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value)
    setTyping({ conversationId, userId: currentUserId, isTyping: true })

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setTyping({ conversationId, userId: currentUserId, isTyping: false })
    }, 1500)
  }

  const handleSend = async () => {
    if (!messageInput.trim()) return
    await sendMessage({
      conversationId,
      senderId: currentUserId,
      content: messageInput.trim(),
      replyTo: replyingTo?._id || undefined,
    })
    setMessageInput('')
    setReplyingTo(null)
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setTyping({ conversationId, userId: currentUserId, isTyping: false })
  }

  const toggleMenu = (messageId: string) =>
    setOpenMenu(openMenu === messageId ? null : messageId)

  const handleDelete = async (messageId: string) => {
    await deleteMessage({ messageId, userId: currentUserId })
    setOpenMenu(null)
  }

  const handleReply = (message: any) => {
    setReplyingTo(message)
    setOpenMenu(null)
  }

  const handleEdit = (message: any) => {
    setEditingId(message._id)
    setEditingContent(message.content)
    setOpenMenu(null)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editingContent.trim()) return
    await updateMessage({ messageId: editingId, content: editingContent.trim(), userId: currentUserId })
    setEditingId(null)
    setEditingContent('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingContent('')
  }

  const handleReact = (messageId: string, emoji: string) => {
    addReaction({ messageId, emoji, userId: currentUserId })
    setShowReactMenu(null)
    setOpenMenu(null)
  }

  const formatTimestamp = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const groupMessagesByDate = (msgs: any[]) => {
    const groups: { [key: string]: any[] } = {}
    msgs.forEach(msg => {
      const date = new Date(msg.timestamp)
      const label = date.toDateString()
      if (!groups[label]) groups[label] = []
      groups[label].push(msg)
    })
    return groups
  }

  const filteredMessages = messages?.filter(m => {
    if (!searchQuery.trim()) return true
    return m.content.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const searchResults = messages
    ?.filter(m => !m.isDeleted && m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.timestamp - a.timestamp) || []

  const currentSearchResult = searchQuery ? searchResults[searchResultIndex] : null

  const searchResultsCount = searchResults.length

  const goToPreviousMatch = () => {
    if (searchResults.length === 0) return
    setSearchResultIndex((prev) => (prev + 1) % searchResults.length)
  }

  const goToNextMatch = () => {
    if (searchResults.length === 0) return
    setSearchResultIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length)
  }

  return (
    <div className={`flex-1 flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Chat Header */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {showSearch && (
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSearchResultIndex(0)
                  }}
                  className={`flex-1 px-3 py-2 border rounded ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <>
                    <button
                      onClick={goToPreviousMatch}
                      className={`p-2 rounded hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                      title="Previous match"
                    >
                      ↑
                    </button>
                    <div className={`px-2 py-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {searchResultIndex + 1}/{searchResults.length}
                    </div>
                    <button
                      onClick={goToNextMatch}
                      className={`p-2 rounded hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                      title="Next match"
                    >
                      ↓
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery('')
                    setSearchResultIndex(0)
                  }}
                  className={`p-2 rounded hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {searchQuery && (
              <div className={`mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Found {searchResultsCount} matching message{searchResultsCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              title="Toggle dark mode"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className={showSearch ? 'mt-2' : ''}>
          {conversation ? (
          conversation.isGroup ? (
            <>
              <h2 className="text-lg font-semibold">{conversation.name || 'Group Chat'}</h2>
              <p className="text-sm text-gray-500">{conversation.participants.length} members</p>
              {typingUsers && typingUsers.length > 0 && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {typingUsers.map(user => (
                    <div key={user._id} className="flex items-center gap-1">
                      <p className="text-sm text-blue-500 font-medium">{user.name}</p>
                      <div className="flex gap-0.5">
                        <span className="typing-dot text-blue-500 text-xs">•</span>
                        <span className="typing-dot text-blue-500 text-xs">•</span>
                        <span className="typing-dot text-blue-500 text-xs">•</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (() => {
            const otherUserId = conversation.participants.find(id => id !== currentUserId)
            const otherUser = allUsers?.find(u => u._id === otherUserId)
            return (
              <>
                <h2 className="text-lg font-semibold">{otherUser?.name || 'Loading...'}</h2>
                <p className="text-sm text-gray-500">
                  {otherUser?.isOnline
                    ? 'online'
                    : `last seen ${
                        otherUser?.lastSeen
                          ? new Date(otherUser.lastSeen).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'unknown'
                      }`}
                </p>
                {typingUsers && typingUsers.filter(u => u._id === otherUserId).length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-sm text-blue-500 font-medium">
                      {typingUsers.filter(u => u._id === otherUserId)[0].name} is typing
                    </p>
                    <div className="flex gap-1">
                      <span className="typing-dot text-blue-500">•</span>
                      <span className="typing-dot text-blue-500">•</span>
                      <span className="typing-dot text-blue-500">•</span>
                    </div>
                  </div>
                )}
              </>
            )
          })()
        ) : (
          <p className="text-gray-500">Loading conversation...</p>
        )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
        onScroll={handleScroll}
      >
        {replyingTo && (
          <div className={`p-2 rounded mb-2 text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
            Replying to: <span className="italic">{replyingTo.content}</span>
            <button className="ml-2 text-red-500" onClick={() => setReplyingTo(null)}>
              ✕
            </button>
          </div>
        )}

        {messages === undefined ? (
          <div>Loading messages...</div>
        ) : filteredMessages?.length === 0 ? (
          <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-8`}>
            <MessageCircle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : ''}`}>No messages yet</h3>
            <p>Start the conversation by sending a message!</p>
          </div>
        ) : (
          Object.entries(groupMessagesByDate(filteredMessages || [])).map(([dateLabel, msgs]) => (
            <div key={dateLabel}>
              <div className="flex justify-center my-4">
                <div className={`${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'} px-3 py-1 rounded-full text-sm`}>{dateLabel}</div>
              </div>
              {msgs.map(m => {
                const sender = allUsers?.find(u => u._id === m.senderId)
                const isOwn = m.senderId === currentUserId
                const isEditing = editingId === m._id
                return (
                  <div key={m._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {!isOwn && (
                      <Image
                        src={sender?.imageUrl || '/default-avatar.png'}
                        alt={sender?.name || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full mr-2 self-end"
                      />
                    )}
                    <div className="max-w-xs lg:max-w-md relative">
                      <div
                        className={`px-4 py-2 rounded-lg relative ${
                          isOwn ? 'bg-blue-500 text-white' : `${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-900'}`
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className={`px-2 py-1 border rounded ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                              autoFocus
                            />
                            <div className="flex gap-2 text-xs">
                              <button
                                onClick={handleSaveEdit}
                                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                              >
                                <Check className="w-3 h-3" /> Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded"
                              >
                                <X className="w-3 h-3" /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className={`text-sm ${m.isDeleted ? `italic ${isDark ? 'text-gray-400' : 'text-gray-500'}` : ''}`}>
                              {m.isDeleted ? 'This message was deleted' : m.content}
                            </p>
                            {m.editedAt && !m.isDeleted && (
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} italic mt-1`}>
                                (edited)
                              </p>
                            )}
                          </>
                        )}
                        {/* Emoji reactions under message */}
                        {m.reactions && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Array.isArray(m.reactions) ? (
                              // New array format
                              m.reactions.length > 0 && m.reactions.map(({ emoji, userIds }) => (
                                <span
                                  key={emoji}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer select-none ${
                                    userIds.includes(currentUserId)
                                      ? isOwn
                                        ? 'bg-blue-600 text-white border-blue-700'
                                        : 'bg-gray-200 text-blue-600 border-blue-400'
                                      : 'bg-gray-100 text-gray-700 border-gray-300'
                                  }`}
                                  title={userIds.length === 1 ? '1 reaction' : `${userIds.length} reactions`}
                                >
                                  {emoji}
                                  {userIds.length > 1 && (
                                    <span className="ml-1">{userIds.length}</span>
                                  )}
                                </span>
                              ))
                            ) : (
                              // Old object format (for backward compatibility)
                              Object.entries(m.reactions as Record<string, string[]>).length > 0 && Object.entries(m.reactions as Record<string, string[]>).map(([emoji, userIds]) => (
                                <span
                                  key={emoji}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer select-none ${
                                    (userIds as string[]).includes(currentUserId)
                                      ? isOwn
                                        ? 'bg-blue-600 text-white border-blue-700'
                                        : 'bg-gray-200 text-blue-600 border-blue-400'
                                      : 'bg-gray-100 text-gray-700 border-gray-300'
                                  }`}
                                  title={(userIds as string[]).length === 1 ? '1 reaction' : `${(userIds as string[]).length} reactions`}
                                >
                                  {emoji}
                                  {(userIds as string[]).length > 1 && (
                                    <span className="ml-1">{(userIds as string[]).length}</span>
                                  )}
                                </span>
                              ))
                            )}
                          </div>
                        )}
                        {!m.isDeleted && (
                          <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                            {formatTimestamp(m.timestamp)}
                          </p>
                        )}

                        {/* Dropdown toggle */}
                        {!m.isDeleted && (
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              toggleMenu(m._id)
                            }}
                            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        )}

                        {/* Dropdown menu */}
                        {openMenu === m._id && (
                          <div
                            className={`absolute border rounded shadow-lg z-10 min-w-40 top-6 right-0 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
                          >
                            <button
                              className={`block w-full text-left px-3 py-2 hover:${isDark ? 'bg-gray-600' : 'bg-gray-100'} flex items-center ${isDark ? 'text-gray-100' : 'text-black'}`}
                              onClick={() => navigator.clipboard.writeText(m.content)}
                            >
                              <Copy className="w-4 h-4 mr-2" /> Copy
                            </button>

                            <button
                              className={`block w-full text-left px-3 py-2 hover:${isDark ? 'bg-gray-600' : 'bg-gray-100'} flex items-center ${isDark ? 'text-gray-100' : 'text-black'}`}
                              onClick={() => handleReply(m)}
                            >
                              Reply
                            </button>

                            <button
                              className={`block w-full text-left px-3 py-2 hover:${isDark ? 'bg-gray-600' : 'bg-gray-100'} flex items-center ${isDark ? 'text-gray-100' : 'text-black'}`}
                              onClick={() => setShowReactMenu(m._id)}
                            >
                              <Smile className="w-4 h-4 mr-2" /> React
                            </button>

                            {isOwn && (
                              <button
                                onClick={() => handleEdit(m)}
                                className={`block w-full text-left px-3 py-2 hover:${isDark ? 'bg-gray-600' : 'bg-gray-100'} flex items-center ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                              >
                                <Edit2 className="w-4 h-4 mr-2" /> Edit
                              </button>
                            )}

                            {isOwn && (
                              <button
                                onClick={() => handleDelete(m._id)}
                                className={`block w-full text-left px-3 py-2 hover:${isDark ? 'bg-gray-600' : 'bg-gray-100'} text-red-500 flex items-center`}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </button>
                            )}
                          </div>
                        )}

                        {/* React menu */}
                        {showReactMenu === m._id && (
                          <div
                            className="absolute bottom-full right-0 flex bg-white border rounded shadow-lg p-1 space-x-1"
                            onClick={e => e.stopPropagation()}
                          >
                            {EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                className="p-1 hover:bg-gray-100 rounded"
                                onClick={() => handleReact(m._id, emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {isOwn && (
                      <Image
                        src={sender?.imageUrl || '/default-avatar.png'}
                        alt={sender?.name || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full ml-2 self-end"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* New Messages Button */}
      {showNewMessages && (
        <button
          onClick={() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            setShowNewMessages(false)
            if (conversation) markAsRead({ conversationId, userId: currentUserId })
          }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600 z-20"
        >
          ↓ New messages
        </button>
      )}

      {/* Input */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="relative">
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className={`mb-3 p-3 rounded border max-h-48 overflow-y-auto ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_GRID.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setMessageInput(messageInput + emoji)
                      setShowEmojiPicker(false)
                    }}
                    className={`text-2xl hover:${isDark ? 'bg-gray-600' : 'bg-gray-200'} p-2 rounded cursor-pointer transition`}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`text-gray-500 hover:text-gray-700 p-2 rounded hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder="Type a message"
              className={`flex-1 p-2 border rounded ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="bg-blue-500 text-white p-2 rounded flex items-center justify-center ml-2 hover:bg-blue-600" style={{ height: '40px', width: '40px' }}>
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}