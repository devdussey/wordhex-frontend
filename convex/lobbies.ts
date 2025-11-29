import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateLobbyCode } from "./helpers/lobbyCode";

export const create = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Generate unique lobby code
    let code = generateLobbyCode();
    let existing = await ctx.db
      .query("lobbies")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    while (existing) {
      code = generateLobbyCode();
      existing = await ctx.db
        .query("lobbies")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
    }

    // Create lobby
    const lobbyId = await ctx.db.insert("lobbies", {
      code,
      hostUserId: args.userId,
      isOpen: true,
      createdAt: Date.now(),
    });

    // Add host as first member
    await ctx.db.insert("lobbyMembers", {
      lobbyId,
      userId: args.userId,
      role: "host",
      status: "active",
      isReady: false,
      joinedAt: Date.now(),
    });

    return { lobbyId, code };
  },
});

export const join = mutation({
  args: {
    code: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find lobby by code
    const lobby = await ctx.db
      .query("lobbies")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!lobby) {
      throw new Error("Lobby not found");
    }

    if (!lobby.isOpen) {
      throw new Error("Lobby is closed");
    }

    // Check if user is already a member
    const existingMember = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobby_and_user", (q) =>
        q.eq("lobbyId", lobby._id).eq("userId", args.userId)
      )
      .first();

    if (existingMember) {
      return { lobbyId: lobby._id, code: lobby.code };
    }

    // Check if lobby is full (max 4 players)
    const members = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", lobby._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (members.length >= 4) {
      throw new Error("Lobby is full");
    }

    // Add member to lobby
    await ctx.db.insert("lobbyMembers", {
      lobbyId: lobby._id,
      userId: args.userId,
      role: "member",
      status: "active",
      isReady: false,
      joinedAt: Date.now(),
    });

    return { lobbyId: lobby._id, code: lobby.code };
  },
});

export const setReady = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    userId: v.id("users"),
    ready: v.boolean(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobby_and_user", (q) =>
        q.eq("lobbyId", args.lobbyId).eq("userId", args.userId)
      )
      .first();

    if (!member) {
      throw new Error("Not a member of this lobby");
    }

    await ctx.db.patch(member._id, { isReady: args.ready });
  },
});

export const start = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) {
      throw new Error("Lobby not found");
    }

    // Only host can start
    if (lobby.hostUserId !== args.userId) {
      throw new Error("Only host can start the game");
    }

    // Check if at least 2 players are ready
    const members = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const readyMembers = members.filter((m) => m.isReady);
    if (readyMembers.length < 1 || members.length < 2) {
      throw new Error("Need at least 2 players with host ready");
    }

    // Start the game
    await ctx.db.patch(args.lobbyId, {
      startedAt: Date.now(),
      isOpen: false,
    });

    return { started: true };
  },
});

export const getLobby = query({
  args: { lobbyId: v.id("lobbies") },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) return null;

    const members = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          userId: member.userId,
          email: user?.email || "Unknown",
          role: member.role,
          isReady: member.isReady,
          joinedAt: member.joinedAt,
        };
      })
    );

    return {
      ...lobby,
      members: membersWithDetails,
    };
  },
});

export const getLobbyByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const lobby = await ctx.db
      .query("lobbies")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!lobby) return null;

    const members = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", lobby._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          userId: member.userId,
          email: user?.email || "Unknown",
          role: member.role,
          isReady: member.isReady,
          joinedAt: member.joinedAt,
        };
      })
    );

    return {
      ...lobby,
      members: membersWithDetails,
    };
  },
});
