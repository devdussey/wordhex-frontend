export function useMultiplayerSocket({
  url,
  onEvent
}: {
  url?: string;
  onEvent: (ev: any) => void;
}) {
  let ws: WebSocket | null = null;
  const reconnectDelay = 2000;
  const wsUrl = url || 'wss://wordhex-backend.onrender.com';

  async function connect() {
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        try {
          onEvent(JSON.parse(e.data));
        } catch {
          // ignore parsing errors
        }
      };
      ws.onclose = () => {
        ws = null;
        setTimeout(connect, reconnectDelay);
      };
    } catch (error) {
      console.error('Failed to connect multiplayer socket', error);
      ws = null;
      setTimeout(connect, reconnectDelay);
    }
  }

  connect();

  function send(obj: any) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    } else {
      setTimeout(() => send(obj), 500);
    }
  }

  return { send };
}
