
import { buildAuthenticatedWsUrl } from '@/lib/game/wsAuth';

export function useMultiplayerSocket({
  url,
  onEvent
}: {
  url?: string;
  onEvent: (ev: any) => void;
}) {
  let ws: WebSocket | null = null;
  const reconnectDelay = 2000;

  async function connect() {
    try {
      const target = await buildAuthenticatedWsUrl(url);
      if (!target) {
        console.warn('Multiplayer socket waiting for Supabase session before connecting');
        setTimeout(connect, reconnectDelay);
        return;
      }

      ws = new WebSocket(target);
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
