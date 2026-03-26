import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error suppression for benign environment-specific errors
if (typeof window !== 'undefined') {
  // 🛠️ JUGAAD: Override WebSocket constructor to ignore Vite HMR attempts
  const OriginalWebSocket = window.WebSocket;
  const MockWebSocket = function(url: string, protocols?: string | string[]) {
    if (url.includes('vite') || url.includes('hmr')) {
      console.warn('🚫 [Jugaad] Blocked Vite HMR WebSocket attempt:', url);
      // Return a dummy object that looks like a WebSocket but does nothing
      return {
        addEventListener: () => {},
        removeEventListener: () => {},
        send: () => {},
        close: () => {},
        readyState: 3, // CLOSED
        url: url,
        onopen: null,
        onmessage: null,
        onerror: null,
        onclose: null,
      };
    }
    return new OriginalWebSocket(url, protocols);
  };
  MockWebSocket.prototype = OriginalWebSocket.prototype;
  
  try {
    Object.defineProperty(window, 'WebSocket', {
      value: MockWebSocket,
      configurable: true,
      writable: true
    });
  } catch (e) {
    console.warn('⚠️ [Jugaad] Failed to override WebSocket directly, attempting fallback...');
    (window as any).WebSocket = MockWebSocket;
  }

  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || '';
    if (
      msg.includes('WebSocket closed without opened') || 
      msg.includes('failed to connect to websocket') ||
      msg.includes('vite')
    ) {
      event.preventDefault();
      console.warn('🤫 Suppressed environment-specific WebSocket rejection');
    }
  });

  window.addEventListener('error', (event) => {
    if (event.message.includes('WebSocket')) {
      event.preventDefault();
    }
  });
}

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
