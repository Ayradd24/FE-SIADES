import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

type BrowserWindowWithPolyfills = Window & {
  global?: Window;
  require?: (name: string) => Record<string, unknown>;
};

const browserWindow = window as BrowserWindowWithPolyfills;

// CommonJS polyfills for Vite
if (typeof browserWindow.global === 'undefined') {
  browserWindow.global = window;
}
if (typeof browserWindow.require === 'undefined') {
  browserWindow.require = (name: string) => {
    console.warn(`Browser-side require called for: ${name}`);
    return {};
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
