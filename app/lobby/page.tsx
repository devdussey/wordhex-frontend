
"use client";
import React, { useEffect, useState } from "react";
import PlayerRow from "@/components/lobby/PlayerRow";
import { LobbySocket } from "@/lib/game/lobbySocket";
import "@/styles/lobby.css";

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

  function markReady(i: number, val: boolean) {
    setReady((r) => {
      const next = [...r];
      next[i] = val;
      return next;
    });
  }

  useEffect(() => {
    // The socket has no unsubscribe API; we register once per mount.
    LobbySocket.on((ev: any) => {
      if (ev.type === "CREATED") {
        setLobbyCode(ev.code ?? "");
        setMsg("Lobby created. Share the code to invite.");
        setIsHost(true);
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
        setIsHost(false);
        setPlayers((p) => {
          const next = [...p];
          if (!next[0]) next[0] = { id: playerId, name: "You" };
          const slot = next.findIndex((x) => x === null);
          if (slot !== -1) next[slot] = { id: "pX", name: "Player" };
          return next;
        });
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
  const canStart = isHost && ready[0] && playerCount > 1;

  return (
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
                className={`btn ${ready[0] ? "secondary" : "primary"}`}
                onClick={() => markReady(0, !ready[0])}
              >
                {ready[0] ? "Unready" : "I'm Ready"}
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
  );
}
