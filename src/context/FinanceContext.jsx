import { createContext, useContext, useState, useEffect } from 'react';

const FinanceContext = createContext();

const STORAGE_KEY = 'planga_data';

const defaultState = {
  income: 2400000,
  cycleDay: 25,
  expenses: [],
  categoryBudgets: {
    comida: 500000,
    mercado: 600000,
    transporte: 200000,
    ocio: 150000,
    suscripciones: 100000,
    otro: 100000
  },
  commitments: [
    { id: 'c1', name: 'Arriendo', amount: 800000, day: 1 },
    { id: 'c2', name: 'Universidad', amount: 400000, day: 5 },
    { id: 'c3', name: 'Tarjeta de crédito', amount: 200000, day: 15 }
  ],
  savings: [],
  investments: [],
  debts: [],
  incomes: [],
  selectedMonth: new Date().toISOString().slice(0, 7)
};

export function FinanceProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...defaultState, ...parsed };
      }
    } catch (e) {
      console.error("Error loading state", e);
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addExpense = (expense) => {
    setState(prev => ({
      ...prev,
      expenses: [...prev.expenses, expense]
    }));
  };

  const deleteExpense = (id) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id)
    }));
  };

  const updateSettings = (newSettings) => {
    setState(prev => ({ ...prev, ...newSettings }));
  };

  const addCommitment = (commitment) => {
    setState(prev => ({
      ...prev,
      commitments: [...prev.commitments, commitment]
    }));
  };

  const deleteCommitment = (id) => {
    setState(prev => ({
      ...prev,
      commitments: prev.commitments.filter(c => c.id !== id)
    }));
  };

  const addAsset = (type, asset) => {
    // type = 'savings' | 'investments'
    setState(prev => ({
      ...prev,
      [type]: [...(prev[type] || []), asset]
    }));
  };

  const deleteAsset = (type, id) => {
    setState(prev => ({
      ...prev,
      [type]: (prev[type] || []).filter(a => a.id !== id)
    }));
  };

  const addDebt = (debt) => {
    setState(prev => ({
      ...prev,
      debts: [...(prev.debts || []), debt]
    }));
  };

  const deleteDebt = (id) => {
    setState(prev => ({
      ...prev,
      debts: (prev.debts || []).filter(d => d.id !== id)
    }));
  };

  const addIncome = (income) => {
    setState(prev => ({
      ...prev,
      incomes: [...(prev.incomes || []), income]
    }));
  };

  const deleteIncome = (id) => {
    setState(prev => ({
      ...prev,
      incomes: (prev.incomes || []).filter(i => i.id !== id)
    }));
  };

  return (
    <FinanceContext.Provider value={{
      state,
      setState,
      addExpense,
      deleteExpense,
      updateSettings,
      addCommitment,
      deleteCommitment,
      addAsset,
      deleteAsset,
      addDebt,
      deleteDebt,
      addIncome,
      deleteIncome
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}
