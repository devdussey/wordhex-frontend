
"use client";
import React, { useState } from 'react';
import PlayerRow from '@/components/lobby/PlayerRow';
import { LobbySocket } from '@/lib/game/lobbySocket';

export default function LobbyPage(){
  const [playerId] = useState(()=>"p"+Math.random().toString(36).slice(2));
  const [players,setPlayers]=useState([
    null,null,null,null
  ]);
  const [ready,setReady]=useState([false,false,false,false]);
  const [isHost,setIsHost]=useState(false);
  const [code,setCode]=useState("");
  const [msg,setMsg]=useState("");

  function markReady(i,val){
    setReady(r=>{
      const t=[...r];
      t[i]=val;
      return t;
    });
  }

  LobbySocket.on(ev=>{
    if(ev.type==="CREATED"){
      setMsg("Lobby Created: "+ev.code);
      setIsHost(true);
      setPlayers(p=>{
        const t=[...p];
        t[0]={id:playerId,name:"You"};
        return t;
      });
    }
    if(ev.type==="JOINED"){
      setMsg("Joined Lobby "+ev.code);
      // Place opponent in next available slot
      setPlayers(p=>{
        const t=[...p];
        const idx=t.findIndex(x=>x===null);
        if(idx!==-1) t[idx]={id:"pX",name:"Player"};
        return t;
      });
    }
    if(ev.type==="START"){
      window.location.href="/game";
    }
  });

  const slotElems = players.map((p,i)=>(
    <PlayerRow
      key={i}
      slot={i+1}
      player={p}
      isHost={isHost && i===0}
      ready={ready[i]}
    />
  ));

  return (
    <div style={{maxWidth:"420px",margin:"30px auto",color:"#fff"}}>
      <h1>Lobby (4 Players)</h1>
      <div className="lobby-box">{slotElems}</div>
      <button onClick={()=>markReady(0,!ready[0])}>
        {ready[0]?"Unready":"Ready"}
      </button>
      <div style={{marginTop:"20px"}}>
        <h3>Create Lobby</h3>
        <button onClick={()=>LobbySocket.send({type:"CREATE", playerId})}>Create</button>
      </div>
      <div style={{marginTop:"20px"}}>
        <h3>Join Lobby</h3>
        <input placeholder="Lobby Code" value={code} onChange={e=>setCode(e.target.value)} />
        <button onClick={()=>LobbySocket.send({type:"JOINLOBBY", code, playerId})}>Join</button>
      </div>
      {isHost && (
        <div style={{marginTop:"20px"}}>
          <button onClick={()=>LobbySocket.send({type:"START"})}>Start Game</button>
        </div>
      )}
      <div style={{marginTop:"20px"}}>{msg}</div>
    </div>
  );
}
