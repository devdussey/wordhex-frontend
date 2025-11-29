
export function simulateOpponent(onEmit){
  const words = ["AT", "TEN", "STAR", "TONE", "LINE", "HEX"];
  setTimeout(()=>{
    const w = words[Math.floor(Math.random()*words.length)];
    onEmit({type:"OPPPATH", path:[{x:0,y:0},{x:1,y:0}]});
    setTimeout(()=>{
      onEmit({type:"OPPSUBMIT", word:w, score:w.length});
    },500);
  }, 1500);
}
