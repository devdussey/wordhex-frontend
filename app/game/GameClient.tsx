
"use client";
import React, { useState, useEffect } from 'react';
import Board from '@/components/game/Board';
import NeonTracer from '@/components/game/NeonTracer';
import WordPreview from '@/components/game/WordPreview';
import { useDragPath } from '@/lib/game/useDragPath';
import { scoreWord } from '@/lib/game/scoring';
import { validate } from '@/lib/game/dictionary';
import { useMultiplayerSocket } from '@/lib/game/useMultiplayerSocket';

export default function GameClient(){
  const [board, setBoard] = useState([
    [{letter:'A'},{letter:'T'},{letter:'E'},{letter:'R'},{letter:'S'}],
    [{letter:'L'},{letter:'I'},{letter:'N'},{letter:'O'},{letter:'P'}],
    [{letter:'Q'},{letter:'E'},{letter:'M'},{letter:'A'},{letter:'R'}],
    [{letter:'S'},{letter:'T'},{letter:'U'},{letter:'V'},{letter:'W'}],
    [{letter:'H'},{letter:'A'},{letter:'X'},{letter:'E'},{letter:'L'}],
  ]);

  const [path,setPath]=useState([]);
  const [oppPath,setOppPath]=useState([]);
  const [word,setWord]=useState('');
  const [valid,setValid]=useState(false);
  const [score,setScore]=useState(0);
  const [oppScore,setOppScore]=useState(0);
  const [turn,setTurn]=useState("YOU");
  const [round,setRound]=useState(1);
  const [playerId, setPlayerId] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const wsRef = React.useRef(null);

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
            console.log('Player ID:', event.playerId);
            break;

          case 'BOARD':
            // Update board from backend
            if(event.board) setBoard(event.board);
            break;

          case 'TURN':
            // Backend tells us whose turn it is
            if(event.playerId === playerId) {
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
      localStorage.setItem('playerId', pid);

      wsRef.current.send({ type: 'JOIN', playerId: pid });
      setGameStarted(true);
    }

    return () => {
      // Clean up on unmount if needed
    };
  }, []);

  const boardSize = 720;
  const tileGap = 6;
  const gridSize = board[0]?.length ?? 5;
  const tileSize = (boardSize - tileGap * (gridSize - 1)) / gridSize;
  const containerStyle: React.CSSProperties = {
    position:'relative',
    width:`${boardSize}px`,
    margin:'0 auto'
  };
  const drag=useDragPath(setPath);

  function onTilePress(x,y){
    if(turn!=="YOU") return;
    if(path.length===0) drag.start({x,y});
    else drag.move({x,y});
    const w = [...path, {x,y}].map(p=>board[p.y][p.x].letter).join('');
    setWord(w);
    validate(w).then(v=>{
      setValid(v);
      if(v) setScore(scoreWord(w));
    });
  }

  function onEnd(){
    drag.end();
    if(valid && gameStarted && wsRef.current){
      // Send word submission to backend
      wsRef.current.send({
        type: 'SUBMIT',
        word: word,
        score: score,
        playerId: playerId
      });
      setTurn("OPP");
    }
    setPath([]);
    setWord('');
    setValid(false);
  }

  return (
    <div
      style={containerStyle}
      onMouseUp={onEnd}
      onTouchEnd={onEnd}
    >
      <div className="bg-anim" aria-hidden />
      <div style={{color:"#8f4dff",textAlign:"center",marginBottom:"10px"}}>
        Round {round} - Turn: {turn}
      </div>
      <div style={{position:'relative'}}>
        <NeonTracer path={path} tileSize={tileSize} tileGap={tileGap} gridSize={gridSize}/>
        <NeonTracer path={oppPath} tileSize={tileSize} tileGap={tileGap} gridSize={gridSize}/>
        <Board board={board} path={path} onTilePress={onTilePress}/>
      </div>
      <WordPreview word={word} valid={valid} score={score}/>
      <div style={{color:"#fff",textAlign:"center",marginTop:"10px"}}>
        Opponent Score: {oppScore}
      </div>
    </div>
  );
}
