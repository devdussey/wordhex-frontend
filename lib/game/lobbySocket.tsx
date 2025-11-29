
class _LS {
  handlers: ((event: any) => void)[];
  ws: WebSocket | null;
  url: string;
  reconnectDelay: number;

  constructor(){
    this.handlers = [];
    this.ws = null;
    this.url = process.env.NEXT_PUBLIC_WS_URL || 'wss://wordhex-backend.onrender.com';
    this.reconnectDelay = 2000;
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('LobbySocket connected to backend');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data);
        } catch (error) {
          console.error('Failed to parse lobby message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('LobbySocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('LobbySocket disconnected, reconnecting in', this.reconnectDelay, 'ms');
        setTimeout(() => this.connect(), this.reconnectDelay);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  on(fn: (event: any) => void) {
    this.handlers.push(fn);
  }

  send(ev: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(ev));
    } else {
      console.warn('LobbySocket not connected, queuing message:', ev);
      // Retry after a short delay
      setTimeout(() => this.send(ev), 500);
    }
  }

  emit(ev: any) {
    this.handlers.forEach(h => h(ev));
  }
}

export const LobbySocket = new _LS();
