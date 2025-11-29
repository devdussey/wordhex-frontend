
export function scoreWord(w){
  const L={A:1,E:1,I:1,O:1,N:2,R:2,S:2,T:2,D:3,G:3,L2:3,B:4,H:4,P:4,M:4,U:4,Y:4,C:5,F:5,V:5,W:5,K:6,J:7,X:7,Q:8,Z:8};
  let s=0;
  for(const c of w) s+=L[c]||1;
  if(w.length>=6)s+=10;
  return s;
}
