export const CATEGORY_ICONS = {
  comida: '🍔', mercado: '🛒', transporte: '🚌',
  ocio: '🎮', suscripciones: '📱', otro: '📦'
};

export const CATEGORY_COLORS = {
  comida: '#f97316', mercado: '#3b82f6', transporte: '#8b5cf6',
  ocio: '#ec4899', suscripciones: '#06b6d4', otro: '#64748b'
};

export function fmt(n) {
  const num = Math.round(Math.abs(n || 0));
  // Use regex to add thousands separator (period = Colombian format)
  const str = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (n < 0 ? '-$' : '$') + str;
}

export function getCycleInfo(date, cycleDay) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  let effYear, effMonth;
  if (day >= cycleDay) {
    effYear = year;
    effMonth = month + 1;
  } else {
    const prev = new Date(year, month - 1, 1);
    effYear = prev.getFullYear();
    effMonth = prev.getMonth() + 1;
  }

  const monthKey = `${effYear}-${String(effMonth).padStart(2, '0')}`;
  const endDate = new Date(effYear, effMonth, cycleDay - 1, 23, 59, 59);
  const startDate = new Date(effYear, effMonth - 1, cycleDay, 0, 0, 0);
  
  return { monthKey, startDate, endDate };
}

export function getMonthKey(state) {
  if (state.selectedMonth) return state.selectedMonth;
  return getCycleInfo(new Date(), state.cycleDay).monthKey;
}

export function getDaysInMonth(state) {
  const [year, month] = getMonthKey(state).split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

export function getDaysRemaining(state) {
  const today = new Date();
  const currentCycle = getCycleInfo(today, state.cycleDay);
  const mk = getMonthKey(state);

  if (mk !== currentCycle.monthKey) {
    return 30;
  }

  const diff = currentCycle.endDate - today;
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
}

export function getCurrentMonthExpenses(state) {
  const mk = getMonthKey(state);
  return state.expenses.filter(e => e.month === mk);
}

export function getFutureCommitments(state) {
  const today = new Date();
  const day = today.getDate();
  return state.commitments.filter(c => c.day >= day);
}

export function getTotalSpent(state) {
  return getCurrentMonthExpenses(state).reduce((s, e) => s + e.amount, 0);
}

export function getTotalCommitments(state) {
  return getFutureCommitments(state).reduce((s, c) => s + c.amount, 0);
}

export function getAvailableMoney(state) {
  return state.income - getTotalSpent(state) - getTotalCommitments(state);
}

export function getDailyBudget(state) {
  return Math.max(getAvailableMoney(state) / getDaysRemaining(state), 0);
}

export function getTodaySpent(state) {
  const today = new Date().toISOString().slice(0, 10);
  return getCurrentMonthExpenses(state).filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
}

export function getStatus(state) {
  const todaySpent = getTodaySpent(state);
  const budget = getDailyBudget(state);
  const available = getAvailableMoney(state);

  if (available <= 0) return { level: 'red', icon: '🚨', text: 'Sin dinero disponible. Detén los gastos.' };
  if (todaySpent > budget * 1.2) return { level: 'red', icon: '🔴', text: `Te pasaste ${fmt(todaySpent - budget)} hoy. Mañana ajusta.` };
  if (todaySpent > budget * 0.8) return { level: 'yellow', icon: '⚠️', text: 'Cuidado, te acercas al límite de hoy.' };
  if (todaySpent > 0) return { level: 'green', icon: '✅', text: 'Vas bien, sigue así.' };
  return { level: 'green', icon: '💪', text: 'Nuevo día. Controla cada peso.' };
}
