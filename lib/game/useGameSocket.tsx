export function useGameSocket(url: string, onMsg: (event: any) => void) {
  let ws: WebSocket | null = null;
  const reconnectDelay = 2000;

  async function connect() {
    try {
      ws = new WebSocket(url);
      ws.onmessage = (e) => {
        onMsg(JSON.parse(e.data));
      };
      ws.onclose = () => {
        ws = null;
        setTimeout(connect, reconnectDelay);
      };
    } catch (error) {
      console.error('Failed to connect game socket', error);
      ws = null;
      setTimeout(connect, reconnectDelay);
    }
  }

  connect();

  function send(t: any) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(t));
    } else {
      setTimeout(() => send(t), 500);
    }
  }

  return { send };
}
