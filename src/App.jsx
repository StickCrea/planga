import { useState } from 'react';
import { Home, PieChart, Wallet, Plus, Settings, Loader2, CheckCircle, AlertCircle, Info, User, Calendar } from 'lucide-react';
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
import ResetPasswordScreen from './components/ResetPasswordScreen';
import OnboardingScreen from './components/OnboardingScreen';
import SidebarMenu from './components/SidebarMenu';
import HelpScreen from './components/HelpScreen';
import { useFinance } from './context/FinanceContext';
import { getCycleInfo, formatDateRange } from './utils/financeUtils';

function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const { state, user, authLoading, dataLoading, skipLoading, needsOnboarding, completeOnboarding, passwordRecovery, updateSettings, toasts } = useFinance();
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

  if (passwordRecovery) return <ResetPasswordScreen />;

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

  const getMonthDisplay = (short = false) => {
    const mk = state.selectedMonth || state.currentCiclo?.nombre;
    
    // If viewing the current cycle (or if no specific past cycle is selected)
    if (!state.selectedMonth || state.selectedMonth === state.currentCiclo?.nombre) {
      if (state.currentCiclo) {
        return `Ciclo: ${formatDateRange(state.currentCiclo.fecha_inicio, state.currentCiclo.fecha_fin, short)}`;
      }
      // Calculate current cycle locally as a fallback if state.currentCiclo is not loaded yet
      const cd = state.cycleDay || 25;
      const fallbackCycle = getCycleInfo(new Date(), cd);
      const startStr = fallbackCycle.startDate.toISOString().slice(0, 10);
      const endStr = fallbackCycle.endDate.toISOString().slice(0, 10);
      return `Ciclo: ${formatDateRange(startStr, endStr, short)}`;
    }

    // If viewing a past history month
    if (mk) {
      const [year, month] = mk.split('-').map(Number);
      const representativeDate = new Date(year, month - 1, 15);
      const cycleInfo = getCycleInfo(representativeDate, state.cycleDay);
      const startStr = cycleInfo.startDate.toISOString().slice(0, 10);
      const endStr = cycleInfo.endDate.toISOString().slice(0, 10);
      return `Historial: ${formatDateRange(startStr, endStr, short)}`;
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
        <main id={`screen-${currentScreen}`} className="screen active">
          <header className="screen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', width: '100%', gap: '8px' }}>
            {/* Left: Spacer/Logo container to maintain flex balance */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
              <div className="logo" translate="no" style={{ fontSize: '1.5rem', margin: 0 }}>Finly<span className="logo-dot">.</span></div>
            </div>
            
            {/* Center: Active Billing Cycle Pill with Calendar Icon */}
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 230, 118, 0.08)', 
              padding: '8px 14px', 
              borderRadius: '20px', 
              border: '1px solid rgba(0, 230, 118, 0.3)',
              boxShadow: '0 0 12px rgba(0, 230, 118, 0.12)',
              textAlign: 'center', 
              whiteSpace: 'nowrap', 
              flexShrink: 0,
              letterSpacing: '0.3px'
            }} className="header-date-pill">
              <Calendar size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <span className="date-text-full" style={{ fontSize: 'clamp(0.72rem, 2.5vw, 0.85rem)', fontWeight: 800, color: 'var(--green)' }}>
                {getMonthDisplay(false)}
              </span>
              <span className="date-text-short" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--green)' }}>
                {getMonthDisplay(true)}
              </span>
            </div>

            {/* Right: Avatar with squircle gradient profile */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', 
                  background: 'rgba(0, 230, 118, 0.03)', border: '1px solid rgba(0, 230, 118, 0.15)',
                  padding: '4px 10px 4px 4px', borderRadius: '24px', cursor: 'pointer', transition: 'all 0.2s',
                  maxWidth: '100%',
                  boxShadow: '0 0 10px rgba(0, 230, 118, 0.04)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(0, 230, 118, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(0, 230, 118, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.15)';
                }}
              >
                <div style={{ 
                  width: '30px', height: '30px', borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #00E676, #059669)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: '#0A0F1E', fontSize: '13px', fontWeight: '900', flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0, 230, 118, 0.3)'
                }}>
                  {(user?.user_metadata?.nombre || user?.email || '?').charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', letterSpacing: '0.3px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
