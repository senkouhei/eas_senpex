let ws: WebSocket | null = null;
let isConnected = false;

const WS_URL = (import.meta as any).env?.PORT ?
               'ws://localhost:' + (import.meta as any).env?.PORT + "/ws" : 'ws://localhost:5000/ws';

export function useDashboardWebSocket(callback: (msg: any) => void, onClose: () => void) {
  if (isConnected) return;
  ws = new WebSocket(WS_URL);
  isConnected = true;

  ws.onmessage = (event) => {
    console.log('WebSocket message:', event.data);
    try {
      const msg = JSON.parse(event.data);
      callback(msg);
    } catch (e) {
      console.error('WebSocket message error:', e);
    }
  };
  ws.onclose = () => {
    ws = null;
    isConnected = false;
    onClose();
    setTimeout(() => useDashboardWebSocket(callback, onClose), 1000);
  };
}
