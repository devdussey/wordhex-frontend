
"use client";
import React, { useEffect, useRef, useState } from "react";
import PlayerRow from "@/components/lobby/PlayerRow";
import { LobbySocket } from "@/lib/game/lobbySocket";
import "@/styles/lobby.css";
import RequireAuth from "@/components/auth/RequireAuth";

export default function LobbyPage() {
  const [playerId] = useState(() => "p" + Math.random().toString(36).slice(2));
  const [players, setPlayers] = useState<(null | { id: string; name: string })[]>([
    null,
    null,
    null,
    null,
  ]);
  const [ready, setReady] = useState([false, false, false, false]);
  const [isHost, setIsHost] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");
  const [msg, setMsg] = useState("Waiting to create or join a lobby.");

  const playersRef = useRef(players);
  const readyRef = useRef(ready);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  function applyReadyArray(arr: any[]) {
    const incoming = arr.slice(0, 4).map(Boolean);
    setReady((prev) => {
      const merged = [...prev];
      for (let i = 0; i < 4; i++) {
        if (typeof incoming[i] === "boolean") {
          merged[i] = incoming[i];
        } else if (typeof merged[i] !== "boolean") {
          merged[i] = false;
        }
      }
      return merged.slice(0, 4);
    });
  }

  function applyPlayersSnapshot(rawPlayers: any[]) {
    const byId = new Map(
      playersRef.current.filter(Boolean).map((p) => [p!.id, p!])
    );
    const nextPlayers: (null | { id: string; name: string })[] = Array(4).fill(
      null
    );
    const nextReady = [...readyRef.current, false, false, false, false].slice(
      0,
      4
    );

    rawPlayers.slice(0, 4).forEach((p, idx) => {
      if (!p) {
        nextPlayers[idx] = null;
        nextReady[idx] = false;
        return;
      }

      const id =
        typeof p === "string"
          ? p
          : p.id ??
            p.playerId ??
            p.name ??
            byId.get(p.id ?? p.playerId ?? "")?.id ??
            `player-${idx + 1}`;
      const existing = (id && byId.get(id)) || playersRef.current[idx] || null;
      const name =
        (typeof p === "object" && p.name) ||
        existing?.name ||
        `Player ${idx + 1}`;

      nextPlayers[idx] = { id, name };

      if (typeof p === "object" && "ready" in p) {
        nextReady[idx] = !!(p as any).ready;
      }
    });

    const namedPlayers = nextPlayers.map((p) =>
      p && p.id === playerId ? { ...p, name: "You" } : p
    );

    setPlayers(namedPlayers);
    setReady(nextReady);
  }

  function setReadyForPlayer(id: string, val: boolean, name?: string) {
    let idx = playersRef.current.findIndex((p) => p?.id === id);

    if (idx === -1) {
      const nextPlayers = [...playersRef.current];
      const slot = nextPlayers.findIndex((p) => p === null);
      if (slot !== -1) {
        nextPlayers[slot] = { id, name: name ?? "Player" };
        playersRef.current = nextPlayers;
        setPlayers(nextPlayers);
        idx = slot;
      }
    }

    if (idx !== -1) {
      setReady((prev) => {
        const next = [...prev];
        next[idx] = val;
        return next;
      });
    }
  }

  function toggleSelfReady(nextVal: boolean) {
    const selfIdx = playersRef.current.findIndex((p) => p?.id === playerId);
    setReady((prev) => {
      const next = [...prev];
      if (selfIdx !== -1) next[selfIdx] = nextVal;
      else next[0] = nextVal;
      return next;
    });
    LobbySocket.send({ type: "READY", playerId, ready: nextVal, code: lobbyCode });
  }

  useEffect(() => {
    // The socket has no unsubscribe API; we register once per mount.
    LobbySocket.on((ev: any) => {
      if (ev.type === "CREATED") {
        setLobbyCode(ev.code ?? "");
        setMsg("Lobby created. Share the code to invite.");
        setIsHost(true);
        const initialReady = Array.isArray(ev.ready)
          ? ev.ready.slice(0, 4).map(Boolean)
          : [false, false, false, false];
        setReady(initialReady);
        setPlayers(() => [
          { id: playerId, name: "You" },
          null,
          null,
          null,
        ]);
      }
      if (ev.type === "JOINED") {
        setLobbyCode(ev.code ?? "");
        setMsg("Joined lobby " + (ev.code ?? ""));
        if (Array.isArray(ev.players)) {
          applyPlayersSnapshot(ev.players);
          const hostCandidate = ev.players[0];
          const hostId =
            (typeof hostCandidate === "string"
              ? hostCandidate
              : hostCandidate?.id ?? hostCandidate?.playerId) ?? null;
          if (hostId) setIsHost(hostId === playerId);
          return;
        }
        setIsHost(false);
        if (Array.isArray(ev.ready)) {
          applyReadyArray(ev.ready);
        }
        const joiningPlayerId = ev.playerId ?? ev.id ?? null;
        const joiningPlayerName = ev.playerName ?? ev.name ?? "Player";
        setPlayers((p) => {
          const next = [...p];
          if (!next[0]) next[0] = { id: playerId, name: "You" };
          // Avoid duplicating yourself if backend echoes your own JOINED
          if (joiningPlayerId && joiningPlayerId === playerId) return next;
          const slot = next.findIndex((x) => x === null);
          if (slot !== -1 && joiningPlayerId) {
            next[slot] = { id: joiningPlayerId, name: joiningPlayerName };
          }
          return next;
        });
      }
      if (ev.type === "READYUPDATE") {
        if (Array.isArray(ev.players)) {
          applyPlayersSnapshot(ev.players);
          return;
        }
        if (Array.isArray(ev.ready)) applyReadyArray(ev.ready);
      }
      if (ev.type === "READY" || ev.type === "PLAYER_READY") {
        if (Array.isArray(ev.players)) {
          applyPlayersSnapshot(ev.players);
          return;
        }
        if (Array.isArray(ev.ready)) {
          applyReadyArray(ev.ready);
        }
        const id = ev.playerId ?? ev.id;
        if (!id) return;
        setReadyForPlayer(id, !!ev.ready, ev.name);
      }
      if (ev.type === "LOBBY_STATE" && Array.isArray(ev.players)) {
        applyPlayersSnapshot(ev.players);
        if (Array.isArray(ev.ready)) {
          applyReadyArray(ev.ready);
        }
      }
      if (ev.type === "START") {
        window.location.href = "/game";
      }
    });
  }, [playerId]);

  const slotElems = players.map((p, i) => (
    <PlayerRow
      key={i}
      slot={i + 1}
      player={p || undefined}
      isHost={isHost && i === 0}
      ready={ready[i]}
    />
  ));

  const playerCount = players.filter(Boolean).length;
  const selfIndex = players.findIndex((p) => p?.id === playerId);
  const selfReady = selfIndex >= 0 ? ready[selfIndex] : ready[0];
  const canStart = isHost && selfReady && playerCount > 1;

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
                  onClick={() => toggleSelfReady(!selfReady)}
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
                  onClick={() => LobbySocket.send({ type: "CREATE", playerId })}
                >
                  Create Lobby
                </button>

                <div className="input-row">
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter lobby code"
                  />
                  <button
                    className="btn outline"
                    onClick={() =>
                      LobbySocket.send({
                        type: "JOINLOBBY",
                        code: codeInput.trim(),
                        playerId,
                      })
                    }
                    disabled={!codeInput.trim()}
                  >
                    Join
                  </button>
                </div>

                <button
                  className="btn accent wide"
                  onClick={() => LobbySocket.send({ type: "START" })}
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
