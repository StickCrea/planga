import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { FinanceProvider } from './context/FinanceContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FinanceProvider>
      <App />
    </FinanceProvider>
  </React.StrictMode>,
)
