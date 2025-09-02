const ws = new WebSocket('ws://localhost:9090');

ws.onopen = () => console.log('Connected to WebSocket server');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  document.getElementById('weight').innerText = `Weight: ${data.weight}`;
};

ws.onerror = (err) => console.error('WebSocket error:', err);
ws.onclose = () => console.log('WebSocket connection closed');
