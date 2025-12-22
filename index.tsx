import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import { AtmosphereProvider } from './contexts/AtmosphereProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AtmosphereProvider>
        <App />
      </AtmosphereProvider>
    </ErrorBoundary>
  </React.StrictMode>
);