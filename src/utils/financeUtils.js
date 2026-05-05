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
  const month = d.getMonth(); // 0 to 11
  const day = d.getDate();
  const cd = parseInt(cycleDay) || 1;

  let startYear, startMonth;

  if (day >= cd) {
    // We are on or past the cycle start day in the current month
    startYear = year;
    startMonth = month;
  } else {
    // We are before the cycle start day, so the cycle started last month
    if (month === 0) {
      startYear = year - 1;
      startMonth = 11;
    } else {
      startYear = year;
      startMonth = month - 1;
    }
  }

  // Calculate start date
  const startDate = new Date(startYear, startMonth, cd, 0, 0, 0);
  
  // Calculate end date (it's 1 millisecond before the NEXT cycle start)
  let nextStartYear = startYear;
  let nextStartMonth = startMonth + 1;
  if (nextStartMonth > 11) {
    nextStartMonth = 0;
    nextStartYear += 1;
  }
  const nextStartDate = new Date(nextStartYear, nextStartMonth, cd, 0, 0, 0);
  const endDate = new Date(nextStartDate.getTime() - 1);
  
  // Name the cycle after the month in which it ends
  const effYear = endDate.getFullYear();
  const effMonth = endDate.getMonth() + 1;
  const monthKey = `${effYear}-${String(effMonth).padStart(2, '0')}`;
  
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
  today.setHours(0,0,0,0);
  const currentCycle = getCycleInfo(today, state.cycleDay);
  const mk = getMonthKey(state);

  // If viewing current cycle
  if (mk === currentCycle.monthKey) {
    const diff = currentCycle.endDate - today;
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
  }

  // If historical/future month
  const [year, month] = mk.split('-').map(Number);
  const cycleMonthDate = new Date(year, month - 1, 15); // representative day
  const cycleInfo = getCycleInfo(cycleMonthDate, state.cycleDay);
  
  if (cycleInfo.endDate < today) return 0; // Past
  
  // Future or other: return total days in that cycle
  const totalDays = Math.round((cycleInfo.endDate - cycleInfo.startDate) / (1000 * 60 * 60 * 24)) + 1;
  return totalDays;
}

export function getCurrentMonthExpenses(state) {
  const mk = getMonthKey(state);
  return state.expenses.filter(e => e.month === mk);
}

export function getFutureCommitments(state) {
  // Return all commitments for the cycle to avoid them disappearing mid-month
  return state.commitments || [];
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
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return getCurrentMonthExpenses(state).filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
}

export function getStatus(state) {
  if (state.income === 0) return { level: 'yellow', icon: '⚙️', text: 'Configura tu ingreso mensual en Ajustes para empezar.' };
  
  const todaySpent = getTodaySpent(state);
  const budget = getDailyBudget(state);
  const available = getAvailableMoney(state);

  if (available <= 0) return { level: 'red', icon: '🚨', text: 'Sin dinero disponible. Detén los gastos.' };
  if (todaySpent > budget * 1.2) return { level: 'red', icon: '🔴', text: `Te pasaste ${fmt(todaySpent - budget)} hoy. Mañana ajusta.` };
  if (todaySpent > budget * 0.8) return { level: 'yellow', icon: '⚠️', text: 'Cuidado, te acercas al límite de hoy.' };
  if (todaySpent > 0) return { level: 'green', icon: '✅', text: 'Vas bien, sigue así.' };
  return { level: 'green', icon: '💪', text: 'Nuevo día. Controla cada peso.' };
}
