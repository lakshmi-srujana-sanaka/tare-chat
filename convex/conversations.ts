import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const createConversation = mutation({
  args: {
    participants: v.array(v.id('users')),
    isGroup: v.boolean(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if conversation already exists for 1-on-1
    if (!args.isGroup && args.participants.length === 2) {
      const existing = await ctx.db.query('conversations').withIndex('by_participants', q => q.eq('participants', args.participants.sort())).first()
      if (existing) return existing._id
    }
    return await ctx.db.insert('conversations', {
      participants: args.participants,
      isGroup: args.isGroup,
      name: args.name,
      updatedAt: Date.now(),
    })
  },
})

export const markAsRead = mutation({
  args: { conversationId: v.id('conversations'), userId: v.id('users') },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('userConversationUnreads').withIndex('by_user_conversation', q => q.eq('userId', args.userId).eq('conversationId', args.conversationId)).first()
    if (existing) {
      await ctx.db.patch(existing._id, { unreadCount: 0 })
    }
  },
})

export const getConversations = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const allConversations = await ctx.db.query('conversations').collect()
    const userConversations = allConversations.filter(conv => conv.participants.includes(args.userId))
    // Add unreadCount and lastMessage content for each
    const conversationsWithDetails = await Promise.all(userConversations.map(async (conv) => {
      const unreadRecord = await ctx.db.query('userConversationUnreads').withIndex('by_user_conversation', q => q.eq('userId', args.userId).eq('conversationId', conv._id)).first()
      let lastMessageContent = null
      if (conv.lastMessage) {
        const lastMsg = await ctx.db.get(conv.lastMessage)
        lastMessageContent = lastMsg?.content || null
      }
      return { ...conv, unreadCount: unreadRecord?.unreadCount || 0, lastMessageContent }
    }))
    return conversationsWithDetails
  },
})

export const getConversation = query({
  args: { id: v.id('conversations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})