
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Board from '@/components/game/Board';
import NeonTracer from '@/components/game/NeonTracer';
import WordPreview from '@/components/game/WordPreview';
import { scoreWord } from '@/lib/game/scoring';
import { validate } from '@/lib/game/dictionary';
import { useMultiplayerSocket } from '@/lib/game/useMultiplayerSocket';

type PathPoint = { x: number; y: number };

export default function GameClient(){
  const [board, setBoard] = useState([
    [{letter:'A'},{letter:'T'},{letter:'E'},{letter:'R'},{letter:'S'}],
    [{letter:'L'},{letter:'I'},{letter:'N'},{letter:'O'},{letter:'P'}],
    [{letter:'Q'},{letter:'E'},{letter:'M'},{letter:'A'},{letter:'R'}],
    [{letter:'S'},{letter:'T'},{letter:'U'},{letter:'V'},{letter:'W'}],
    [{letter:'H'},{letter:'A'},{letter:'X'},{letter:'E'},{letter:'L'}],
  ]);

  const [path,setPath]=useState<PathPoint[]>([]);
  const [oppPath,setOppPath]=useState<PathPoint[]>([]);
  const [word,setWord]=useState('');
  const [valid,setValid]=useState(false);
  const [score,setScore]=useState(0);
  const [oppScore,setOppScore]=useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [turn,setTurn]=useState("YOU");
  const [round,setRound]=useState(1);
  const [playerId, setPlayerId] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const playerIdRef = React.useRef('');
  const wsRef = React.useRef<{ send: (obj: any) => void } | null>(null);

  // Connect to backend WebSocket
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL || 'wss://wordhex-backend.onrender.com';

    wsRef.current = useMultiplayerSocket({
      url,
      onEvent: (event: any) => {
        console.log('Game event:', event);

        switch(event.type) {
          case 'WELCOME':
            setPlayerId(event.playerId);
            playerIdRef.current = event.playerId || playerIdRef.current;
            console.log('Player ID:', event.playerId);
            break;

          case 'BOARD':
            // Update board from backend
            if(event.board) setBoard(event.board);
            break;

          case 'TURN':
            // Backend tells us whose turn it is
            if(event.playerId === playerIdRef.current) {
              setTurn('YOU');
            } else {
              setTurn('OPP');
            }
            break;

          case 'OPPPATH':
            // Real-time opponent path updates
            if(event.path) setOppPath(event.path);
            break;

          case 'OPPSUBMIT':
            // Opponent submitted a word
            setOppScore(s => s + (event.score || 0));
            setTurn('YOU');
            setOppPath([]);
            if(event.word){
              setStatusMsg(`Opponent played ${String(event.word).toUpperCase()} (+${event.score || 0})`);
            }
            break;

          case 'ROUND':
            // Update round number
            if(event.round) setRound(event.round);
            break;

          case 'MATCHEND':
            // Game ended
            console.log('Match ended:', event);
            break;

          case 'ERROR':
            // Error from backend
            console.error('Backend error:', event);
            break;
        }
      }
    });

    // Join the game
    if(wsRef.current) {
      const pid = localStorage.getItem('playerId') || `player_${Date.now()}`;
      setPlayerId(pid);
      playerIdRef.current = pid;
      localStorage.setItem('playerId', pid);

      wsRef.current.send({ type: 'JOIN', playerId: pid });
      setGameStarted(true);
    }

    return () => {
      // Clean up on unmount if needed
    };
  }, []);

  // Responsive board sizing
  const boardSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 320 : 720;
  const tileGap = 6;
  const gridSize = board[0]?.length ?? 5;
  const tileSize = (boardSize - tileGap * (gridSize - 1)) / gridSize;
  const containerStyle: React.CSSProperties = {
    position:'relative',
    width:`${boardSize}px`,
    margin:'0 auto'
  };

  const resetSelection = useCallback(() => {
    setPath([]);
    setWord('');
    setValid(false);
    setScore(0);
  }, []);

  const buildWordFromPath = useCallback((p: PathPoint[]) => {
    return p
      .map((pt) => board?.[pt.y]?.[pt.x]?.letter || '')
      .join('');
  }, [board]);

  // Keep derived word + validation in sync with path changes
  useEffect(() => {
    if (!path.length) {
      setWord('');
      setValid(false);
      setScore(0);
      return;
    }
    const nextWord = buildWordFromPath(path);
    setWord(nextWord);

    let cancelled = false;
    if (nextWord.length >= 3) {
      validate(nextWord).then((isValid) => {
        if (cancelled) return;
        setValid(isValid);
        setScore(isValid ? scoreWord(nextWord) : 0);
      });
    } else {
      setValid(false);
      setScore(0);
    }
    return () => {
      cancelled = true;
    };
  }, [path, buildWordFromPath, resetSelection]);

  // Broadcast path for opponent tracer
  useEffect(() => {
    if (!gameStarted || !wsRef.current) return;
    const pid = playerId || playerIdRef.current;
    wsRef.current.send({ type: 'PATH', path, playerId: pid });
  }, [gameStarted, path, playerId]);

  function onTilePress(x:number,y:number){
    if(turn!=="YOU" || isSubmitting) return;

    // Check if tile is already selected - if so, remove it
    const existingIdx = path.findIndex(p => p.x === x && p.y === y);
    if(existingIdx >= 0) {
      // Remove this tile and all tiles after it
      setPath(path.slice(0, existingIdx));
    } else {
      // Add new tile to path
      setPath([...path, {x, y}]);
    }
  }

  async function submitCurrentWord(source: 'auto' | 'button' = 'auto') {
    if (isSubmitting) return;
    if (turn !== 'YOU') {
      if (source === 'button') setStatusMsg('Wait for your turn.');
      resetSelection();
      return;
    }
    if (!gameStarted || !wsRef.current) {
      if (source === 'button') setStatusMsg('Connecting to the match...');
      resetSelection();
      return;
    }

    const submissionPath = [...path];
    const submissionWord = buildWordFromPath(submissionPath);
    const pid = playerId || playerIdRef.current;

    if (!submissionPath.length) return;

    if (submissionWord.length < 3) {
      if (source === 'button') setStatusMsg('Pick at least 3 letters.');
      resetSelection();
      return;
    }

    setIsSubmitting(true);
    try {
      const isValid = await validate(submissionWord);
      const submissionScore = isValid ? scoreWord(submissionWord) : 0;
      setValid(isValid);
      setScore(submissionScore);

      if (!isValid) {
        if (source === 'button') setStatusMsg('Not in dictionary yet.');
        resetSelection();
        return;
      }

      wsRef.current.send({
        type: 'SUBMIT',
        word: submissionWord,
        path: submissionPath,
        score: submissionScore,
        playerId: pid
      });
      wsRef.current.send({ type: 'ENDTURN', playerId: pid });
      setPlayerScore((s) => s + submissionScore);
      setTurn("OPP");
      setStatusMsg(`Submitted ${submissionWord.toUpperCase()} for ${submissionScore} pts`);
      resetSelection();
    } finally {
      setIsSubmitting(false);
    }
  }

  // Auto-submit when word is complete and valid
  async function onWordComplete() {
    if(path.length && word.length >= 3) {
      // Give user a moment to see their selection before submitting
      const isValid = await validate(buildWordFromPath(path));
      if (isValid) {
        submitCurrentWord('auto');
      }
    }
  }

  const canSubmit = useMemo(
    () => turn === 'YOU' && valid && word.length >= 3 && !isSubmitting,
    [turn, valid, word, isSubmitting]
  );

  return (
    <div style={containerStyle}>
      <div className="bg-anim" aria-hidden />
      <div style={{color:"#8f4dff",textAlign:"center",marginBottom:"10px"}}>
        Round {round} - Turn: {turn}
      </div>
      <div className="score-row">
        <div className="score-chip">You: {playerScore}</div>
        <div className="score-chip">Opponent: {oppScore}</div>
      </div>
      <div style={{position:'relative'}}>
        <NeonTracer path={path} tileSize={tileSize} tileGap={tileGap} gridSize={gridSize}/>
        <NeonTracer path={oppPath} tileSize={tileSize} tileGap={tileGap} gridSize={gridSize}/>
        <Board board={board} path={path} onTilePress={onTilePress}/>
      </div>
      {word && (
        <>
          <WordPreview word={word} valid={valid} score={score}/>
          <div className="submit-row">
            <button
              className="submit-btn"
              onClick={() => submitCurrentWord('button')}
              disabled={!canSubmit}
            >
              Submit word
            </button>
            <button
              className="clear-btn"
              onClick={() => resetSelection()}
            >
              Clear
            </button>
            <span className="submit-hint">
              {turn !== "YOU"
                ? "Wait for your turn"
                : valid
                  ? "Tap submit to lock it in"
                  : "Needs 3+ letters in the dictionary"}
            </span>
          </div>
        </>
      )}
      {statusMsg && (
        <div className="status-pill">
          {statusMsg}
        </div>
      )}
    </div>
  );
}
