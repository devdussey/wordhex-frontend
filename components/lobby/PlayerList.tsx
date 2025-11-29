
export default function PlayerList({ players }:{
  players:{id:string, name:string}[]
}){
  return (
    <div className="lobby-list">
      {players.map(p=>(
        <div key={p.id} className="lobby-player">
          <div className="lobby-dot"></div>
          {p.name}
        </div>
      ))}
    </div>
  );
}
