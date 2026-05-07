import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// CommonJS polyfills for Vite
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}
if (typeof (window as any).require === 'undefined') {
  (window as any).require = (name: string) => {
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
