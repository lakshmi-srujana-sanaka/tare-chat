import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    imageUrl: v.string(),
    email: v.string(),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  }).index('by_clerk_id', ['clerkId']),
  conversations: defineTable({
    participants: v.array(v.id('users')),
    isGroup: v.boolean(),
    name: v.optional(v.string()),
    lastMessage: v.optional(v.id('messages')),
    updatedAt: v.number(),
    unreadCount: v.optional(v.number()),
  }).index('by_participants', ['participants']),
  messages: defineTable({
    conversationId: v.id('conversations'),
    senderId: v.id('users'),
    content: v.string(),
    timestamp: v.number(),
    isDeleted: v.boolean(),
    reactions: v.optional(v.any()), // Accepts both old {} and new [] formats
    editedAt: v.optional(v.number()), // Track when message was edited
    replyTo: v.optional(v.id('messages')), // Reply to another message
  }).index('by_conversation', ['conversationId']),
  typingIndicators: defineTable({
    conversationId: v.id('conversations'),
    userId: v.id('users'),
    timestamp: v.number(),
  }).index('by_conversation', ['conversationId']),
  messageReactions: defineTable({
    messageId: v.id('messages'),
    userId: v.id('users'),
    reaction: v.string(),
  }).index('by_message', ['messageId']),
  userConversationUnreads: defineTable({
    userId: v.id('users'),
    conversationId: v.id('conversations'),
    unreadCount: v.number(),
  }).index('by_user_conversation', ['userId', 'conversationId']),
})