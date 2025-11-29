
export function useDragPath(onSelect){
  let path=[];
  let active=false;
  function start(tile){active=true;path=[tile];onSelect([...path]);}
  function move(tile){
    if(!active)return;
    const last=path[path.length-1];
    if(last.x===tile.x && last.y===tile.y)return;
    path.push(tile);
    onSelect([...path]);
  }
  function end(){active=false;const done=[...path];path=[];return done;}
  return {start,move,end};
}
