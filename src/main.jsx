import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'jotai';
import App from './App';
import '../style.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <Provider>
      <App />
    </Provider>
  );
}
