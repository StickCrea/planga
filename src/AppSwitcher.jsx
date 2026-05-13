import React, { useState } from 'react';
import App from './App.jsx';
import { FinanceProvider } from './context/FinanceContext.jsx';
import StoreFront from './components/StoreFront.jsx';
import { Wallet, Store } from 'lucide-react';

export default function AppSwitcher() {
  const [selectedApp, setSelectedApp] = useState(() => {
    // Hidden backdoor to access the store: localhost:5173/?admin=tienda
    return window.location.search.includes('admin=tienda') ? 'store' : 'finly';
  });

  if (selectedApp === 'store') {
    return <StoreFront onExit={() => window.location.href = '/'} />;
  }

  // Default for everyone else is the main Finly app
  return (
    <FinanceProvider>
      <App />
    </FinanceProvider>
  );
}
