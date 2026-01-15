import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import { AtmosphereProvider } from './contexts/AtmosphereProvider';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-center p-6 text-white">
      <div className="text-[#d4af37] text-4xl mb-4">⚠️</div>
      <h2 className="text-2xl font-serif font-bold mb-2">Oops! Something went wrong</h2>
      <p className="text-slate-400 mb-6">{error.message}</p>
      <div className="flex gap-4">
        <button onClick={resetErrorBoundary} className="px-6 py-2 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">Try again</button>
        <button onClick={() => window.location.href = '/'} className="px-6 py-2 bg-[#d4af37] text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors">Go home</button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AtmosphereProvider>
        <App />
      </AtmosphereProvider>
    </ErrorBoundary>
  </React.StrictMode>
);