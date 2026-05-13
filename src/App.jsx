import { useState, useEffect, useRef } from 'react';
import { Home, PieChart, Wallet, Plus, Settings, Loader2, CheckCircle, AlertCircle, Info, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Summary from './components/Summary';
import Analytics from './components/Analytics';
import Portfolio from './components/Portfolio';
import Reports from './components/Reports';
import Commitments from './components/Commitments';
import ExpenseForm from './components/ExpenseForm';
import SettingsScreen from './components/SettingsScreen';
import ExpenseDetailsModal from './components/ExpenseDetailsModal';
import AuthScreen from './components/AuthScreen';
import OnboardingScreen from './components/OnboardingScreen';
import SidebarMenu from './components/SidebarMenu';
import HelpScreen from './components/HelpScreen';
import { useFinance } from './context/FinanceContext';
import { getCycleInfo } from './utils/financeUtils';

function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const { state, user, authLoading, dataLoading, skipLoading, needsOnboarding, completeOnboarding, signOut, updateSettings, toasts } = useFinance();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  // Always go to current month when pressing Inicio
  const goHome = () => {
    setIsSidebarOpen(false);
    updateSettings({ selectedMonth: state.currentCiclo?.nombre || null });
    setCurrentScreen('dashboard');
  };

  // ─── Auth gate ───
  if (authLoading) {
    return (
      <div className="app-init-loader">
        <h1 className="logo-big" translate="no">Finly<span className="logo-dot">.</span></h1>
        <Loader2 size={32} className="spin" style={{ color: 'var(--green)' }} />
        <p>Iniciando experiencia premium...</p>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  if (needsOnboarding) return <OnboardingScreen user={user} onComplete={completeOnboarding} />;

  const handleMonthSelect = (monthKey) => {
    updateSettings({ selectedMonth: monthKey });
    setCurrentScreen('dashboard');
  };

  const renderScreen = () => {
    if (dataLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', flexDirection: 'column', gap: '12px' }}>
          <Loader2 size={32} style={{ color: 'var(--green)', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>Cargando tus datos...</p>
          <button 
            onClick={skipLoading}
            style={{ marginTop: '20px', background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ¿Tarda mucho? Entrar de todos modos
          </button>
        </div>
      );
    }

    switch (currentScreen) {
      case 'dashboard': return <Dashboard onSelectExpense={setSelectedExpense} />;
      case 'summary': return <Summary onSelectExpense={setSelectedExpense} />;
      case 'analytics': return <Analytics />;
      case 'portfolio': return <Portfolio />;
      case 'reports': return <Reports onMonthSelect={handleMonthSelect} />;
      case 'commitments': return <Commitments />;
      case 'add': return <ExpenseForm onSave={() => setCurrentScreen('dashboard')} />;
      case 'settings': return <SettingsScreen onSave={() => setCurrentScreen('dashboard')} />;
      case 'help': return <HelpScreen />;
      default: return <Dashboard onSelectExpense={setSelectedExpense} />;
    }
  };

  const getMonthDisplay = () => {
    const mk = state.selectedMonth || state.currentCiclo?.nombre;
    const today = new Date();
    
    // If viewing the current cycle (or if no specific past cycle is selected)
    if (!state.selectedMonth || state.selectedMonth === state.currentCiclo?.nombre) {
      return today.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
    }

    // If viewing a past history month
    if (mk) {
      const [year, month] = mk.split('-').map(Number);
      const d = new Date(year, month - 1);
      const label = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
      return `Historial: ${label.charAt(0).toUpperCase() + label.slice(1)}`;
    }
    
    return 'Cargando...';
  };

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' && <CheckCircle size={18} />}
          {t.type === 'error' && <AlertCircle size={18} />}
          {t.type === 'info' && <Info size={18} />}
          {t.message}
        </div>
      ))}
    </div>
  );

  const DesktopSidebar = () => (
    <aside className="desktop-sidebar">
      <div className="logo" translate="no">Finly<span className="logo-dot">.</span></div>
      <div className="sidebar-links">
        <button className={`sidebar-link ${currentScreen === 'dashboard' ? 'active' : ''}`} onClick={goHome}>
          <Home size={20} /> Inicio
        </button>
        <button className={`sidebar-link ${currentScreen === 'summary' ? 'active' : ''}`} onClick={() => setCurrentScreen('summary')}>
          <PieChart size={20} /> Movimientos
        </button>
        <button className={`sidebar-link ${currentScreen === 'portfolio' ? 'active' : ''}`} onClick={() => setCurrentScreen('portfolio')}>
          <Wallet size={20} /> Cartera
        </button>
        <button className={`sidebar-link ${currentScreen === 'analytics' ? 'active' : ''}`} onClick={() => setCurrentScreen('analytics')}>
          <PieChart size={20} /> Análisis
        </button>
        <button className={`sidebar-link ${currentScreen === 'add' ? 'active' : ''}`} onClick={() => setCurrentScreen('add')}>
          <Plus size={20} /> Nuevo Gasto
        </button>
      </div>
      <div className="sidebar-links" style={{ marginTop: 'auto' }}>
        <button className={`sidebar-link ${currentScreen === 'settings' ? 'active' : ''}`} onClick={() => setCurrentScreen('settings')}>
          <Settings size={20} /> Ajustes
        </button>
      </div>
    </aside>
  );

  return (
    <div id="app">
      <ToastContainer />
      <DesktopSidebar />

      <div className="main-content">
        <main id={`screen-${currentScreen}`} className="screen active" style={{ paddingBottom: '80px' }}>
          <header className="screen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', width: '100%' }}>
            {/* Left: Spacer/Logo container to maintain flex balance */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div className="logo" translate="no" style={{ fontSize: '1.5rem', margin: 0 }}>Finly<span className="logo-dot">.</span></div>
            </div>
            
            {/* Center: Date */}
            <div style={{ 
              fontSize: '0.8rem', fontWeight: 700, color: 'var(--text2)', 
              background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '16px', border: '1px solid var(--glass-border)',
              textAlign: 'center', whiteSpace: 'nowrap'
            }}>
              {getMonthDisplay()}
            </div>

            {/* Right: Avatar */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', 
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                  padding: '4px 14px 4px 4px', borderRadius: '24px', cursor: 'pointer', transition: 'all 0.2s' 
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontSize: '14px', fontWeight: '900' }}>
                  {(user?.user_metadata?.nombre || user?.email || '?').charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>
                  {user?.user_metadata?.nombre ? user.user_metadata.nombre.split(' ')[0] : 'Perfil'}
                </span>
              </button>
            </div>
          </header>

          {renderScreen()}
        </main>
      </div>

      {/* Expense Details Modal */}
      {selectedExpense && (
        <ExpenseDetailsModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
        />
      )}

      <SidebarMenu 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={setCurrentScreen} 
      />

      {/* Bottom Nav (Trii Style) */}
      <nav className="bottom-nav">
        <button className={`nav-btn ${currentScreen === 'dashboard' ? 'active' : ''}`} onClick={goHome}>
          <Home size={22} /><span>Inicio</span>
        </button>
        <button className={`nav-btn ${currentScreen === 'summary' ? 'active' : ''}`} onClick={() => { setIsSidebarOpen(false); setCurrentScreen('summary'); }}>
          <PieChart size={22} /><span>Movimientos</span>
        </button>
        
        <div className="fab-center-container">
          <button 
            className={`fab-center ${currentScreen === 'add' ? 'active' : ''}`} 
            onClick={() => { setIsSidebarOpen(false); setCurrentScreen('add'); }}
            aria-label="Agregar gasto"
          >
            <Plus size={28} />
            <span className="fab-center-text">Nuevo Gasto</span>
          </button>
        </div>

        <button className={`nav-btn ${currentScreen === 'portfolio' ? 'active' : ''}`} onClick={() => { setIsSidebarOpen(false); setCurrentScreen('portfolio'); }}>
          <Wallet size={22} /><span>Cartera</span>
        </button>
        <button className={`nav-btn ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <User size={22} /><span>Perfil</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
