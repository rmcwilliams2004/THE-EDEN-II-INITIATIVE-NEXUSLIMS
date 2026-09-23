import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle Google Maps authentication failures and benign cross-origin script errors gracefully
if (typeof window !== 'undefined') {
  (window as any).gm_authFailure = () => {
    console.warn('[Google Maps] Authentication notification handled. Switching to high-res GIS telemetry view.');
  };

  window.addEventListener('error', (event) => {
    if (event.message === 'Script error.' || event.message?.includes('google')) {
      // Prevent cross-origin script error from crashing the application shell
      event.preventDefault();
      console.warn('[Telemetry Core] Caught external script event:', event.message);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
