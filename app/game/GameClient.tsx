
"use client";
import React, { useState, useEffect } from 'react';
import Board from '@/components/game/Board';
import NeonTracer from '@/components/game/NeonTracer';
import WordPreview from '@/components/game/WordPreview';
import { useDragPath } from '@/lib/game/useDragPath';
import { scoreWord } from '@/lib/game/scoring';
import { validate } from '@/lib/game/dictionary';
import { OppAI } from '@/lib/game/ai';
import { MatchFlow } from '@/lib/game/matchflow';

export default function GameClient(){
  const [board] = useState([
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
  const aiRef = React.useRef(null);

  useEffect(()=>{
    aiRef.current = new OppAI(ev=>{
      if(ev.type==="OPPSUBMIT"){
        setOppScore(s=>s+ev.score);
        setTurn("YOU");
      }
    });
  },[]);

  useEffect(()=>{
    if(turn==="OPP"){
      setTimeout(()=>aiRef.current.takeTurn(),800);
    }
  },[turn]);

  const tileSize=100;
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
    if(valid){
      setTurn("OPP");
    }
    setPath([]);
    setWord('');
    setValid(false);
  }

  return (
    <div style={{position:'relative',width:'720px',margin:'0 auto'}}
      onMouseUp={onEnd}
      onTouchEnd={onEnd}
    >
      <div style={{color:"#8f4dff",textAlign:"center",marginBottom:"10px"}}>
        Round {round} — Turn: {turn}
      </div>
      <NeonTracer path={path} tileSize={tileSize}/>
      <NeonTracer path={oppPath} tileSize={tileSize}/>
      <Board board={board} path={path} onTilePress={onTilePress}/>
      <WordPreview word={word} valid={valid} score={score}/>
      <div style={{color:"#fff",textAlign:"center",marginTop:"10px"}}>
        Opponent Score: {oppScore}
      </div>
    </div>
  );
}
