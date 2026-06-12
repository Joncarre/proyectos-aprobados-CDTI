import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initUrlSync } from './state/urlSync';
import './index.css';

initUrlSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
