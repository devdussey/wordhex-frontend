
export class MockServer {
  onEmit: (event: any) => void;
  turn: string | null;

  constructor(onEmit: (event: any) => void){
    this.onEmit = onEmit;
    this.turn = null;
  }
  start(playerId: string){
    this.onEmit({type:"WELCOME", playerId});
    setTimeout(()=>{
      this.turn = playerId;
      this.onEmit({type:"TURN", playerId});
    }, 500);
  }
  receive(msg: any){
    if(msg.type==="JOIN"){
      this.start(msg.playerId);
    }
    if(msg.type==="PATH"){
      this.onEmit({type:"OPPPATH", path:msg.path});
    }
    if(msg.type==="SUBMIT"){
      this.onEmit({type:"OPPSUBMIT", word:msg.word, score:msg.score});
      this.onEmit({type:"ROUND", round:1});
      this.onEmit({type:"TURN", playerId:msg.playerId});
    }
  }
}
