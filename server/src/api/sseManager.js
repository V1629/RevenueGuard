/**
 * SSE Manager — Server-Sent Events for real-time agent activity streaming.
 * Manages multiple client connections and broadcasts events.
 */

class SSEManager {
  constructor() {
    this.clients = new Map();
    this.clientIdCounter = 0;
  }

  /**
   * Register a new SSE client connection.
   */
  addClient(req, res) {
    const clientId = ++this.clientIdCounter;

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`);

    // Keep-alive ping every 30 seconds
    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 30000);

    this.clients.set(clientId, { res, keepAlive });

    // Remove client on disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
      this.clients.delete(clientId);
      console.log(`[SSE] Client ${clientId} disconnected. Active: ${this.clients.size}`);
    });

    console.log(`[SSE] Client ${clientId} connected. Active: ${this.clients.size}`);
    return clientId;
  }

  /**
   * Broadcast an event to all connected clients.
   */
  broadcast(event) {
    const data = JSON.stringify({
      ...event,
      serverTimestamp: new Date().toISOString(),
    });

    for (const [clientId, client] of this.clients) {
      try {
        client.res.write(`data: ${data}\n\n`);
      } catch (err) {
        console.error(`[SSE] Error sending to client ${clientId}:`, err.message);
        this.clients.delete(clientId);
      }
    }
  }

  /**
   * Send to a specific client.
   */
  sendToClient(clientId, event) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const data = JSON.stringify({ ...event, serverTimestamp: new Date().toISOString() });
      client.res.write(`data: ${data}\n\n`);
    } catch (err) {
      console.error(`[SSE] Error sending to client ${clientId}:`, err.message);
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}

module.exports = new SSEManager();
