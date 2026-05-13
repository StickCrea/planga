import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getCycleInfo } from '../utils/financeUtils';

const FinanceContext = createContext();

const LOCAL_COMMITMENTS_KEY = 'planga_commitments';
const LOCAL_BUDGETS_KEY = 'planga_budgets';
const LOCAL_INCOMES_KEY = 'planga_incomes';

export function FinanceProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const lastUserIdRef = useRef(null);
  const lastRealtimeUserRef = useRef(null);
  const [state, setState] = useState({
    income: 0,
    cycleDay: null,
    expenses: [],
    categoryBudgets: JSON.parse(localStorage.getItem(LOCAL_BUDGETS_KEY) || 'null') || {},
    commitments: JSON.parse(localStorage.getItem(LOCAL_COMMITMENTS_KEY) || '[]'),
    savings: [],
    investments: [],
    debts: [],
    incomes: [],
    selectedMonth: null,
    currentCiclo: null,
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [lastLoadTime, setLastLoadTime] = useState(0);

  // ─── LocalStorage Persistence ───
  useEffect(() => {
    if (user && !dataLoading) {
      localStorage.setItem(`finly_state_${user.id}`, JSON.stringify(state));
    }
  }, [state, user, dataLoading]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // ─── Auth listener & Inactivity Timer ───
  useEffect(() => {
    let inactivityTimer;

    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      // Logout after 30 minutes of inactivity
      inactivityTimer = setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            supabase.auth.signOut();
            showToast('Sesión cerrada por inactividad', 'info');
          }
        });
      }, 30 * 60 * 1000); 
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error('Supabase session error:', error);
        
        if (session?.user) {
          setUser(session.user);
          resetTimer();
          
          // Instant bootstrap from cache
          const cached = localStorage.getItem(`finly_state_${session.user.id}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setState(parsed);
            } catch (e) { console.error('Cache parse error', e); }
          }
        }
      } catch (err) {
        console.error('Session fetch exception:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    fetchSession();

    // Handle mobile backgrounding (returning from camera/gallery)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App came back to foreground, ensure session is active
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            setUser(session.user);
          }
        }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) resetTimer();
    });

    return () => {
      authSub.unsubscribe();
      events.forEach(event => document.removeEventListener(event, resetTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, []);

  // ─── Supabase Realtime Listeners ───
  useEffect(() => {
    if (user && lastRealtimeUserRef.current !== user.id) {
      lastRealtimeUserRef.current = user.id;
      console.log('FinanceContext: Setting up Realtime channels for user', user.id);
      
      const gastosChannel = supabase.channel(`gastos-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos', filter: `user_id=eq.${user.id}` }, () => {
          loadCurrentCycleAndExpenses();
        })
        .subscribe();

      const budgetsChannel = supabase.channel(`budgets-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'presupuestos', filter: `user_id=eq.${user.id}` }, () => {
          loadBudgets();
        })
        .subscribe();

      const incomesChannel = supabase.channel(`incomes-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ingresos_extra', filter: `user_id=eq.${user.id}` }, () => {
          loadIncomesFromDB();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(gastosChannel);
        supabase.removeChannel(budgetsChannel);
        supabase.removeChannel(incomesChannel);
      };
    }
  }, [user]);

  // ─── Load data when user logs in ───
  useEffect(() => {
    if (user) {
      if (lastUserIdRef.current !== user.id) {
        lastUserIdRef.current = user.id;
        loadAllData(true); // Force load on user change
      }
    } else if (!authLoading) {
      lastUserIdRef.current = null;
      lastRealtimeUserRef.current = null;
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
  }, [user, authLoading]);

  const loadAllData = async (force = false) => {
    if (dataLoading) return;
    
    const now = Date.now();
    // Throttle: avoid loading more than once every 10 seconds
    if (!force && (now - lastLoadTime < 10000)) return;
    
    setDataLoading(true);
    setLastLoadTime(now);
    console.log('FinanceContext: Starting loadAllData...');
    
    // Safety timeout: ensure loading finishes eventually
    const safetyTimeout = setTimeout(() => {
      console.warn('FinanceContext: Data loading timed out (8s safety triggered)');
      setDataLoading(false);
    }, 8000);

    try {
      const profileOk = await loadProfile();
      if (!profileOk) {
        console.log('FinanceContext: Profile check failed or onboarding needed');
        clearTimeout(safetyTimeout);
        setDataLoading(false);
        return;
      }

      console.log('FinanceContext: Profile OK, loading sub-modules...');
      await Promise.all([
        loadAssetsAndDebts(),
        loadBudgets(),
        loadCommitmentsFromDB(),
        loadIncomesFromDB(),
        loadCurrentCycleAndExpenses()
      ]);
      console.log('FinanceContext: All data loaded successfully');
    } catch (err) {
      console.error('FinanceContext: Error loading data:', err);
    } finally {
      clearTimeout(safetyTimeout);
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
      // Profile doesn't exist → first time user, needs onboarding
      setNeedsOnboarding(true);
      return false;
    }

    // If profile exists but they have no cycles, they still need onboarding
    // (This handles cases where a DB trigger auto-creates the profile)
    const { count } = await supabase
      .from('ciclos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count === 0 || !data || !data.ciclo_dia) {
      setNeedsOnboarding(true);
      return false;
    }

    setState(prev => ({
      ...prev,
      cycleDay: data.ciclo_dia,
    }));

    // Data will be loaded by specialized functions called in loadAllData
    return true;
  };

  const loadBudgets = async () => {
    const { data, error } = await supabase.from('presupuestos').select('*').eq('user_id', user.id);
    if (error) { console.error('loadBudgets error:', error); return; }

    let budgets = {};
    if (data && data.length > 0) {
      data.forEach(b => { budgets[b.categoria] = b.monto; });
    } else {
      // Migration logic: if DB is empty, check localStorage
      const local = JSON.parse(localStorage.getItem(LOCAL_BUDGETS_KEY) || 'null');
      if (local) {
        budgets = local;
        // Push to DB
        const inserts = Object.entries(local).map(([categoria, monto]) => ({
          user_id: user.id, categoria, monto
        }));
        await supabase.from('presupuestos').insert(inserts);
      }
    }

    setState(prev => ({ ...prev, categoryBudgets: budgets }));
  };

  const loadCommitmentsFromDB = async () => {
    const { data, error } = await supabase.from('compromisos').select('*').eq('user_id', user.id);
    if (error) { console.error('loadCommitments error:', error); return; }

    let list = [];
    if (data && data.length > 0) {
      list = data.map(d => ({ id: d.id, name: d.nombre, amount: d.monto, day: d.dia_pago }));
    } else {
      // Migration
      const local = JSON.parse(localStorage.getItem(`${LOCAL_COMMITMENTS_KEY}_${user.id}`) || localStorage.getItem(LOCAL_COMMITMENTS_KEY) || '[]');
      if (local.length > 0) {
        list = local;
        await supabase.from('compromisos').insert(local.map(c => ({
          user_id: user.id, nombre: c.name, monto: c.amount, dia_pago: c.day
        })));
      }
    }
    setState(prev => ({ ...prev, commitments: list }));
  };

  const loadIncomesFromDB = async () => {
    const { data, error } = await supabase.from('ingresos_extra').select('*').eq('user_id', user.id);
    if (error) { console.error('loadIncomes error:', error); return; }

    let list = [];
    if (data && data.length > 0) {
      list = data.map(d => ({ id: d.id, name: d.nombre, amount: d.monto, date: d.fecha }));
    } else {
      // Migration
      const local = JSON.parse(localStorage.getItem(`${LOCAL_INCOMES_KEY}_${user.id}`) || localStorage.getItem(LOCAL_INCOMES_KEY) || '[]');
      if (local.length > 0) {
        list = local;
        await supabase.from('ingresos_extra').insert(local.map(i => ({
          user_id: user.id, nombre: i.name, monto: i.amount, fecha: i.date || new Date().toISOString()
        })));
      }
    }
    setState(prev => ({ ...prev, incomes: list }));
  };

  const findOrCreateCiclo = async (cycleDay) => {
    const today = new Date();
    const cycleInfo = getCycleInfo(today, cycleDay);
    const startStr = cycleInfo.startDate.toISOString().slice(0, 10);
    const endStr = cycleInfo.endDate.toISOString().slice(0, 10);

    // Look for existing ciclo
    const { data: existingList } = await supabase
      .from('ciclos')
      .select('*')
      .eq('user_id', user.id)
      .lte('fecha_inicio', today.toISOString().slice(0, 10))
      .gte('fecha_fin', today.toISOString().slice(0, 10))
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingList && existingList.length > 0) return existingList[0];

    // Get the most recent cycle to copy income and calculate rollover
    const { data: lastCiclo } = await supabase
      .from('ciclos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    const prevCiclo = (lastCiclo && lastCiclo.length > 0) ? lastCiclo[0] : null;
    const defaultIncome = prevCiclo ? prevCiclo.ingreso : 0;

    // Create new ciclo
    const { data: newCiclo, error } = await supabase
      .from('ciclos')
      .insert({
        user_id: user.id,
        nombre: cycleInfo.monthKey,
        fecha_inicio: startStr,
        fecha_fin: endStr,
        ingreso: defaultIncome,
        gastos_fijos: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // --- Arrastre de Saldo (Rollover) ---
    if (prevCiclo) {
      try {
        // 1. Gastos del mes anterior
        const { data: prevGastos } = await supabase
          .from('gastos')
          .select('total')
          .eq('ciclo_id', prevCiclo.id);
        const totalGastos = (prevGastos || []).reduce((sum, g) => sum + (g.total || 0), 0);

        // 2. Ingresos extra del mes anterior (por fecha)
        const { data: prevIncomes } = await supabase
          .from('ingresos_extra')
          .select('monto')
          .eq('user_id', user.id)
          .gte('fecha', prevCiclo.fecha_inicio)
          .lte('fecha', prevCiclo.fecha_fin);
        const totalIncomes = (prevIncomes || []).reduce((sum, i) => sum + (i.monto || 0), 0);

        // 3. Compromisos mensuales
        const { data: compromisos } = await supabase
          .from('compromisos')
          .select('monto')
          .eq('user_id', user.id);
        const totalCommitments = (compromisos || []).reduce((sum, c) => sum + (c.monto || 0), 0);

        // Calcular balance final
        const balance = prevCiclo.ingreso + totalIncomes - totalGastos - totalCommitments;

        if (balance > 0) {
          // Sobró dinero -> Ingreso para el nuevo ciclo
          await supabase.from('ingresos_extra').insert({
            user_id: user.id,
            nombre: 'Saldo mes anterior',
            monto: balance,
            fecha: newCiclo.fecha_inicio
          });
        } else if (balance < 0) {
          // Faltó dinero -> Gasto en contra en el nuevo ciclo
          await supabase.from('gastos').insert({
            user_id: user.id,
            ciclo_id: newCiclo.id,
            categoria: 'otro',
            comercio: 'Déficit mes anterior',
            total: Math.abs(balance),
            fecha_gasto: newCiclo.fecha_inicio
          });
        }
      } catch (err) {
        console.error('Error al calcular arrastre de saldo:', err);
      }
    }

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
      income: ciclo.ingreso || 0,
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
      // Handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm..." formats
      const dateString = g.fecha_gasto.substring(0, 10);
      const [year, month, day] = dateString.split('-').map(Number);
      expenseDate = new Date(year, month - 1, day, 12, 0, 0); // noon local time
    } else {
      expenseDate = new Date();
    }
    const cycleInfo = getCycleInfo(expenseDate, cycleDay || 25);
    return {
      id: g.id,
      amount: g.total || 0,
      category: g.categoria || 'otro',
      date: g.fecha_gasto ? g.fecha_gasto.substring(0, 10) : new Date().toISOString().slice(0, 10),
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

    // Optimistic UI update
    setState(prev => ({
      ...prev,
      expenses: [expense, ...prev.expenses]
    }));

    let insertPayload = {
      user_id: user.id,
      ciclo_id: cicloId || null,
      comercio: expense.merchant || null,
      total: expense.amount,
      categoria: expense.category,
      medio_pago: expense.paymentMethod ? expense.paymentMethod.charAt(0).toUpperCase() + expense.paymentMethod.slice(1) : 'Efectivo',
      entidad_banco: expense.paymentEntity || null,
      fecha_gasto: expense.date,
      origen: 'manual',
    };

    let response = await supabase.from('gastos').insert(insertPayload).select().single();

    // Fallback if the user's DB doesn't have the new columns OR if the ENUM values still don't match
    if (response.error && (response.error.message?.includes('does not exist') || response.error.message?.includes('enum') || response.error.status === 400)) {
      console.warn('addExpense: Retrying with minimal payload due to error:', response.error.message);
      delete insertPayload.medio_pago;
      delete insertPayload.entidad_banco;
      delete insertPayload.origen;
      response = await supabase.from('gastos').insert(insertPayload).select().single();
    }

    const { data: gasto, error } = response;

    if (error) { 
      console.error('addExpense final error:', error); 
      showToast(`Error al guardar gasto: ${error.message || error.code}`, 'error');
      // Revert optimistic update by reloading data
      await loadCurrentCycleAndExpenses();
      return; 
    }

    showToast('Gasto guardado correctamente');

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

  // ─── Commitments (DB) ───
  const addCommitment = async (commitment) => {
    if (!user) return;
    const { data, error } = await supabase.from('compromisos').insert({
      user_id: user.id,
      nombre: commitment.name,
      monto: commitment.amount,
      dia_pago: commitment.day
    }).select().single();

    if (error) { console.error('addCommitment error:', error); return; }

    setState(prev => ({
      ...prev,
      commitments: [...prev.commitments, { id: data.id, name: data.nombre, amount: data.monto, day: data.dia_pago }]
    }));
  };

  const updateCommitment = async (updated) => {
    if (!user) return;
    const { error } = await supabase.from('compromisos').update({
      nombre: updated.name,
      monto: updated.amount,
      dia_pago: updated.day
    }).eq('id', updated.id);

    if (error) { console.error('updateCommitment error:', error); return; }

    setState(prev => ({
      ...prev,
      commitments: prev.commitments.map(c => c.id === updated.id ? updated : c)
    }));
  };

  const deleteCommitment = async (id) => {
    if (!user) return;
    await supabase.from('compromisos').delete().eq('id', id);
    setState(prev => ({ ...prev, commitments: prev.commitments.filter(c => c.id !== id) }));
  };

  // ─── Income (DB) ───
  const addIncome = async (income) => {
    if (!user) return;
    const { data, error } = await supabase.from('ingresos_extra').insert({
      user_id: user.id,
      nombre: income.name,
      monto: income.amount,
      fecha: income.date || new Date().toISOString()
    }).select().single();

    if (error) { console.error('addIncome error:', error); return; }

    setState(prev => ({
      ...prev,
      incomes: [...(prev.incomes || []), { id: data.id, name: data.nombre, amount: data.monto, date: data.fecha }]
    }));
  };

  const deleteIncome = async (id) => {
    if (!user) return;
    await supabase.from('ingresos_extra').delete().eq('id', id);
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
      if (updates.cycleDay !== undefined) {
        await supabase.from('profiles').update({ ciclo_dia: updates.cycleDay }).eq('id', user.id);
      }
      if (updates.income !== undefined && state.currentCiclo) {
        await supabase.from('ciclos').update({ ingreso: updates.income }).eq('id', state.currentCiclo.id);
      }
    }

    if (updates.categoryBudgets) {
      // Sync each category budget to DB
      Object.entries(updates.categoryBudgets).forEach(async ([categoria, monto]) => {
        await supabase.from('presupuestos').upsert({
          user_id: user.id,
          categoria,
          monto
        }, { onConflict: 'user_id,categoria' });
      });
      localStorage.setItem(LOCAL_BUDGETS_KEY, JSON.stringify(updates.categoryBudgets));
    }
  };

  // ─── User Profile Metadata ───
  const updateUserProfile = async (metadataUpdates) => {
    if (!user) return;
    const { data, error } = await supabase.auth.updateUser({
      data: metadataUpdates
    });
    if (error) {
      console.error("Error updating user profile:", error);
      showToast("Error al actualizar perfil: " + error.message, 'error');
    } else {
      setUser(data.user);
      showToast("Perfil actualizado");
    }
  };

  // ─── Sign out ───
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // ─── Complete onboarding ───
  const completeOnboarding = () => {
    setNeedsOnboarding(false);
    // Defer data load so React can re-render the main app first
    setTimeout(() => loadAllData(), 300);
  };

  return (
    <FinanceContext.Provider value={{
      user,
      authLoading,
      dataLoading,
      needsOnboarding,
      completeOnboarding,
      state,
      setState,
      signOut,
      addExpense,
      deleteExpense,
      updateSettings,
      addCommitment,
      updateCommitment,
      deleteCommitment,
      addAsset,
      deleteAsset,
      addDebt,
      deleteDebt,
      addIncome,
      deleteIncome,
      updateUserProfile,
      toasts,
      showToast,
      skipLoading: () => setDataLoading(false),
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}
