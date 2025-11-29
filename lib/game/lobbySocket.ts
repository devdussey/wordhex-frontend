
class _LS {
  constructor(){
    this.handlers=[];
  }
  on(fn){ this.handlers.push(fn); }
  send(ev){
    setTimeout(()=>this.mock(ev),300);
  }
  mock(ev){
    if(ev.type==="CREATE"){
      this.emit({type:"CREATED", code:"ABCD"});
    }
    if(ev.type==="JOINLOBBY"){
      this.emit({type:"JOINED", code:ev.code});
    }
    if(ev.type==="START"){
      this.emit({type:"START"});
    }
  }
  emit(ev){ this.handlers.forEach(h=>h(ev)); }
}
export const LobbySocket = new _LS();
