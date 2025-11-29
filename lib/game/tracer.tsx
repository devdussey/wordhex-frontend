
export function pathToPolyline(path,tileSize){
  return path.map(p=>`${p.x*tileSize+tileSize/2},${p.y*tileSize+tileSize/2}`).join(' ');
}
