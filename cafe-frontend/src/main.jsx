import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppRouter } from './router'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  </React.StrictMode>
)
