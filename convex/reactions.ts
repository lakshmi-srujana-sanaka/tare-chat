import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const addReaction = mutation({
  args: {
    messageId: v.id('messages'),
    userId: v.id('users'),
    reaction: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('messageReactions').withIndex('by_message', q => q.eq('messageId', args.messageId)).filter(q => q.eq(q.field('userId'), args.userId)).filter(q => q.eq(q.field('reaction'), args.reaction)).first()
    if (existing) {
      await ctx.db.delete(existing._id)
    } else {
      await ctx.db.insert('messageReactions', {
        messageId: args.messageId,
        userId: args.userId,
        reaction: args.reaction,
      })
    }
  },
})

export const getReactions = query({
  args: { messageId: v.id('messages') },
  handler: async (ctx, args) => {
    return await ctx.db.query('messageReactions').withIndex('by_message', q => q.eq('messageId', args.messageId)).collect()
  },
})