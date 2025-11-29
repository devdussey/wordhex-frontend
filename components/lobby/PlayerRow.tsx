
export default function PlayerRow({ slot, player, isHost, ready }:{
  slot:number;
  player?:{id:string,name:string};
  isHost:boolean;
  ready:boolean;
}){
  return (
    <div className="lobby-row">
      <div className="lobby-slot">P{slot}</div>
      {player ? (
        <>
          <div className="lobby-name">{player.name}</div>
          {isHost && <div className="lobby-host">HOST</div>}
          <div className={ready ? "ready on" : "ready off"}>
            {ready ? "READY" : "NOT READY"}
          </div>
        </>
      ) : (
        <div className="lobby-empty">⟨ Waiting... ⟩</div>
      )}
    </div>
  );
}
