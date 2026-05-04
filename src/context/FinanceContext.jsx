import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getCycleInfo } from '../utils/financeUtils';

const FinanceContext = createContext();

const CATEGORY_BUDGETS_DEFAULT = {
  comida: 500000,
  mercado: 600000,
  transporte: 200000,
  ocio: 150000,
  suscripciones: 100000,
  otro: 100000
};

const LOCAL_COMMITMENTS_KEY = 'planga_commitments';
const LOCAL_BUDGETS_KEY = 'planga_budgets';

export function FinanceProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [state, setState] = useState({
    income: 2400000,
    cycleDay: 25,
    expenses: [],
    categoryBudgets: CATEGORY_BUDGETS_DEFAULT,
    commitments: JSON.parse(localStorage.getItem(LOCAL_COMMITMENTS_KEY) || '[{"id":"c1","name":"Arriendo","amount":800000,"day":1}]'),
    savings: [],
    investments: [],
    debts: [],
    incomes: [],
    selectedMonth: null,
    currentCiclo: null,
  });
  const [dataLoading, setDataLoading] = useState(false);

  // ─── Auth listener ───
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Load data when user logs in ───
  useEffect(() => {
    if (user) {
      loadAllData();
    } else if (!authLoading) {
      // Reset state on logout
      setState(prev => ({
        ...prev,
        expenses: [],
        savings: [],
        investments: [],
        debts: [],
        incomes: [],
        currentCiclo: null,
      }));
    }
  }, [user]);

  const loadAllData = async () => {
    setDataLoading(true);
    try {
      await Promise.all([
        loadProfile(),
        loadAssetsAndDebts(),
      ]);
      // Load expenses after profile (needs cycleDay for cycle detection)
      await loadCurrentCycleAndExpenses();
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const nombre = user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario';
      await supabase.from('profiles').insert({
        id: user.id,
        nombre,
        moneda: 'COP',
        ciclo_dia: 25,
        frecuencia: 'mensual'
      });
      return;
    }

    if (data) {
      setState(prev => ({
        ...prev,
        cycleDay: data.ciclo_dia || 25,
        categoryBudgets: JSON.parse(localStorage.getItem(LOCAL_BUDGETS_KEY) || 'null') || CATEGORY_BUDGETS_DEFAULT,
      }));
    }
  };

  const findOrCreateCiclo = async (cycleDay) => {
    const today = new Date();
    const cycleInfo = getCycleInfo(today, cycleDay);
    const startStr = cycleInfo.startDate.toISOString().slice(0, 10);
    const endStr = cycleInfo.endDate.toISOString().slice(0, 10);

    // Look for existing ciclo
    const { data: existing } = await supabase
      .from('ciclos')
      .select('*')
      .eq('user_id', user.id)
      .lte('fecha_inicio', today.toISOString().slice(0, 10))
      .gte('fecha_fin', today.toISOString().slice(0, 10))
      .single();

    if (existing) return existing;

    // Create new ciclo
    const { data: newCiclo, error } = await supabase
      .from('ciclos')
      .insert({
        user_id: user.id,
        nombre: cycleInfo.monthKey,
        fecha_inicio: startStr,
        fecha_fin: endStr,
        ingresos: 2400000,
        gastos_fijos: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return newCiclo;
  };

  const loadCurrentCycleAndExpenses = async () => {
    // Get cycleDay from current state
    const { data: profile } = await supabase
      .from('profiles')
      .select('ciclo_dia')
      .eq('id', user.id)
      .single();

    const cycleDay = profile?.ciclo_dia || 25;
    const ciclo = await findOrCreateCiclo(cycleDay);

    // Load all gastos for this user (for history)
    const { data: gastos, error } = await supabase
      .from('gastos')
      .select(`*, gasto_items(*)`)
      .eq('user_id', user.id)
      .order('fecha_gasto', { ascending: false });

    if (error) throw error;

    const expenses = (gastos || []).map(g => mapGastoToExpense(g, cycleDay));

    setState(prev => ({
      ...prev,
      income: ciclo.ingresos || 2400000,
      cycleDay,
      currentCiclo: ciclo,
      selectedMonth: ciclo.nombre,
      expenses,
    }));
  };

  const mapGastoToExpense = (g, cycleDay) => {
    // Parse the date correctly in local time to avoid UTC offset issues
    let expenseDate;
    if (g.fecha_gasto) {
      const [year, month, day] = g.fecha_gasto.split('-').map(Number);
      expenseDate = new Date(year, month - 1, day, 12, 0, 0); // noon local time
    } else {
      expenseDate = new Date();
    }
    const cycleInfo = getCycleInfo(expenseDate, cycleDay || 25);
    return {
      id: g.id,
      amount: g.total || 0,
      category: g.categoria || 'otro',
      date: g.fecha_gasto || new Date().toISOString().slice(0, 10),
      month: cycleInfo.monthKey,
      timestamp: g.created_at,
      merchant: g.comercio || null,
      paymentMethod: g.medio_pago || 'efectivo',
      paymentEntity: g.entidad_banco || null,
      paymentType: null,
      items: (g.gasto_items || []).map(i => ({
        can: i.cantidad || 1,
        desc: i.nombre,
        price: i.precio || 0,
      })),
      metadata: [],
    };
  };

  const loadAssetsAndDebts = async () => {
    const [{ data: activos }, { data: deudas }] = await Promise.all([
      supabase.from('activos').select('*').eq('user_id', user.id),
      supabase.from('deudas').select('*').eq('user_id', user.id),
    ]);

    const savings = (activos || []).filter(a => a.tipo === 'ahorro').map(a => ({
      id: a.id, name: a.nombre, amount: a.valor || 0
    }));
    const investments = (activos || []).filter(a => a.tipo !== 'ahorro').map(a => ({
      id: a.id, name: a.nombre, amount: a.valor || 0
    }));
    const debts = (deudas || []).map(d => ({
      id: d.id, name: d.nombre, total: d.monto_total || 0, paid: d.monto_pagado || 0
    }));

    setState(prev => ({ ...prev, savings, investments, debts }));
  };

  // ─── CRUD: Expenses ───
  const addExpense = async (expense) => {
    if (!user) return;

    // Find current ciclo_id
    const cicloId = state.currentCiclo?.id;

    const { data: gasto, error } = await supabase
      .from('gastos')
      .insert({
        user_id: user.id,
        ciclo_id: cicloId || null,
        comercio: expense.merchant || null,
        total: expense.amount,
        categoria: expense.category,
        medio_pago: expense.paymentMethod || 'efectivo',
        entidad_banco: expense.paymentEntity || null,
        fecha_gasto: expense.date,
        origen: 'manual',
      })
      .select()
      .single();

    if (error) { console.error('addExpense error:', error); return; }

    // Insert items
    if (expense.items && expense.items.length > 0) {
      await supabase.from('gasto_items').insert(
        expense.items.map(item => ({
          gasto_id: gasto.id,
          nombre: item.desc,
          precio: item.price,
          cantidad: parseInt(item.can) || 1,
          ocr_confianza: 0.8,
          revisado: false,
        }))
      );
    }

    // Reload expenses
    await loadCurrentCycleAndExpenses();
  };

  const deleteExpense = async (id) => {
    await supabase.from('gasto_items').delete().eq('gasto_id', id);
    await supabase.from('gastos').delete().eq('id', id);
    setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  };

  // ─── CRUD: Assets ───
  const addAsset = async (type, asset) => {
    if (!user) return;
    const tipo = type === 'savings' ? 'ahorro' : 'inversion';
    const { data, error } = await supabase
      .from('activos')
      .insert({ user_id: user.id, nombre: asset.name, valor: asset.amount, tipo })
      .select().single();

    if (error) { console.error('addAsset error:', error); return; }

    const newAsset = { id: data.id, name: data.nombre, amount: data.valor };
    setState(prev => ({
      ...prev,
      [type]: [...prev[type], newAsset]
    }));
  };

  const deleteAsset = async (type, id) => {
    await supabase.from('activos').delete().eq('id', id);
    setState(prev => ({ ...prev, [type]: prev[type].filter(a => a.id !== id) }));
  };

  // ─── CRUD: Debts ───
  const addDebt = async (debt) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('deudas')
      .insert({ user_id: user.id, nombre: debt.name, monto_total: debt.total, monto_pagado: debt.paid })
      .select().single();

    if (error) { console.error('addDebt error:', error); return; }

    setState(prev => ({
      ...prev,
      debts: [...prev.debts, { id: data.id, name: data.nombre, total: data.monto_total, paid: data.monto_pagado }]
    }));
  };

  const deleteDebt = async (id) => {
    await supabase.from('deudas').delete().eq('id', id);
    setState(prev => ({ ...prev, debts: prev.debts.filter(d => d.id !== id) }));
  };

  // ─── Commitments (local) ───
  const addCommitment = (commitment) => {
    setState(prev => {
      const updated = [...prev.commitments, commitment];
      localStorage.setItem(LOCAL_COMMITMENTS_KEY, JSON.stringify(updated));
      return { ...prev, commitments: updated };
    });
  };

  const deleteCommitment = (id) => {
    setState(prev => {
      const updated = prev.commitments.filter(c => c.id !== id);
      localStorage.setItem(LOCAL_COMMITMENTS_KEY, JSON.stringify(updated));
      return { ...prev, commitments: updated };
    });
  };

  // ─── Income (local) ───
  const addIncome = (income) => {
    setState(prev => ({ ...prev, incomes: [...(prev.incomes || []), income] }));
  };

  const deleteIncome = (id) => {
    setState(prev => ({ ...prev, incomes: (prev.incomes || []).filter(i => i.id !== id) }));
  };

  // ─── Settings ───
  const updateSettings = async (updates) => {
    if (updates.selectedMonth !== undefined) {
      setState(prev => ({ ...prev, selectedMonth: updates.selectedMonth }));
      return;
    }

    setState(prev => ({ ...prev, ...updates }));

    if (user && (updates.income !== undefined || updates.cycleDay !== undefined)) {
      if (updates.cycleDay) {
        await supabase.from('profiles').update({ ciclo_dia: updates.cycleDay }).eq('id', user.id);
      }
      if (updates.income && state.currentCiclo) {
        await supabase.from('ciclos').update({ ingresos: updates.income }).eq('id', state.currentCiclo.id);
      }
    }

    if (updates.categoryBudgets) {
      localStorage.setItem(LOCAL_BUDGETS_KEY, JSON.stringify(updates.categoryBudgets));
    }
  };

  // ─── Sign out ───
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <FinanceContext.Provider value={{
      user,
      authLoading,
      dataLoading,
      state,
      setState,
      signOut,
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
      deleteIncome,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}
