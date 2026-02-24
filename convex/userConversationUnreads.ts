import { v } from 'convex/values'
import { query } from './_generated/server'

export const getUnreadCount = query({
  args: { userId: v.id('users'), conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    // Get all messages in this conversation
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversation', q => q.eq('conversationId', args.conversationId))
      .collect()

    // Count messages not read by this user
    const unreadMessages = messages.filter(m => !m.readBy?.includes(args.userId))
    return unreadMessages.length
  },
})