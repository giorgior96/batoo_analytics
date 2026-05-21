import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const DASHBOARD_URL = 'https://analytics.batoo.it/en/dashboard'

if (window.location.href !== DASHBOARD_URL) {
  window.location.replace(DASHBOARD_URL)
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
