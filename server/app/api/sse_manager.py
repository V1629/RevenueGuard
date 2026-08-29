import asyncio
import json

class SSEManager:
    def __init__(self):
        self.clients = set()
        
    def connect(self):
        queue = asyncio.Queue()
        self.clients.add(queue)
        print(f"[SSE] Client connected. Active: {len(self.clients)}")
        return queue
        
    def disconnect(self, queue):
        if queue in self.clients:
            self.clients.remove(queue)
            print(f"[SSE] Client disconnected. Active: {len(self.clients)}")
            
    def broadcast(self, data):
        # We don't block the caller
        for q in list(self.clients):
            try:
                q.put_nowait(json.dumps(data))
            except asyncio.QueueFull:
                pass

sse_manager = SSEManager()
