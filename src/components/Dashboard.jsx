import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  getAvailableMoney, getDaysRemaining, getDailyBudget, 
  getTotalSpent, getStatus, getCurrentMonthExpenses, 
  getTotalCommitments, fmt, CATEGORY_ICONS 
} from '../utils/financeUtils';
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
  const { state } = useFinance();

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
  
  const spentPercent = state.income > 0 ? Math.min((totalSpent + commitmentsTotal) / state.income * 100, 100) : 0;
  
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
          label: 'Gasto Real Acumulado',
          data: realData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          borderWidth: 2,
        },
        {
          label: 'Ritmo Ideal',
          data: idealData,
          borderColor: 'rgba(255, 255, 255, 0.15)',
          borderDash: [5, 5],
          fill: false,
          tension: 0,
          pointRadius: 0,
          borderWidth: 1.5,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'var(--text)',
          boxWidth: 12,
          font: {
            size: 10,
            family: 'Outfit, sans-serif'
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#ccc',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += mask(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'var(--text3)',
          font: {
            size: 8
          },
          maxTicksLimit: 6
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.03)'
        },
        ticks: {
          color: 'var(--text3)',
          font: {
            size: 8
          },
          callback: function(value) {
            return mask(value);
          }
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
        <p style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: '-8px', marginBottom: '12px' }}>
          Tu saldo libre (Ingreso Base - Gastos - Compromisos futuros)
        </p>
        
        <div className="card-row">
          <div className="card-stat">
            <span className="stat-label">Días Restantes</span>
            <span className="stat-value">{daysLeft}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: '2px' }}>Para fin de ciclo</span>
          </div>
          <div className="card-divider"></div>
          <div className="card-stat">
            <span className="stat-label">Presupuesto Diario</span>
            <span className="stat-value stat-highlight" style={{ color: `var(--${status.level})` }}>
              {mask(dailyBudget)}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: '2px' }}>Límite sugerido por hoy</span>
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
        <div className="progress-stats" style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
          <div className="pstat" style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 15px', borderRadius: '12px', borderLeft: '3px solid var(--accent)' }}>
            <span className="pstat-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gastos del Mes</span>
            <span className="pstat-val" style={{ fontSize: '1.1rem' }}>{mask(totalSpent)}</span>
          </div>
          <div className="pstat" style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 15px', borderRadius: '12px', borderLeft: '3px solid var(--yellow)' }}>
            <span className="pstat-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Promedio Diario</span>
            <span className="pstat-val" style={{ fontSize: '1.1rem' }}>{mask(dailyAvg)}</span>
          </div>
          <div className="pstat" style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 15px', borderRadius: '12px', borderLeft: '3px solid var(--blue)' }}>
            <span className="pstat-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Compromisos</span>
            <span className="pstat-val" style={{ fontSize: '1.1rem' }}>{mask(commitmentsTotal)}</span>
            <span style={{ fontSize: '0.58rem', color: 'var(--text3)', marginTop: '2px' }}>Pagos fijos reservados</span>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="card-title" style={{ marginBottom: '15px' }}>Tendencia de Gastos</h3>
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
            <li className="empty-state">Sin gastos recientes.</li>
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
    </>
  );
}
