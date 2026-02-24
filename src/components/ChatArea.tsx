'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Send, Trash2, MessageCircle, ChevronDown, Copy, Smile } from 'lucide-react'

interface ChatAreaProps {
  conversationId: string
  currentUserId: string
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢']

export function ChatArea({ conversationId, currentUserId }: ChatAreaProps) {
  const messages = useQuery(api.messages.getMessages, { conversationId })
  const allUsers = useQuery(api.users.getUsers)
  const conversation = useQuery(api.conversations.getConversation, { id: conversationId })
  const typingUsers = useQuery(api.typing.getTypingUsers, { conversationId })
  const sendMessage = useMutation(api.messages.sendMessage)
  const deleteMessage = useMutation(api.messages.deleteMessage)
  const setTyping = useMutation(api.typing.setTyping)
  const markAsRead = useMutation(api.conversations.markAsRead)
  const addReaction = useMutation(api.messages.addReaction) // you need to implement this in server

  const [messageInput, setMessageInput] = useState('')
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showNewMessages, setShowNewMessages] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [showReactMenu, setShowReactMenu] = useState<string | null>(null)

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
      replyTo: replyingTo?._id || null,
    })
    setMessageInput('')
    setReplyingTo(null)
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setTyping({ conversationId, userId: currentUserId, isTyping: false })
  }

  const toggleMenu = (messageId: string) =>
    setOpenMenu(openMenu === messageId ? null : messageId)

  const handleDelete = async (messageId: string) => {
    await deleteMessage({ messageId })
    setOpenMenu(null)
  }

  const handleReply = (message: any) => {
    setReplyingTo(message)
    setOpenMenu(null)
  }

  const handleReact = (messageId: string, emoji: string) => {
    addReaction({ messageId, emoji })
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

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        {conversation ? (
          conversation.isGroup ? (
            <>
              <h2 className="text-lg font-semibold">{conversation.name || 'Group Chat'}</h2>
              <p className="text-sm text-gray-500">{conversation.participants.length} members</p>
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
                {typingUsers
                  ?.filter(u => u._id === otherUserId)
                  .map(u => (
                    <p key={u._id} className="text-sm text-gray-500 mt-1 italic animate-pulse">
                      {u.name} is typing...
                    </p>
                  ))}
              </>
            )
          })()
        ) : (
          <p className="text-gray-500">Loading conversation...</p>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {replyingTo && (
          <div className="p-2 bg-gray-200 rounded mb-2 text-gray-700 text-sm">
            Replying to: <span className="italic">{replyingTo.content}</span>
            <button className="ml-2 text-red-500" onClick={() => setReplyingTo(null)}>
              ✕
            </button>
          </div>
        )}

        {messages === undefined ? (
          <div>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p>Start the conversation by sending a message!</p>
          </div>
        ) : (
          Object.entries(groupMessagesByDate(messages)).map(([dateLabel, msgs]) => (
            <div key={dateLabel}>
              <div className="flex justify-center my-4">
                <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">{dateLabel}</div>
              </div>
              {msgs.map(m => {
                const sender = allUsers?.find(u => u._id === m.senderId)
                const isOwn = m.senderId === currentUserId
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
                        className={`px-4 py-2 rounded-lg ${
                          isOwn ? 'bg-blue-500 text-white' : 'bg-white text-gray-900'
                        } relative`}
                      >
                        <p className={`text-sm ${m.isDeleted ? 'italic text-gray-500' : ''}`}>
                          {m.isDeleted ? 'This message was deleted' : m.content}
                        </p>
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
                            className={`absolute bg-white border rounded shadow-lg z-10 min-w-32 top-6 right-0`}
                          >
                            <button
                              className="block w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center text-black"
                              onClick={() => navigator.clipboard.writeText(m.content)}
                            >
                              <Copy className="w-4 h-4 mr-2" /> Copy
                            </button>

                            <button
                              className="block w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center text-black"
                              onClick={() => handleReply(m)}
                            >
                              Reply
                            </button>

                            <button
                              className="block w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center text-black"
                              onClick={() => setShowReactMenu(m._id)}
                            >
                              <Smile className="w-4 h-4 mr-2" /> React
                            </button>

                            {isOwn && (
                              <button
                                onClick={() => handleDelete(m._id)}
                                className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-red-500 flex items-center"
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
      <div className="p-4 border-t border-gray-200 bg-white flex flex-col space-y-2">
        <input
          type="text"
          value={messageInput}
          onChange={handleInputChange}
          placeholder="Type a message"
          className="flex-1 p-2 border rounded"
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} className="bg-blue-500 text-white px-4 py-2 rounded w-20 self-end">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}