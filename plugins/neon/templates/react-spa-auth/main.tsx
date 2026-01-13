/**
 * React SPA Main Entry with Neon Auth
 *
 * File: src/main.tsx
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';
import '@neondatabase/neon-js/ui/css';
import App from './App';
import { authClient } from './auth';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NeonAuthUIProvider
      authClient={authClient}
      social={{ providers: ['google', 'github'] }}
      credentials={{ forgotPassword: true }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </NeonAuthUIProvider>
  </StrictMode>
);
