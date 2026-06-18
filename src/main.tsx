import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './index.css'

// Restore dark mode preference on load
const stored = localStorage.getItem('mengu-ui')
if (stored) {
  try {
    const parsed = JSON.parse(JSON.parse(stored).state || '{}')
    if (parsed.darkMode) document.documentElement.classList.add('dark')
  } catch { /* ignore */ }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
