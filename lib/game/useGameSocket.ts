
export function useGameSocket(url,onMsg){
  let ws=new WebSocket(url);
  ws.onmessage=e=>onMsg(JSON.parse(e.data));
  function send(t){ws.send(JSON.stringify(t));}
  return {send};
}
