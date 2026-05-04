import { useState } from 'react';
import { Home, PieChart, Wallet, Plus, Settings, BarChart2, Globe, ListChecks } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Summary from './components/Summary';
import Analytics from './components/Analytics';
import Portfolio from './components/Portfolio';
import Reports from './components/Reports';
import Commitments from './components/Commitments';
import ExpenseForm from './components/ExpenseForm';
import SettingsScreen from './components/SettingsScreen';
import ExpenseDetailsModal from './components/ExpenseDetailsModal';
import { useFinance } from './context/FinanceContext';
import { getCycleInfo } from './utils/financeUtils';

function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const { state, updateSettings } = useFinance();

  const handleMonthSelect = (monthKey) => {
    updateSettings({ selectedMonth: monthKey });
    setCurrentScreen('dashboard');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard': return <Dashboard onSelectExpense={setSelectedExpense} />;
      case 'summary': return <Summary onSelectExpense={setSelectedExpense} />;
      case 'analytics': return <Analytics />;
      case 'portfolio': return <Portfolio />;
      case 'reports': return <Reports onMonthSelect={handleMonthSelect} />;
      case 'commitments': return <Commitments />;
      case 'add': return <ExpenseForm onSave={() => setCurrentScreen('dashboard')} />;
      case 'settings': return <SettingsScreen onSave={() => setCurrentScreen('dashboard')} />;
      default: return <Dashboard onSelectExpense={setSelectedExpense} />;
    }
  };

  const getMonthDisplay = () => {
    if (state.selectedMonth) {
      const [year, month] = state.selectedMonth.split('-').map(Number);
      const d = new Date(year, month - 1);
      return d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    }
    const cycle = getCycleInfo(new Date(), state.cycleDay);
    const [year, month] = cycle.monthKey.split('-').map(Number);
    const d = new Date(year, month - 1);
    return d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  };

  return (
    <div id="app">
      <main id={`screen-${currentScreen}`} className="screen active" style={{ paddingBottom: '80px' }}>
        <header className="screen-header">
          <div className="logo">Planga<span className="logo-dot">.</span></div>
          <div className="month-selector">
            <span className="month-label" style={{ textTransform: 'capitalize' }}>
              {getMonthDisplay()}
            </span>
          </div>
          <button className="icon-btn" onClick={() => setCurrentScreen('settings')}>
            <Settings size={20} />
          </button>
        </header>

        {renderScreen()}
      </main>

      {/* Expense Details Modal */}
      {selectedExpense && (
        <ExpenseDetailsModal 
          expense={selectedExpense} 
          onClose={() => setSelectedExpense(null)} 
        />
      )}

      {/* FAB for add expense */}
      {currentScreen !== 'add' && (
        <button className="fab" onClick={() => setCurrentScreen('add')}>
          <Plus size={28} />
        </button>
      )}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button 
          className={`nav-btn ${currentScreen === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('dashboard')}
        >
          <Home size={22} />
          <span>Inicio</span>
        </button>
        <button 
          className={`nav-btn ${currentScreen === 'summary' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('summary')}
        >
          <PieChart size={22} />
          <span>Resumen</span>
        </button>
        <button 
          className={`nav-btn ${currentScreen === 'analytics' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('analytics')}
        >
          <BarChart2 size={22} />
          <span>Análisis</span>
        </button>
        <button 
          className={`nav-btn ${currentScreen === 'portfolio' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('portfolio')}
        >
          <Wallet size={22} />
          <span>Cartera</span>
        </button>
        <button 
          className={`nav-btn ${currentScreen === 'reports' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('reports')}
        >
          <Globe size={22} />
          <span>Global</span>
        </button>
        <button 
          className={`nav-btn ${currentScreen === 'commitments' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('commitments')}
        >
          <ListChecks size={22} />
          <span>Compromisos</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
