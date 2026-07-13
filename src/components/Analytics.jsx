import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  getCurrentMonthExpenses, getTotalSpent, getAvailableMoney, 
  fmt, CATEGORY_ICONS, CATEGORY_COLORS, getDaysInMonth, getMonthKey,
  formatColombianInput, parseColombianInput
} from '../utils/financeUtils';
import { Trash2, AlertCircle, TrendingUp, CheckCircle2, Lightbulb, Sparkles, Calendar, Landmark } from 'lucide-react';
import Modal from './ui/Modal';
import EmptyState from './ui/EmptyState';
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
  LineElement,
  Filler
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
  LineElement,
  Filler
);

export default function Analytics() {
  const { state, addIncome, deleteIncome, showToast } = useFinance();
  const expenses = getCurrentMonthExpenses(state);
  
  const currentMk = getMonthKey(state);
  const monthIncomes = (state.incomes || []).filter(i => i.month === currentMk);
  const extraIncomeTotal = monthIncomes.reduce((s, i) => s + i.amount, 0);

  const totalExpenses = getTotalSpent(state);
  const totalCommitments = state.commitments.reduce((s,c) => s + c.amount, 0);
  const available = getAvailableMoney(state);
  const totalIncome = state.income + extraIncomeTotal;

  // --- Donut Chart Data ---
  const spentPercent = totalIncome > 0 ? ((totalExpenses + totalCommitments) / totalIncome) * 100 : 0;
  
  const donutData = {
    labels: ['Gastado', 'Disponible'],
    datasets: [{
      data: [totalExpenses + totalCommitments, Math.max(available, 0)],
      backgroundColor: ['#ef4444', '#10b981'],
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
        borderRadius: 6,
        order: 2
      },
      {
        label: 'Presupuesto',
        data: barBudgets,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(148, 163, 184, 0.45)',
        borderWidth: 2,
        borderRadius: 6,
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
        grid: { color: 'rgba(255, 255, 255, 0.07)' },
        ticks: { 
          color: '#94a3b8',
          font: { size: 9 },
          callback: (value) => {
            if (value >= 1000000) return '$' + (value/1000000).toFixed(1) + 'M';
            if (value >= 1000) return '$' + (value/1000).toFixed(0) + 'K';
            return '$' + value;
          }
        }
      },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9 } } }
    }
  };

  const barOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      x: { ...commonOptions.scales.x, stacked: false },
      y: { ...commonOptions.scales.y, stacked: false }
    },
    plugins: {
      ...commonOptions.plugins,
      legend: { display: true, position: 'top', labels: { color: '#cbd5e1', font: { size: 10, family: 'Outfit, sans-serif' } } },
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
        borderColor: '#00e676',
        backgroundColor: 'rgba(0, 230, 118, 0.05)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: dailyData.map((d, i) => d > dailyBudgetLine[i] ? '#ef4444' : '#00e676'),
        pointBorderColor: '#0f172a',
        pointRadius: (ctx) => ctx.dataIndex < currentDay ? 3.5 : 0
      },
      {
        label: 'Meta Diaria',
        data: dailyBudgetLine,
        borderColor: 'rgba(56, 189, 248, 0.65)',
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0
      }
    ]
  };

  const lineChartOptions = {
    ...commonOptions,
    plugins: {
      legend: { display: true, position: 'top', labels: { color: '#cbd5e1', font: { size: 10 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}`
        }
      }
    }
  };

  // --- Merchant Breakdown ---
  const merchantTotals = {};
  expenses.forEach(e => {
    const merchant = e.merchant || 'Otros (Sin clasificar)';
    merchantTotals[merchant] = (merchantTotals[merchant] || 0) + e.amount;
  });
  const sortedMerchants = Object.entries(merchantTotals).sort((a,b) => b[1] - a[1]).slice(0, 5);
  const maxMerchant = sortedMerchants.length > 0 ? sortedMerchants[0][1] : 1;

  // --- Intelligence Insights ---
  const generateInsights = () => {
    const tips = [];
    const budgets = state.categoryBudgets || {};
    
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

    if (currentDay > 5) {
      const dailyAverage = totalExpenses / currentDay;
      const projection = dailyAverage * daysInMonth;
      if (projection > totalIncome && totalIncome > 0) {
        tips.push({
          type: 'error',
          icon: <TrendingUp size={18} />,
          title: 'Proyección crítica de mes',
          text: `A este ritmo, gastarás ${fmt(projection)} al final del mes, superando tus ingresos. ¡Hora de ajustar!`
        });
      }
    }

    if (available > totalIncome * 0.4 && currentDay > 15) {
      tips.push({
        type: 'success',
        icon: <TrendingUp size={18} />,
        title: '¡Excelente gestión!',
        text: 'Llevas más de la mitad del mes con un balance muy positivo. Podrías invertir el excedente.'
      });
    }

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
    const parsedAmount = parseColombianInput(incomeForm.amount);
    
    if (parsedAmount <= 0) {
      showToast('Por favor ingresa un monto válido', 'error');
      return;
    }

    addIncome({
      id: 'i' + Date.now(),
      month: currentMk,
      name: incomeForm.name,
      amount: parsedAmount
    });
    
    showToast('Ingreso adicional registrado');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Intelligence Insights */}
      <div className="glass-card insight-card-container" style={{ gridColumn: '1 / -1' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sparkles size={18} style={{ color: 'var(--accent)' }} /> 
          Insights de Inteligencia
        </h3>
        <div className="insights-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {insights.map((tip, idx) => (
            <div key={idx} className={`insight-item ${tip.type}`} style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', display: 'flex', gap: '12px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div className="insight-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tip.icon}</div>
              <div className="insight-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="insight-title" style={{ fontWeight: 700, fontSize: '0.88rem' }}>{tip.title}</span>
                <span className="insight-text" style={{ fontSize: '0.78rem', color: 'var(--text2)', lineHeight: '1.4' }}>{tip.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* KPIs */}
      <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', gridColumn: '1 / -1', width: '100%' }}>
        <div className="glass-card kpi-card" style={{ padding: '16px 12px', textAlign: 'center', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.08)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}>
          <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>💰</div>
          <div className="kpi-label" style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>Ingresos Totales</div>
          <div className="kpi-value" style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '4px', color: 'var(--text)' }}>{fmt(totalIncome)}</div>
        </div>
        <div className="glass-card kpi-card" style={{ padding: '16px 12px', textAlign: 'center', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.08)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}>
          <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>📉</div>
          <div className="kpi-label" style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>Gastos + Fijos</div>
          <div className="kpi-value" style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '4px', color: 'var(--text)' }}>{fmt(totalExpenses + totalCommitments)}</div>
        </div>
        <div className="glass-card kpi-card" style={{ 
          padding: '16px 12px', textAlign: 'center', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: available >= 0 ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)',
          border: available >= 0 ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)'
        }} onMouseEnter={e => e.currentTarget.style.boxShadow = available >= 0 ? '0 0 15px rgba(16, 185, 129, 0.1)' : '0 0 15px rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
          <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>📊</div>
          <div className="kpi-label" style={{ fontSize: '0.7rem', color: available >= 0 ? '#10b981' : '#ef4444', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>Balance Neto</div>
          <div className="kpi-value" style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '4px', color: available >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {fmt(available)}
          </div>
        </div>
      </div>

      {/* Donut Chart (Ingresos vs Gastos) */}
      <div className="glass-card chart-card" style={{ padding: '20px' }}>
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Distribución de Fondos</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', minHeight: '180px' }}>
          <div style={{ position: 'relative', width: '150px', height: '150px' }}>
            <Doughnut data={donutData} options={donutOptions} />
            <div style={{ 
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{Math.round(spentPercent)}%</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text3)', textTransform: 'uppercase' }}>gastado</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>Gastado</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{fmt(totalExpenses + totalCommitments)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>Disponible</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{fmt(Math.max(available, 0))}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass-card chart-card" style={{ padding: '20px' }}>
        <h3 className="card-title">Límites vs Gastos</h3>
        <div style={{ height: '210px', marginTop: '16px' }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* Line Chart (Full Width in Desktop) */}
      <div className="glass-card chart-card" style={{ gridColumn: '1 / -1', padding: '20px' }}>
        <h3 className="card-title">Cronología de Gastos Diarios</h3>
        <div style={{ height: '220px', marginTop: '16px' }}>
          <Line data={lineData} options={lineChartOptions} />
        </div>
      </div>

      {/* Merchant Breakdown */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 className="card-title">Distribución por Comercio</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: '16px' }}>Selecciona un comercio para auditar compras</p>
        
        {sortedMerchants.length === 0 ? (
          <EmptyState message="Sin transacciones registradas." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedMerchants.map(([name, total]) => (
              <div 
                key={name} 
                onClick={() => setSelectedMerchant(name)}
                className="merchant-progress-item"
                style={{ 
                  display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer', padding: '10px', borderRadius: '10px', 
                  background: 'rgba(255,255,255,0.02)', border: '1px solid transparent', transition: 'all 0.2s' 
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text2)' }}>{name}</span>
                  <span style={{ fontWeight: 800, color: 'var(--text)' }}>{fmt(total)}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(total/maxMerchant)*100}%`, background: 'var(--accent)', borderRadius: '3px', transition: 'width 0.6s ease' }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Extra Incomes */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div className="card-header-row" style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Landmark size={18} style={{ color: 'var(--green)' }} />
            <h3 className="card-title">Ingresos Adicionales</h3>
          </div>
          <button className="icon-btn-sm" onClick={() => setIsIncomeModalOpen(true)} style={{ fontSize: '1.2rem' }}>+</button>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: '16px', lineHeight: '1.4' }}>
          Añade capital extra recibido durante este ciclo (bonificaciones, ventas, comisiones).
        </p>

        {monthIncomes.length === 0 ? (
          <EmptyState message="Sin ingresos adicionales registrados." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {monthIncomes.map(inc => (
              <div key={inc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
                <span style={{ fontWeight: 600 }}>{inc.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'var(--green)', fontWeight: 800 }}>+{fmt(inc.amount)}</span>
                  <button onClick={() => deleteIncome(inc.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Merchant Details Modal */}
      <Modal open={!!selectedMerchant} onClose={() => setSelectedMerchant(null)} title={selectedMerchant}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: '16px' }}>Productos comprados en este comercio durante el mes:</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedMerchant && getMerchantItems(selectedMerchant).length === 0 ? (
            <EmptyState message="No se registraron productos individuales." />
          ) : (
            selectedMerchant && getMerchantItems(selectedMerchant).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{item.can}x {item.desc}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> {item.date}
                  </span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(item.price)}</span>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* New Income Modal */}
      <Modal open={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Nuevo Ingreso Extra">
        <form onSubmit={handleIncomeSubmit}>
          <div className="form-group">
            <label>Descripción (Ej: Bono, Proyecto)</label>
            <input
              type="text" className="input" required
              placeholder="Ej. Proyecto Freelance"
              value={incomeForm.name} onChange={e => setIncomeForm({...incomeForm, name: e.target.value})}
            />
            <span style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'block', marginTop: '4px' }}>
              El origen o concepto de este dinero adicional (ej. comisión de ventas, regalo, trabajo extra).
            </span>
          </div>
          <div className="form-group" style={{ marginTop: '12px' }}>
            <label>Monto (COP)</label>
            <input
              type="text" className="input" required placeholder="0"
              value={incomeForm.amount} onChange={e => setIncomeForm({...incomeForm, amount: formatColombianInput(e.target.value)})}
            />
            <span style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'block', marginTop: '4px' }}>
              Monto recibido. Se agregará directamente como saldo disponible para tus gastos del ciclo actual.
            </span>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '20px', width: '100%' }}>Agregar Ingreso</button>
        </form>
      </Modal>

    </div>
  );
}
