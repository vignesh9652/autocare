import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './lib/query-client';
import { useThemeStore, applyTheme } from './stores/theme-store';
import { ToastViewport } from './components/ui/ToastViewport';
import './index.css';

// Apply persisted theme before first paint
applyTheme(useThemeStore.getState().dark);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <ToastViewport />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
