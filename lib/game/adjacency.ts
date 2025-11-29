
export function isAdjacent(a,b){
  return Math.abs(a.x-b.x)<=1 && Math.abs(a.y-b.y)<=1;
}
