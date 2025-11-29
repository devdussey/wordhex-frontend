
import Tile from './Tile';
export default function Board({ board, path, onTilePress }:{
  board:{letter:string}[][];
  path:{x:number,y:number}[];
  onTilePress:(x:number,y:number)=>void;
}){
  return (
    <div className="board-grid">
      {board.map((row,y)=>(
        <div key={y} className="board-row">
          {row.map((cell,x)=>{
            const idx = path.findIndex(p=>p.x===x && p.y===y);
            return (
              <Tile
                key={x}
                letter={cell.letter}
                index={idx>=0?idx+1:0}
                selected={idx>=0}
                onPress={()=>onTilePress(x,y)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
