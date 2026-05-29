import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { AuthProvider } from './hooks/useAuth.jsx';
import App from './App.jsx';
import './styles/global.css';

// Register service worker — auto-updates silently
registerSW({ onNeedRefresh() {}, onOfflineReady() {} });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
