import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// ✅ Set typing status for a user
export const setTyping = mutation({
  args: {
    conversationId: v.id('conversations'),
    userId: v.id('users'),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('typingIndicators')
      .withIndex('by_conversation', q => q.eq('conversationId', args.conversationId))
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first()

    if (args.isTyping) {
      if (!existing) {
        await ctx.db.insert('typingIndicators', {
          conversationId: args.conversationId,
          userId: args.userId,
          timestamp: Date.now(),
        })
      } else {
        // Update timestamp to avoid stale typing indicators
        await ctx.db.patch(existing._id, { timestamp: Date.now() })
      }
    } else {
      if (existing) {
        await ctx.db.delete(existing._id)
      }
    }
  },
})

// ✅ Get all users currently typing
export const getTypingUsers = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const indicators = await ctx.db
      .query('typingIndicators')
      .withIndex('by_conversation', q => q.eq('conversationId', args.conversationId))
      .collect()

    const now = Date.now()
    // Remove stale indicators older than 2 seconds
    for (const t of indicators) {
      if (now - t.timestamp > 2000) {
        await ctx.db.delete(t._id)
      }
    }

    const freshIndicators = indicators.filter(t => now - t.timestamp <= 2000)
    const users = await Promise.all(
      freshIndicators.map(t => ctx.db.get(t.userId))
    )
    return users.filter(u => u !== null).map(u => ({ _id: u!._id, name: u!.name }))
  },
})