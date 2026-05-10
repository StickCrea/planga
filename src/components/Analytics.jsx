import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  getCurrentMonthExpenses, getTotalSpent, getAvailableMoney, 
  fmt, CATEGORY_ICONS, CATEGORY_COLORS, getDaysInMonth, getMonthKey
} from '../utils/financeUtils';
import { Trash2, AlertCircle, TrendingUp, CheckCircle2, Lightbulb, Sparkles } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function Analytics() {
  const { state, addIncome, deleteIncome } = useFinance();
  const expenses = getCurrentMonthExpenses(state);
  
  const currentMk = getMonthKey(state);
  const monthIncomes = (state.incomes || []).filter(i => i.month === currentMk);
  const extraIncomeTotal = monthIncomes.reduce((s, i) => s + i.amount, 0);

  const totalExpenses = getTotalSpent(state);
  const totalCommitments = state.commitments.reduce((s,c) => s + c.amount, 0);
  const available = getAvailableMoney(state) + extraIncomeTotal;
  const totalIncome = state.income + extraIncomeTotal;

  // --- Donut Chart Data ---
  const spentPercent = totalIncome > 0 ? ((totalExpenses + totalCommitments) / totalIncome) * 100 : 0;
  
  const donutData = {
    labels: ['Gastado', 'Disponible'],
    datasets: [{
      data: [totalExpenses + totalCommitments, Math.max(available, 0)],
      backgroundColor: ['#ef4444', '#22c55e'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const donutOptions = {
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${fmt(ctx.raw)}` } }
    }
  };

  // --- Bar Chart Data ---
  const catTotals = {};
  expenses.forEach(e => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });

  const barLabels = Object.keys(CATEGORY_ICONS);
  const barValues = barLabels.map(cat => catTotals[cat] || 0);
  const barColors = barLabels.map(cat => CATEGORY_COLORS[cat] || '#3b82f6');
  const barBudgets = barLabels.map(cat => state.categoryBudgets?.[cat] || 0);

  const barData = {
    labels: barLabels.map(l => l.length > 6 ? l.charAt(0).toUpperCase() + l.slice(1, 6) + '...' : l.charAt(0).toUpperCase() + l.slice(1)),
    datasets: [
      {
        label: 'Gastado',
        data: barValues,
        backgroundColor: barColors,
        borderRadius: 4,
        order: 2
      },
      {
        label: 'Presupuesto',
        data: barBudgets,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderRadius: 4,
        type: 'bar',
        order: 1
      }
    ]
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        grid: { color: 'rgba(148,163,184,0.1)' },
        ticks: { 
          color: '#64748b',
          callback: (value) => {
            if (value >= 1000000) return '$' + (value/1000000).toFixed(1) + 'M';
            if (value >= 1000) return '$' + (value/1000).toFixed(0) + 'K';
            return '$' + value;
          }
        }
      },
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }
    }
  };

  const barOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      x: {
        ...commonOptions.scales.x,
        stacked: false
      },
      y: {
        ...commonOptions.scales.y,
        stacked: false
      }
    },
    plugins: {
      ...commonOptions.plugins,
      legend: { display: true, position: 'top', labels: { color: 'var(--text3)', font: { size: 10 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw;
            const label = ctx.dataset.label;
            return ` ${label}: ${fmt(val)}`;
          }
        }
      }
    }
  };

  // --- Line Chart Data ---
  const today = new Date();
  const daysInMonth = getDaysInMonth(state);
  const currentDay = today.getDate();

  const dailyData = new Array(daysInMonth).fill(0);
  expenses.forEach(e => {
    const day = parseInt(e.date.split('-')[2], 10);
    if (day >= 1 && day <= daysInMonth) {
      dailyData[day-1] += e.amount;
    }
  });

  const lineLabels = Array.from({length: daysInMonth}, (_, i) => i + 1);
  const dailyBudgetLine = new Array(daysInMonth).fill((totalIncome - totalCommitments) / daysInMonth);

  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: 'Gasto Diario',
        data: dailyData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: dailyData.map((d, i) => d > dailyBudgetLine[i] ? '#ef4444' : '#3b82f6'),
        pointBorderColor: '#0f172a',
        pointRadius: (ctx) => ctx.dataIndex < currentDay ? 3 : 0
      },
      {
        label: 'Meta Diaria',
        data: dailyBudgetLine,
        borderColor: 'rgba(34,197,94,0.5)',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        tension: 0
      }
    ]
  };

  // --- Merchant Breakdown ---
  const merchantTotals = {};
  expenses.forEach(e => {
    const merchant = e.merchant || 'Otros (Sin clasificar)';
    merchantTotals[merchant] = (merchantTotals[merchant] || 0) + e.amount;
  });
  const sortedMerchants = Object.entries(merchantTotals).sort((a,b) => b[1] - a[1]).slice(0, 5);
  const maxMerchant = sortedMerchants.length > 0 ? sortedMerchants[0][1] : 1;

  // --- Intelligence Insights (Tips de Finly) ---
  const generateInsights = () => {
    const tips = [];
    const budgets = state.categoryBudgets || {};
    
    // 1. Critical Budget Alert
    Object.entries(catTotals).forEach(([cat, spent]) => {
      const budget = budgets[cat];
      if (budget > 0) {
        const p = (spent / budget) * 100;
        if (p >= 100) {
          tips.push({
            type: 'error',
            icon: <AlertCircle size={18} />,
            title: `Límite superado en ${cat}`,
            text: `Has gastado el ${Math.round(p)}% de tu presupuesto. Considera reducir gastos en esta categoría.`
          });
        } else if (p >= 80) {
          tips.push({
            type: 'warning',
            icon: <Lightbulb size={18} />,
            title: `Cuidado con ${cat}`,
            text: `Ya casi alcanzas tu límite (${Math.round(p)}%). ¡Aún puedes ahorrar!`
          });
        }
      }
    });

    // 2. Spending Projection
    if (currentDay > 5) {
      const dailyAverage = totalExpenses / currentDay;
      const projection = dailyAverage * daysInMonth;
      if (projection > totalIncome && totalIncome > 0) {
        tips.push({
          type: 'error',
          icon: <TrendingUp size={18} />,
          title: 'Proyección crítica',
          text: `A este ritmo, gastarás ${fmt(projection)} al final del mes, superando tus ingresos. ¡Hora de ajustar!`
        });
      }
    }

    // 3. Savings Potential
    if (available > totalIncome * 0.4 && currentDay > 15) {
      tips.push({
        type: 'success',
        icon: <TrendingUp size={18} />,
        title: '¡Excelente gestión!',
        text: 'Llevas más de la mitad del mes con un balance muy positivo. Podrías invertir el excedente.'
      });
    }

    // 3. Healthy Balance
    if (tips.length === 0) {
      tips.push({
        type: 'info',
        icon: <CheckCircle2 size={18} />,
        title: 'Todo bajo control',
        text: 'Tus gastos están alineados con tus ingresos. ¡Sigue así!'
      });
    }

    return tips.slice(0, 3);
  };

  const insights = generateInsights();

  // Modals state
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ name: '', amount: '' });

  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    addIncome({
      id: 'i' + Date.now(),
      month: currentMk,
      name: incomeForm.name,
      amount: Number(incomeForm.amount)
    });
    setIsIncomeModalOpen(false);
    setIncomeForm({ name: '', amount: '' });
  };

  const getMerchantItems = (mName) => {
    let mItems = [];
    expenses.forEach(e => {
      const eName = e.merchant || 'Otros (Sin clasificar)';
      if (eName === mName && e.items) {
        e.items.forEach(i => mItems.push({...i, date: e.date}));
      }
    });
    return mItems;
  };

  if (!state.currentCiclo && !state.income) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text3)' }}>No hay datos para analizar todavía. Registra tus ingresos y gastos para ver estadísticas.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Intelligence Insights */}
      <div className="glass-card insight-card-container">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: 'var(--accent)' }} /> 
          Insights de Inteligencia
        </h3>
        <div className="insights-list">
          {insights.map((tip, idx) => (
            <div key={idx} className={`insight-item ${tip.type}`}>
              <div className="insight-icon">{tip.icon}</div>
              <div className="insight-content">
                <span className="insight-title">{tip.title}</span>
                <span className="insight-text">{tip.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>💰</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>Ingresos</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{fmt(totalIncome)}</div>
        </div>
        <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>📉</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>Gastos + Fijos</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{fmt(totalExpenses + totalCommitments)}</div>
        </div>
        <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>📊</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>Balance</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: available >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {fmt(available)}
          </div>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="glass-card chart-card">
        <h3 className="card-title">Ingresos vs Gastos</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '16px' }}>
          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
            <Doughnut data={donutData} options={donutOptions} />
            <div style={{ 
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{Math.round(spentPercent)}%</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text2)' }}>utilizado</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>Gastado</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmt(totalExpenses + totalCommitments)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }}></div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>Disponible</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmt(Math.max(available, 0))}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass-card chart-card">
        <h3 className="card-title">Gastos por Categoría</h3>
        <div style={{ height: '240px', marginTop: '16px' }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* Line Chart */}
      <div className="glass-card chart-card">
        <h3 className="card-title">Tendencia Diaria de Gasto</h3>
        <div style={{ height: '200px', marginTop: '16px' }}>
          <Line data={lineData} options={commonOptions} />
        </div>
      </div>

      {/* Merchant Breakdown */}
      <div className="glass-card">
        <h3 className="card-title">Principales Comercios</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: '12px' }}>Clic para ver los productos</p>
        
        {sortedMerchants.length === 0 ? (
          <p className="empty-state">Sin datos de comercios.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedMerchants.map(([name, total]) => (
              <div 
                key={name} 
                onClick={() => setSelectedMerchant(name)}
                style={{ display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer', padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{name}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(total)}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(total/maxMerchant)*100}%`, background: 'var(--accent)', borderRadius: '3px' }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Extra Incomes */}
      <div className="glass-card">
        <div className="card-header-row">
          <h3 className="card-title">Ingresos Adicionales</h3>
          <button className="icon-btn-sm" onClick={() => setIsIncomeModalOpen(true)} style={{ fontSize: '1.2rem' }}>+</button>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: '12px' }}>
          Registra dinero extra ingresado en este mes (bonos, trabajos extra).
        </p>

        {monthIncomes.length === 0 ? (
          <p className="empty-state">Sin ingresos extra registrados.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {monthIncomes.map(inc => (
              <div key={inc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <span style={{ fontWeight: 600 }}>{inc.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>+{fmt(inc.amount)}</span>
                  <button onClick={() => deleteIncome(inc.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Merchant Details Modal */}
      {selectedMerchant && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setSelectedMerchant(null)} style={{ display: 'flex' }}>
          <div className="modal glass-card" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <span className="modal-title">{selectedMerchant}</span>
              <button className="icon-btn-sm" onClick={() => setSelectedMerchant(null)}>✕</button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: '16px' }}>Historial de productos comprados en este ciclo.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {getMerchantItems(selectedMerchant).length === 0 ? (
                <p className="empty-state">No se registraron productos individuales.</p>
              ) : (
                getMerchantItems(selectedMerchant).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{item.can}x {item.desc}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>{item.date}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{fmt(item.price)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Income Modal */}
      {isIncomeModalOpen && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setIsIncomeModalOpen(false)} style={{ display: 'flex' }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <span className="modal-title">Nuevo Ingreso Extra</span>
              <button className="icon-btn-sm" onClick={() => setIsIncomeModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleIncomeSubmit}>
              <div className="form-group">
                <label>Descripción (Ej: Bono, Proyecto)</label>
                <input 
                  type="text" className="input" required 
                  value={incomeForm.name} onChange={e => setIncomeForm({...incomeForm, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Monto</label>
                <input 
                  type="number" className="input" required min="1" placeholder="0"
                  value={incomeForm.amount} onChange={e => setIncomeForm({...incomeForm, amount: e.target.value})}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>Agregar Ingreso</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
