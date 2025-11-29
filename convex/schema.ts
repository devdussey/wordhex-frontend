import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  lobbies: defineTable({
    code: v.string(),
    hostUserId: v.id("users"),
    isOpen: v.boolean(),
    startedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  lobbyMembers: defineTable({
    lobbyId: v.id("lobbies"),
    userId: v.id("users"),
    role: v.union(v.literal("host"), v.literal("member")),
    status: v.union(v.literal("active"), v.literal("left"), v.literal("kicked")),
    isReady: v.boolean(),
    joinedAt: v.number(),
  })
    .index("by_lobby", ["lobbyId"])
    .index("by_user", ["userId"])
    .index("by_lobby_and_user", ["lobbyId", "userId"]),
});
