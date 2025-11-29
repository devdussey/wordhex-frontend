
export class MockServer {
  constructor(onEmit){
    this.onEmit = onEmit;
    this.turn = null;
  }
  start(playerId){
    this.onEmit({type:"WELCOME", playerId});
    setTimeout(()=>{
      this.turn = playerId;
      this.onEmit({type:"TURN", playerId});
    }, 500);
  }
  receive(msg){
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
