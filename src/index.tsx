import React from 'react';
import { createRoot } from 'react-dom/client';
import { PlayerDemo } from './Player';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <PlayerDemo />
  </React.StrictMode>
);
