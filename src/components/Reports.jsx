import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { fmt, getMonthKey } from '../utils/financeUtils';

export default function Reports({ onMonthSelect }) {
  const { state } = useFinance();

  // Group all expenses by month
  const allMonths = {};
  state.expenses.forEach(e => {
    if (!allMonths[e.month]) allMonths[e.month] = { spent: 0, income: 0 };
    allMonths[e.month].spent += e.amount;
  });

  // Group all extra incomes
  (state.incomes || []).forEach(i => {
    if (!allMonths[i.month]) allMonths[i.month] = { spent: 0, income: 0 };
    allMonths[i.month].income += i.amount;
  });

  // Include base income for each month that has data
  Object.keys(allMonths).forEach(m => {
    allMonths[m].income += state.income;
  });

  // Ensure current month exists safely
  const currentMk = getMonthKey(state);
  if (currentMk && currentMk !== 'null' && currentMk !== 'NaN-NaN') {
    if (!allMonths[currentMk]) allMonths[currentMk] = { spent: 0, income: state.income };
  }

  // Filter out any corrupted month keys before rendering
  const validMonths = Object.keys(allMonths).filter(m => m && m !== 'null' && m !== 'NaN-NaN');
  
  const sortedMonths = validMonths.sort().reverse(); // descending for the list
  const last6 = validMonths.sort().slice(-6); // ascending last 6 for bar chart
  const maxVal = Math.max(...last6.map(m => Math.max(allMonths[m].spent, allMonths[m].income, 1)), 1);

  const handleExportCSV = () => {
    if (state.expenses.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    const headers = "Fecha,Mes,Categoria,Comercio,Monto,MetodoPago,Tipo,Entidad\n";
    const rows = state.expenses.map(e => 
      `${e.date},${e.month},${e.category},"${e.merchant || ''}",${e.amount},${e.paymentMethod || ''},${e.paymentType || ''},${e.paymentEntity || ''}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "gastos_planga.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Vista Global</h3>
          <button className="icon-btn-sm" onClick={handleExportCSV} title="Exportar CSV">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
        <p className="card-subtitle" style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: '-8px', marginBottom: '12px' }}>
          Ingresos vs Gastos por mes
        </p>
        
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px', padding: '0 10px' }}>
          {last6.map(m => {
            const [year, month] = m.split('-').map(Number);
            const d = new Date(year, month - 1);
            const label = d.toLocaleDateString('es-CO', { month: 'short' }).toUpperCase();
            const spentH = (allMonths[m].spent / maxVal) * 80;
            const incomeH = (allMonths[m].income / maxVal) * 80;
            
            return (
              <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
                  <div style={{ width: '8px', height: `${incomeH}px`, background: 'var(--green)', borderRadius: '4px 4px 0 0' }} title={`Ingreso: ${fmt(allMonths[m].income)}`}></div>
                  <div style={{ width: '8px', height: `${spentH}px`, background: 'var(--red)', borderRadius: '4px 4px 0 0' }} title={`Gasto: ${fmt(allMonths[m].spent)}`}></div>
                </div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text3)', marginTop: '8px', fontWeight: 700 }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card">
        <h3 className="card-title">Histórico de Meses</h3>
        <ul className="expense-list-full" style={{ marginTop: '12px' }}>
          {sortedMonths.map(m => {
            const [year, month] = m.split('-').map(Number);
            const d = new Date(year, month - 1);
            let label = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
            label = label.charAt(0).toUpperCase() + label.slice(1);
            const balance = allMonths[m].income - allMonths[m].spent;

            return (
              <li key={m} className="expense-item" onClick={() => onMonthSelect(m)} style={{ cursor: 'pointer' }}>
                <div className="expense-icon" style={{ background: 'var(--bg3)' }}>📅</div>
                <div className="expense-info">
                  <span className="expense-cat">{label}</span>
                  <span className="expense-time">Balance: {fmt(balance)}</span>
                </div>
                <span className="expense-amount" style={{ color: 'var(--text)' }}>{fmt(allMonths[m].spent)}</span>
              </li>
            );
          })}
        </ul>
      </div>

    </div>
  );
}
