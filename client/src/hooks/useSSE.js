import { useState, useEffect } from 'react';

export default function useSSE(url) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource(url);
    
    source.onopen = () => {
      setConnected(true);
      console.log('SSE Connected to', url);
    };
    
    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'CONNECTED') return; // Ignore initial connection ping
        
        setEvents(prev => {
          // Keep last 100 events
          const newEvents = [data, ...prev];
          if (newEvents.length > 100) return newEvents.slice(0, 100);
          return newEvents;
        });
      } catch (err) {
        console.error('Failed to parse SSE data', err);
      }
    };
    
    source.onerror = (e) => {
      setConnected(false);
      console.error('SSE Connection error', e);
    };

    return () => {
      source.close();
    };
  }, [url]);

  const clearEvents = () => setEvents([]);

  return { events, connected, clearEvents };
}
