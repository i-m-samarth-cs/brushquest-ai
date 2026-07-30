import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const rootEl = document.getElementById('root');

// Reveal the root only after React finishes its first paint, preventing FOUC.
function onFirstRender() {
  rootEl.classList.add('loaded');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App onFirstRender={onFirstRender} />
  </React.StrictMode>
);
