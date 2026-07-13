import App from './App.jsx';
import { FinanceProvider } from './context/FinanceContext.jsx';

export default function AppSwitcher() {
  return (
    <FinanceProvider>
      <App />
    </FinanceProvider>
  );
}
