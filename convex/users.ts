import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    imageUrl: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('users').withIndex('by_clerk_id', q => q.eq('clerkId', args.clerkId)).first()
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        imageUrl: args.imageUrl,
        email: args.email,
        isOnline: true,
        lastSeen: Date.now(),
      })
      return existing._id
    } else {
      return await ctx.db.insert('users', {
        clerkId: args.clerkId,
        name: args.name,
        imageUrl: args.imageUrl,
        email: args.email,
        isOnline: true,
        lastSeen: Date.now(),
      })
    }
  },
})

export const setOnline = mutation({
  args: { clerkId: v.string(), online: v.boolean() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query('users').withIndex('by_clerk_id', q => q.eq('clerkId', args.clerkId)).first()
    if (user) {
      await ctx.db.patch(user._id, {
        isOnline: args.online,
        lastSeen: Date.now(),
      })
    }
  },
})

export const getUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query('users').collect()
  },
})