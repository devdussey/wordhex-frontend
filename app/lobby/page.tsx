"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import PlayerRow from "@/components/lobby/PlayerRow";
import RequireAuth from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import "@/styles/lobby.css";

type Player = {
  userId: Id<"users">;
  email: string;
  role: "host" | "member";
  isReady: boolean;
  joinedAt: number;
};

export default function LobbyPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [lobbyId, setLobbyId] = useState<Id<"lobbies"> | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [msg, setMsg] = useState("Create or join a lobby to start playing.");

  const createLobby = useMutation(api.lobbies.create);
  const joinLobby = useMutation(api.lobbies.join);
  const setReadyMutation = useMutation(api.lobbies.setReady);
  const startGame = useMutation(api.lobbies.start);

  // Subscribe to lobby updates in real-time
  const lobby = useQuery(
    api.lobbies.getLobby,
    lobbyId ? { lobbyId } : "skip"
  );

  const members: Player[] = lobby?.members || [];
  const lobbyCode = lobby?.code || "";
  const isHost = lobby?.hostUserId === user?.userId;

  // Pad to 4 slots
  const players = [
    members[0] || null,
    members[1] || null,
    members[2] || null,
    members[3] || null,
  ];

  const ready = players.map((p) => p?.isReady || false);

  const selfIndex = players.findIndex((p) => p?.userId === user?.userId);
  const selfReady = selfIndex >= 0 ? ready[selfIndex] : false;
  const playerCount = members.length;
  const canStart = isHost && selfReady && playerCount > 1;

  // Check if game has started
  useEffect(() => {
    if (lobby?.startedAt) {
      router.push("/game");
    }
  }, [lobby?.startedAt, router]);

  const handleCreateLobby = async () => {
    if (!user) return;
    try {
      const result = await createLobby({ userId: user.userId });
      setLobbyId(result.lobbyId);
      setMsg(`Lobby created! Code: ${result.code}`);
    } catch (error: any) {
      setMsg(`Error: ${error.message}`);
    }
  };

  const handleJoinLobby = async () => {
    if (!user || !codeInput.trim()) return;
    try {
      const result = await joinLobby({ code: codeInput.trim(), userId: user.userId });
      setLobbyId(result.lobbyId);
      setMsg(`Joined lobby ${result.code}`);
    } catch (error: any) {
      setMsg(`Error: ${error.message}`);
    }
  };

  const handleToggleReady = async () => {
    if (!user || !lobbyId) return;
    try {
      await setReadyMutation({
        lobbyId,
        userId: user.userId,
        ready: !selfReady,
      });
    } catch (error: any) {
      setMsg(`Error: ${error.message}`);
    }
  };

  const handleStartGame = async () => {
    if (!user || !lobbyId) return;
    try {
      await startGame({ lobbyId, userId: user.userId });
    } catch (error: any) {
      setMsg(`Error: ${error.message}`);
    }
  };

  const slotElems = players.map((p, i) => (
    <PlayerRow
      key={i}
      slot={i + 1}
      player={
        p
          ? {
              id: p.userId,
              name: p.userId === user?.userId ? "You" : p.email.split("@")[0],
            }
          : undefined
      }
      isHost={isHost && i === 0}
      ready={ready[i]}
    />
  ));

  return (
    <RequireAuth redirectTo="/login">
      <div className="lobby-page">
        <div className="lobby-shell">
          <header className="lobby-header">
            <div className="eyebrow">WordHex</div>
            <h1>Game Lobby</h1>
            <p>Line up to 4 players, toggle ready, and launch the match.</p>
            <div className="lobby-code-pill">
              <div>
                <div className="label">Lobby code</div>
                <div className="code-value">
                  {lobbyCode ? lobbyCode : "Create or join to get a code"}
                </div>
              </div>
              <button
                className="btn ghost"
                onClick={() => {
                  if (!lobbyCode || !navigator?.clipboard) return;
                  navigator.clipboard.writeText(lobbyCode);
                  setMsg("Lobby code copied.");
                }}
                disabled={!lobbyCode}
              >
                Copy
              </button>
            </div>
          </header>

          <div className="lobby-grid">
            <section className="panel players">
              <div className="panel-head">
                <div>
                  <div className="label">Players</div>
                  <h3>{playerCount} / 4 ready to roll</h3>
                </div>
                <div className={`badge ${isHost ? "badge-host" : "badge-guest"}`}>
                  {isHost ? "Host" : "Guest"}
                </div>
              </div>
              <div className="lobby-box">{slotElems}</div>
              <div className="panel-actions">
                <button
                  className={`btn ${selfReady ? "secondary" : "primary"}`}
                  onClick={handleToggleReady}
                  disabled={!lobbyId}
                >
                  {selfReady ? "Unready" : "I'm Ready"}
                </button>
                <div className="hint">
                  Mark yourself ready; host can start when at least two players are in.
                </div>
              </div>
            </section>

            <section className="panel controls">
              <div className="panel-head">
                <div className="label">Lobby controls</div>
                <h3>Invite or jump into a room</h3>
              </div>
              <div className="stack">
                <button
                  className="btn primary wide"
                  onClick={handleCreateLobby}
                  disabled={!!lobbyId}
                >
                  Create Lobby
                </button>

                <div className="input-row">
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter lobby code"
                    disabled={!!lobbyId}
                  />
                  <button
                    className="btn outline"
                    onClick={handleJoinLobby}
                    disabled={!codeInput.trim() || !!lobbyId}
                  >
                    Join
                  </button>
                </div>

                <button
                  className="btn accent wide"
                  onClick={handleStartGame}
                  disabled={!canStart}
                >
                  Start Game
                </button>
                <div className="hint">
                  Host only. Requires you ready and at least one other player in the lobby.
                </div>
              </div>
              <div className="lobby-status">{msg}</div>
            </section>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
