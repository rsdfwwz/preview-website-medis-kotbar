import React from 'react';
import ReactDOM from 'react-dom/client';
import { PortalProvider } from '@/context/PortalContext';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PortalProvider>
      <App />
    </PortalProvider>
  </React.StrictMode>
);