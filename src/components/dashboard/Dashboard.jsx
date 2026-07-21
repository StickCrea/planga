import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  getAvailableMoney, getDaysRemaining, getDailyBudget,
  getTotalSpent, getStatus, getCurrentMonthExpenses,
  getTotalCommitments, getTotalIncome, getMonthKey,
  fmt, formatColombianInput, parseColombianInput, CATEGORY_ICONS
} from '../../utils/financeUtils';
import { TrendingDown, Activity, Repeat, Plus } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard({ onSelectExpense }) {
  const { state, addIncome, showToast } = useFinance();

  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ name: '', amount: '' });

  const handleAddIncome = (e) => {
    e.preventDefault();
    const parsedAmount = parseColombianInput(incomeForm.amount);
    if (parsedAmount <= 0) { showToast('Ingresa un monto válido', 'error'); return; }
    addIncome({ id: 'i' + Date.now(), month: getMonthKey(state), name: incomeForm.name || 'Ingreso', amount: parsedAmount });
    showToast('Ingreso registrado', 'success');
    setIsIncomeModalOpen(false);
    setIncomeForm({ name: '', amount: '' });
  };

  const totalIncome = getTotalIncome(state);
  const available = getAvailableMoney(state);
  const daysLeft = getDaysRemaining(state);
  const dailyBudget = getDailyBudget(state);
  const totalSpent = getTotalSpent(state);
  const status = getStatus(state);
  const expenses = getCurrentMonthExpenses(state);
  const commitmentsTotal = getTotalCommitments(state);
  
  // Calculate days elapsed since cycle start
  const today = new Date();
  const cycleStart = state.currentCiclo
    ? new Date(state.currentCiclo.fecha_inicio + 'T00:00:00')
    : today;
  const daysElapsed = Math.max(Math.ceil((today - cycleStart) / (1000 * 60 * 60 * 24)) + 1, 1);
  const dailyAvg = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
  
  const spentPercent = state.income > 0 ? Math.min(totalSpent / state.income * 100, 100) : 0;
  
  const circumference = 2 * Math.PI * 48;
  const offset = circumference - (spentPercent / 100) * circumference;
  const ringColor = spentPercent > 90 ? 'var(--red)' : spentPercent > 70 ? 'var(--yellow)' : 'var(--green)';

  const recentExpenses = expenses.slice(0, 4);

  // Masking utility helper (always visible)
  const mask = (val) => fmt(val);

  const generateChartData = () => {
    if (!state.currentCiclo) return { labels: [], datasets: [] };
    
    const start = new Date(state.currentCiclo.fecha_inicio + 'T00:00:00');
    const end = new Date(state.currentCiclo.fecha_fin + 'T23:59:59');
    
    const totalDays = Math.max(Math.ceil((end - start) / (1000 * 60 * 60 * 24)), 1);
    
    const labels = [];
    const idealData = [];
    const realData = [];
    
    const totalBudget = state.income - commitmentsTotal;
    const idealDailyRate = totalBudget > 0 ? totalBudget / totalDays : 0;
    
    const expensesByDate = {};
    expenses.forEach(e => {
      const expDateStr = e.date;
      expensesByDate[expDateStr] = (expensesByDate[expDateStr] || 0) + e.amount;
    });
    
    let accumulatedReal = 0;
    let accumulatedIdeal = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    
    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = currentDate.toISOString().slice(0, 10);
      
      const dayLabel = currentDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
      labels.push(dayLabel);
      
      accumulatedIdeal += idealDailyRate;
      idealData.push(Math.round(accumulatedIdeal));
      
      if (currentDate <= new Date() || dateStr === todayStr) {
        accumulatedReal += (expensesByDate[dateStr] || 0);
        realData.push(accumulatedReal);
      }
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Gasto real',
          data: realData,
          borderColor: '#00E676',
          borderWidth: 2,
          fill: true,
          // Relleno con degradado verde→transparente para dar profundidad al área.
          backgroundColor: (ctx) => {
            const { chart } = ctx;
            const area = chart.chartArea;
            if (!area) return 'rgba(0, 230, 118, 0.12)';
            const g = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
            g.addColorStop(0, 'rgba(0, 230, 118, 0.30)');
            g.addColorStop(1, 'rgba(0, 230, 118, 0.01)');
            return g;
          },
          tension: 0.3,
          // Solo el punto de "hoy" (el último) es visible y grande: es lo que importa.
          pointRadius: (ctx) => ctx.dataIndex === ctx.dataset.data.length - 1 ? 5 : 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#00E676',
          pointBorderColor: '#0A0F1E',
          pointBorderWidth: 2,
        },
        {
          label: 'Ritmo ideal',
          data: idealData,
          borderColor: 'rgba(245, 245, 245, 0.30)',
          borderDash: [5, 5],
          fill: false,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
          borderWidth: 1.5,
        }
      ]
    };
  };

  // Chart.js dibuja en canvas y NO resuelve variables CSS (var(--x)); requiere
  // valores de color reales, si no el texto cae al gris oscuro por defecto e
  // "desaparece" sobre el fondo. Por eso aquí van hex de las tintas de marca.
  const FONT = "'Inter', system-ui, sans-serif";
  const compactPeso = (v) => {
    if (Math.abs(v) >= 1000000) return '$' + (v / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (Math.abs(v) >= 1000) return '$' + Math.round(v / 1000) + 'k';
    return '$' + v;
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: '#F5F5F5',
          usePointStyle: true,
          pointStyle: 'line',
          boxWidth: 18,
          padding: 16,
          font: { size: 11, family: FONT, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 15, 30, 0.95)',
        titleColor: '#F5F5F5',
        bodyColor: '#A0AEC0',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        titleFont: { family: FONT, weight: '700', size: 12 },
        bodyFont: { family: FONT, size: 12 },
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${mask(ctx.parsed.y)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: 'rgba(255, 255, 255, 0.08)' },
        ticks: {
          color: '#A0AEC0',
          font: { size: 10, family: FONT },
          maxRotation: 0,
          maxTicksLimit: 6
        }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        border: { display: false },
        ticks: {
          color: '#A0AEC0',
          font: { size: 10, family: FONT },
          maxTicksLimit: 5,
          callback: (value) => compactPeso(value)
        }
      }
    }
  };

  if (!state.currentCiclo && !state.income) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center', marginTop: '20px' }}>
        <p style={{ color: 'var(--text3)' }}>No hay un ciclo activo. Ve a Ajustes para configurar tu presupuesto.</p>
      </div>
    );
  }

  return (
    <>
      <div className={`status-banner status-${status.level}`}>
        <span>{status.icon}</span>
        <span>{status.text}</span>
      </div>

      <div className={`glass-card main-card pulse-border-${status.level}`}>
        <h2 className="card-label">Dinero Disponible</h2>
        <div className="money-big">{mask(available)}</div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '14px', lineHeight: 1.4 }}>
          Esto es lo que te queda para gastar hasta el fin del ciclo.
        </p>

        {/* Centrado (no space-between) para que "Recibido" y el botón formen un
            grupo cohesionado bajo el número y no dejen un hueco vacío al medio
            en pantallas anchas. flexWrap protege el celular. */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '10px 14px', marginBottom: '14px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
            Recibido este ciclo: <strong style={{ color: 'var(--text)' }}>{mask(totalIncome)}</strong>
          </span>
          <button
            type="button"
            onClick={() => setIsIncomeModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--green-glow)', color: 'var(--green)', border: '1px solid var(--green)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
          >
            <Plus size={14} /> Ingreso
          </button>
        </div>

        <div className="card-row">
          <div className="card-stat">
            <span className="stat-label">Días Restantes</span>
            <span className="stat-value">{daysLeft}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: '2px' }}>Para fin de ciclo</span>
          </div>
          <div className="card-divider"></div>
          <div className="card-stat">
            <span className="stat-label">Presupuesto Diario</span>
            <span className="stat-value stat-highlight" style={{ color: `var(--${status.level})` }}>
              {mask(dailyBudget)}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: '2px' }}>Límite sugerido por hoy</span>
          </div>
        </div>
      </div>

      <div className="glass-card progress-card">
        <div className="progress-ring-container">
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle className="progress-ring-bg" cx="55" cy="55" r="48" />
            <circle 
              className="progress-ring-fill" 
              cx="55" cy="55" r="48" 
              style={{ strokeDashoffset: offset, stroke: ringColor }}
            />
          </svg>
          <div className="progress-ring-text">
            <span className="ring-percent">{Math.round(spentPercent)}%</span>
            <span className="ring-label">Gastado</span>
          </div>
        </div>
        <div className="progress-stats" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', justifyContent: 'center' }}>
          <div className="pstat" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--bg3)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <TrendingDown size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="pstat-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gastos del Mes</span>
              <span className="pstat-val" style={{ fontSize: '1.1rem' }}>{mask(totalSpent)}</span>
            </div>
          </div>
          <div className="pstat" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--bg3)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <Activity size={16} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="pstat-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Promedio Diario</span>
              <span className="pstat-val" style={{ fontSize: '1.1rem' }}>{mask(dailyAvg)}</span>
            </div>
          </div>
          <div className="pstat" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--bg3)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <Repeat size={16} style={{ color: 'var(--blue)', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="pstat-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Compromisos</span>
              <span className="pstat-val" style={{ fontSize: '1.1rem' }}>{mask(commitmentsTotal)}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>Pagos fijos reservados</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Tendencia de Gastos</h3>
        <div style={{ height: '180px', position: 'relative' }}>
          <Line data={generateChartData()} options={chartOptions} />
        </div>
      </div>

      <div className="glass-card">
        <div className="card-header-row">
          <h3 className="card-title">Últimos Gastos</h3>
        </div>
        <ul className="expense-list-mini">
          {recentExpenses.length === 0 ? (
            <li><EmptyState message="Sin gastos recientes." /></li>
          ) : (
            recentExpenses.map(e => {
              const icon = CATEGORY_ICONS[e.category] || '📦';
              const label = e.merchant || e.category;
              
              const invoiceDate = new Date(e.date + 'T12:00:00');
              const isToday = invoiceDate.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
              const dateDisplay = isToday ? 'Hoy' : invoiceDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
              
              const timeDisplay = e.timestamp && !isNaN(new Date(e.timestamp).getTime())
                ? new Date(e.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                : new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
              
              return (
                <li key={e.id} className="expense-item" style={{ cursor: 'pointer' }} onClick={() => onSelectExpense && onSelectExpense(e)}>
                  <div className="expense-icon">{icon}</div>
                  <div className="expense-info">
                    <span className="expense-cat">{label}</span>
                    <span className="expense-time">{dateDisplay} · {timeDisplay}</span>
                  </div>
                  <span className="expense-amount">-{mask(e.amount)}</span>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <Modal open={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Registrar ingreso">
        <form onSubmit={handleAddIncome}>
          <div className="form-group">
            <label>Descripción (opcional)</label>
            <input
              type="text" className="input" placeholder="Ej: Comisión, freelance, bono…"
              value={incomeForm.name} onChange={e => setIncomeForm({ ...incomeForm, name: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginTop: '12px' }}>
            <label>Monto</label>
            <input
              type="text" inputMode="numeric" className="input" placeholder="0"
              value={incomeForm.amount} onChange={e => setIncomeForm({ ...incomeForm, amount: formatColombianInput(e.target.value) })}
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '20px', width: '100%' }}>
            Agregar ingreso
          </button>
        </form>
      </Modal>
    </>
  );
}
