
export function useMultiplayerSocket({ url, onEvent }:{
  url:string,
  onEvent:(ev:any)=>void
}){
  let ws:WebSocket|null=null;
  function connect(){
    ws = new WebSocket(url);
    ws.onmessage = e => {
      try{ onEvent(JSON.parse(e.data)); }catch{}
    };
    ws.onclose = ()=> setTimeout(connect, 2000);
  }
  connect();
  function send(obj:any){
    if(ws && ws.readyState===1) ws.send(JSON.stringify(obj));
  }
  return { send };
}
