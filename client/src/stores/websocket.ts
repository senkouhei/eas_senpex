let ws: WebSocket | null = null;
let isConnected = false;

export function useDashboardWebSocket(callback: (msg: any) => void, onClose: () => void) {
  if (isConnected) return;
  ws = new WebSocket('ws://localhost:5000/ws');
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
