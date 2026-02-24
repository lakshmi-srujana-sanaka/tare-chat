import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// --------------------- Send Message ---------------------
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    replyTo: v.optional(v.id("messages")), // ✅ Added reply support
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      replyTo: args.replyTo ?? null,
      timestamp: Date.now(),
      isDeleted: false,
      reactions: {}, // emoji: [userIds]
    })

    const conv = await ctx.db.get(args.conversationId)

    await ctx.db.patch(args.conversationId, {
      lastMessage: messageId,
      updatedAt: Date.now(),
    })

    // Update unread count
    for (const participantId of conv!.participants) {
      if (participantId !== args.senderId) {
        const existing = await ctx.db
          .query("userConversationUnreads")
          .withIndex("by_user_conversation", (q) =>
            q.eq("userId", participantId).eq("conversationId", args.conversationId)
          )
          .first()

        if (existing) {
          await ctx.db.patch(existing._id, {
            unreadCount: existing.unreadCount + 1,
          })
        } else {
          await ctx.db.insert("userConversationUnreads", {
            userId: participantId,
            conversationId: args.conversationId,
            unreadCount: 1,
          })
        }
      }
    }

    return messageId
  },
})

// --------------------- Get Messages ---------------------
export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect()
  },
})

// --------------------- Delete Message ---------------------
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId)
    if (!msg) return

    if (msg.senderId === ctx.auth.userId) {
      await ctx.db.patch(args.messageId, { isDeleted: true })
    }

    return await ctx.db.get(args.messageId)
  },
})

// --------------------- Update Message ---------------------
export const updateMessage = mutation({
  args: { messageId: v.id("messages"), content: v.string() },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId)

    if (message && message.senderId === ctx.auth.userId) {
      await ctx.db.patch(args.messageId, { content: args.content })
    }
  },
})

// --------------------- Add / Toggle Reaction ---------------------
export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, { messageId, emoji }) => {
    const message = await ctx.db.get(messageId)
    if (!message) return

    const userId = ctx.auth.userId
    if (!userId) return

    const reactions = message.reactions || {}

    if (!reactions[emoji]) reactions[emoji] = []

    // ✅ Toggle reaction
    if (reactions[emoji].includes(userId)) {
      reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId)
    } else {
      reactions[emoji].push(userId)
    }

    await ctx.db.patch(messageId, { reactions })
  },
})