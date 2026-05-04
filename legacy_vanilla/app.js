/* ========================================================
   PLANGA — Control Financiero Personal
   ======================================================== */

// ===== CONSTANTS =====
const CATEGORY_ICONS = {
  comida: '🍔', mercado: '🛒', transporte: '🚌',
  ocio: '🎮', suscripciones: '📱', otro: '📦'
};
const CATEGORY_COLORS = {
  comida: '#f97316', mercado: '#3b82f6', transporte: '#8b5cf6',
  ocio: '#ec4899', suscripciones: '#06b6d4', otro: '#64748b'
};
const STORAGE_KEY = 'planga_data';

// ===== STATE =====
let state = loadState();

function defaultState() {
  return {
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
    selectedMonth: new Date().toISOString().slice(0, 7) // YYYY-MM
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate old data
      if (!parsed.commitments) parsed.commitments = defaultState().commitments;
      if (!parsed.cycleDay) parsed.cycleDay = 1;
      if (!parsed.categoryBudgets) parsed.categoryBudgets = defaultState().categoryBudgets;
      if (!parsed.expenses) parsed.expenses = [];
      if (!parsed.incomes) parsed.incomes = [];
      if (!parsed.savings) parsed.savings = [];
      if (!parsed.investments) parsed.investments = [];
      if (!parsed.debts) parsed.debts = [];
      if (!parsed.selectedMonth) parsed.selectedMonth = new Date().toISOString().slice(0, 7);
      return parsed;
    }
  } catch (e) { /* ignore */ }
  return defaultState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ===== HELPERS =====
function fmt(n) {
  return '$' + Math.round(n).toLocaleString('es-CO');
}

function getCycleInfo(date, cycleDay) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  let effYear, effMonth;
  if (day >= cycleDay) {
    const next = new Date(year, month + 1, 1);
    effYear = next.getFullYear();
    effMonth = next.getMonth() + 1;
  } else {
    effYear = year;
    effMonth = month + 1;
  }

  const monthKey = `${effYear}-${String(effMonth).padStart(2, '0')}`;
  const endDate = new Date(effYear, effMonth - 1, cycleDay - 1, 23, 59, 59);
  const startDate = new Date(effYear, effMonth - 2, cycleDay, 0, 0, 0);
  
  return { monthKey, startDate, endDate };
}

function getMonthKey() { 
  if (state.selectedMonth) return state.selectedMonth;
  return getCycleInfo(new Date(), state.cycleDay).monthKey;
}

function getDaysInMonth() { 
  const [year, month] = getMonthKey().split('-').map(Number);
  return new Date(year, month, 0).getDate(); 
}

function changeMonth(delta) {
  const [year, month] = getMonthKey().split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  state.selectedMonth = d.toISOString().slice(0, 7);
  
  updateMonthDisplay();
  renderAll();
}

function updateMonthDisplay() {
  const [year, month] = getMonthKey().split('-').map(Number);
  const d = new Date(year, month - 1);
  const monthName = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  
  // Show cycle range if not day 1
  let range = '';
  if (state.cycleDay > 1) {
    const start = new Date(year, month - 2, state.cycleDay);
    const end = new Date(year, month - 1, state.cycleDay - 1);
    range = ` <small style="display:block; font-size:0.65rem; color:var(--text3); font-weight:normal">${start.getDate()} ${start.toLocaleDateString('es-CO',{month:'short'})} - ${end.getDate()} ${end.toLocaleDateString('es-CO',{month:'short'})}</small>`;
  }

  const display = document.getElementById('current-month-display');
  if (display) display.innerHTML = (monthName.charAt(0).toUpperCase() + monthName.slice(1)) + range;
}

function renderAll() {
  renderDashboard();
  renderSummary();
  if (typeof renderAnalytics === 'function') renderAnalytics();
  if (typeof renderReportsScreen === 'function') renderReportsScreen();
}

function getDaysRemaining() {
  const today = new Date();
  const currentCycle = getCycleInfo(today, state.cycleDay);
  const mk = getMonthKey();

  if (mk !== currentCycle.monthKey) {
    return 30; // Approximation for future/past months
  }

  const diff = currentCycle.endDate - today;
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
}

function getCurrentMonthExpenses() {
  const mk = getMonthKey();
  return state.expenses.filter(e => e.month === mk);
}

function getFutureCommitments() {
  const today = new Date();
  const day = today.getDate();
  return state.commitments.filter(c => c.day >= day);
}

function getTotalSpent() {
  return getCurrentMonthExpenses().reduce((s, e) => s + e.amount, 0);
}

function getTotalCommitments() {
  return getFutureCommitments().reduce((s, c) => s + c.amount, 0);
}

function getAvailableMoney() {
  return state.income - getTotalSpent() - getTotalCommitments();
}

function getDailyBudget() {
  return Math.max(getAvailableMoney() / getDaysRemaining(), 0);
}

function getTodaySpent() {
  const today = new Date().toISOString().slice(0, 10);
  return getCurrentMonthExpenses().filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
}

function getStatus() {
  const todaySpent = getTodaySpent();
  const budget = getDailyBudget();
  const available = getAvailableMoney();

  if (available <= 0) return { level: 'red', icon: '🚨', text: 'Sin dinero disponible. Detén los gastos.' };
  if (todaySpent > budget * 1.2) return { level: 'red', icon: '🔴', text: `Te pasaste ${fmt(todaySpent - budget)} hoy. Mañana ajusta.` };
  if (todaySpent > budget * 0.8) return { level: 'yellow', icon: '⚠️', text: 'Cuidado, te acercas al límite de hoy.' };
  if (todaySpent > 0) return { level: 'green', icon: '✅', text: 'Vas bien, sigue así.' };
  return { level: 'green', icon: '💪', text: 'Nuevo día. Controla cada peso.' };
}

// ===== NAVIGATION =====
function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === screenId);
  });

  // Show/hide FAB
  const fab = document.getElementById('fab-add');
  if (fab) fab.style.display = screenId === 'screen-dashboard' ? 'flex' : 'none';

  if (screenId === 'screen-add') {
    const today = new Date().toISOString().slice(0, 10);
    const dateInput = document.getElementById('expense-date');
    dateInput.value = today;
    dateInput.max = today;
  }
  
  // Refresh screens
  if (screenId === 'screen-dashboard') renderDashboard();
  if (screenId === 'screen-summary') renderSummary();
  if (screenId === 'screen-commitments') renderCommitments();
  if (screenId === 'screen-portfolio') renderPortfolio();
  // Init month display
  updateMonthDisplay();
  
  if (screenId === 'screen-analytics' && typeof renderAnalytics === 'function') renderAnalytics();
  if (screenId === 'screen-reports' && typeof renderReportsScreen === 'function') renderReportsScreen();
}

// ===== RENDER: DASHBOARD =====
function renderDashboard() {
  const available = getAvailableMoney();
  const daysLeft = getDaysRemaining();
  const dailyBudget = getDailyBudget();
  const totalSpent = getTotalSpent();
  const status = getStatus();
  const expenses = getCurrentMonthExpenses();
  const daysElapsed = new Date().getDate();
  const dailyAvg = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
  const spentPercent = state.income > 0 ? Math.min((totalSpent + getTotalCommitments()) / state.income * 100, 100) : 0;

  // Status banner
  const banner = document.getElementById('status-banner');
  banner.className = `status-banner status-${status.level}`;
  document.getElementById('status-icon').textContent = status.icon;
  document.getElementById('status-text').textContent = status.text;

  // Main card
  document.getElementById('available-money').textContent = fmt(available);
  document.getElementById('days-remaining').textContent = daysLeft;
  document.getElementById('daily-budget').textContent = fmt(dailyBudget);

  // Main card border color
  const mainCard = document.getElementById('main-card');
  mainCard.className = 'glass-card main-card';
  mainCard.classList.add(`pulse-border-${status.level}`);

  // Stat highlight color
  const statHL = document.querySelector('.stat-highlight');
  if (statHL) {
    statHL.style.color = status.level === 'green' ? 'var(--green)' : status.level === 'yellow' ? 'var(--yellow)' : 'var(--red)';
  }

  // Progress ring
  const circumference = 2 * Math.PI * 48; // r=48
  const offset = circumference - (spentPercent / 100) * circumference;
  const ringFill = document.getElementById('progress-ring-fill');
  ringFill.style.strokeDashoffset = offset;
  ringFill.style.stroke = spentPercent > 90 ? 'var(--red)' : spentPercent > 70 ? 'var(--yellow)' : 'var(--green)';
  document.getElementById('spent-percent').textContent = Math.round(spentPercent) + '%';

  // Progress stats
  document.getElementById('total-spent-dash').textContent = fmt(totalSpent);
  document.getElementById('daily-avg-dash').textContent = fmt(dailyAvg);
  document.getElementById('commitments-total').textContent = fmt(getTotalCommitments());

  // Recent expenses (last 4)
  const recent = [...expenses].reverse().slice(0, 4);
  const list = document.getElementById('recent-expenses');
  if (recent.length === 0) {
    list.innerHTML = '<li class="empty-state">Sin gastos registrados hoy.</li>';
  } else {
    list.innerHTML = recent.map(e => expenseItemHTML(e)).join('');
  }
}

function expenseItemHTML(e) {
  const icon = CATEGORY_ICONS[e.category] || '📦';
  const time = new Date(e.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const label = e.merchant || e.category;
  return `<li class="expense-item" onclick="showExpenseDetails('${e.id}')">
    <div class="expense-icon">${icon}</div>
    <div class="expense-info"><span class="expense-cat">${label}</span><span class="expense-time">${time}</span></div>
    <span class="expense-amount">-${fmt(e.amount)}</span>
  </li>`;
}

// ===== RENDER: SUMMARY =====
function renderSummary() {
  const expenses = getCurrentMonthExpenses();
  const totalSpent = getTotalSpent();
  const daysElapsed = Math.max(new Date().getDate(), 1);
  const dailyAvg = totalSpent / daysElapsed;
  const idealSpent = (state.income - state.commitments.reduce((s,c)=>s+c.amount,0)) / getDaysInMonth(new Date()) * daysElapsed;
  const ratio = idealSpent > 0 ? Math.min(totalSpent / idealSpent * 100, 150) : 0;

  document.getElementById('summary-total').textContent = fmt(totalSpent);
  document.getElementById('summary-avg').textContent = fmt(dailyAvg);
  document.getElementById('budget-ratio').textContent = Math.round(ratio) + '%';

  const barFill = document.getElementById('budget-bar-fill');
  barFill.style.width = Math.min(ratio, 100) + '%';
  barFill.style.background = ratio > 100 ? 'var(--red)' : ratio > 80 ? 'var(--yellow)' : 'var(--green)';

  // Category breakdown
  const catTotals = {};
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const maxCat = Math.max(...Object.values(catTotals), 1);
  const breakdown = document.getElementById('category-breakdown');

  if (Object.keys(catTotals).length === 0) {
    breakdown.innerHTML = '<p class="empty-state">Sin datos todavía.</p>';
  } else {
    breakdown.innerHTML = Object.entries(catTotals)
      .sort((a,b) => b[1] - a[1])
      .map(([cat, total]) => `
        <div class="cat-row">
          <div class="cat-row-icon">${CATEGORY_ICONS[cat]||'📦'}</div>
          <div class="cat-row-info">
            <span class="cat-row-name">${cat}</span>
            <div class="cat-row-bar"><div class="cat-row-bar-fill" style="width:${total/maxCat*100}%;background:${CATEGORY_COLORS[cat]||'var(--accent)'}"></div></div>
          </div>
          <span class="cat-row-amount">${fmt(total)}</span>
        </div>
      `).join('');
  }

  // Full list
  const fullList = document.getElementById('full-expense-list');
  if (expenses.length === 0) {
    fullList.innerHTML = '<li class="empty-state">Sin gastos registrados.</li>';
  } else {
    fullList.innerHTML = [...expenses].reverse().map(e => {
      const icon = CATEGORY_ICONS[e.category] || '📦';
      const d = new Date(e.timestamp);
      const dateStr = d.toLocaleDateString('es-CO', { day:'numeric', month:'short' });
      const timeStr = d.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
      const label = e.merchant || e.category;
      return `<li class="expense-item" onclick="showExpenseDetails('${e.id}')">
        <div class="expense-icon">${icon}</div>
        <div class="expense-info"><span class="expense-cat">${label}</span><span class="expense-time">${dateStr} · ${timeStr}</span></div>
        <span class="expense-amount">-${fmt(e.amount)}</span>
        <button class="expense-delete" onclick="event.stopPropagation(); deleteExpense('${e.id}')" aria-label="Eliminar">✕</button>
      </li>`;
    }).join('');
  }
}

// ===== RENDER: COMMITMENTS =====
function renderCommitments() {
  const list = document.getElementById('commitments-list');
  if (state.commitments.length === 0) {
    list.innerHTML = '<p class="empty-state">Sin compromisos registrados.</p>';
    return;
  }
  const today = new Date().getDate();
  list.innerHTML = state.commitments
    .sort((a,b) => a.day - b.day)
    .map(c => {
      const isPast = c.day < today;
      const icon = isPast ? '✅' : '📅';
      const impact = isPast ? 'Ya pagado' : `Impacto: -${fmt(c.amount)}`;
      const impactClass = isPast ? '' : 'commit-impact';
      return `<div class="commit-card">
        <div class="commit-icon">${icon}</div>
        <div class="commit-info"><span class="commit-name">${c.name}</span><span class="commit-date">Día ${c.day} de cada mes</span></div>
        <div class="commit-right">
          <span class="commit-amount">${fmt(c.amount)}</span>
          <span class="${impactClass}">${impact}</span>
          <button class="commit-delete" onclick="deleteCommitment('${c.id}')" aria-label="Eliminar">✕</button>
        </div>
      </div>`;
    }).join('');
}

// ===== ADD EXPENSE =====
let selectedCategory = 'comida';
let selectedPaymentMethod = 'efectivo';
let selectedPaymentType = 'debito';

function selectCategory(btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedCategory = btn.dataset.cat;
}

function selectPaymentMethod(btn) {
  document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedPaymentMethod = btn.dataset.method;
  
  const cardDetails = document.getElementById('card-details-section');
  if (selectedPaymentMethod === 'tarjeta') {
    cardDetails.classList.remove('hidden');
  } else {
    cardDetails.classList.add('hidden');
  }
}

function selectCardType(type) {
  selectedPaymentType = type;
  document.getElementById('type-debito').style.background = type === 'debito' ? 'var(--accent)' : 'transparent';
  document.getElementById('type-debito').style.color = type === 'debito' ? 'white' : 'var(--text2)';
  document.getElementById('type-credito').style.background = type === 'credito' ? 'var(--accent)' : 'transparent';
  document.getElementById('type-credito').style.color = type === 'credito' ? 'white' : 'var(--text2)';
}

function handleAddExpense(e) {
  e.preventDefault();
  const input = document.getElementById('expense-amount');
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const selectedDate = document.getElementById('expense-date').value;
  if (!amount || amount <= 0) return false;

  const now = new Date();
  const expenseDate = selectedDate ? new Date(selectedDate + 'T12:00:00') : now;
  const cycleInfo = getCycleInfo(expenseDate, state.cycleDay);
  const monthKey = cycleInfo.monthKey;
  
  const expense = {
    id: 'e' + Date.now(),
    amount,
    category: selectedCategory,
    date: expenseDate.toISOString().slice(0, 10),
    month: monthKey,
    timestamp: now.toISOString(),
    merchant: window.currentOcrData?.merchant || null,
    items: window.currentOcrData?.items || [],
    metadata: window.currentOcrData?.metadata || [],
    paymentMethod: selectedPaymentMethod,
    paymentEntity: selectedPaymentMethod === 'tarjeta' ? document.getElementById('payment-entity').value : null,
    paymentType: selectedPaymentMethod === 'tarjeta' ? selectedPaymentType : null
  };

  state.expenses.push(expense);
  saveState();

  // Clean OCR data after saving
  window.currentOcrData = null;

  // Visual feedback
  const btn = document.getElementById('btn-register');
  const btnText = btn.querySelector('.btn-text');
  const btnCheck = document.getElementById('btn-check');
  btnText.classList.add('hidden');
  btnCheck.classList.remove('hidden');
  btn.style.background = 'var(--green)';

  // Show feedback message
  const feedback = document.getElementById('amount-feedback');
  const status = getStatus();
  feedback.textContent = status.text;
  feedback.style.color = status.level === 'green' ? 'var(--green)' : status.level === 'yellow' ? 'var(--yellow)' : 'var(--red)';

  setTimeout(() => {
    input.value = '';
    feedback.textContent = '';
    btnText.classList.remove('hidden');
    btnCheck.classList.add('hidden');
    btn.style.background = '';
    if (typeof clearOcrPreview === 'function') clearOcrPreview();
    navigateTo('screen-dashboard');
  }, 1200);

  return false;
}

// Amount live feedback
document.getElementById('expense-amount')?.addEventListener('input', function() {
  const val = parseFloat(this.value) || 0;
  const fb = document.getElementById('amount-feedback');
  const budget = getDailyBudget();
  if (val <= 0) { fb.textContent = ''; return; }
  if (val > budget) {
    fb.textContent = `⚠️ Supera tu presupuesto diario (${fmt(budget)})`;
    fb.style.color = 'var(--red)';
  } else if (val > budget * 0.7) {
    fb.textContent = `Cuidado, es el ${Math.round(val/budget*100)}% de tu presupuesto diario`;
    fb.style.color = 'var(--yellow)';
  } else {
    fb.textContent = `Dentro del presupuesto ✓`;
    fb.style.color = 'var(--green)';
  }
});

// ===== DELETE EXPENSE =====
function deleteExpense(id) {
  state.expenses = state.expenses.filter(e => e.id !== id);
  saveState();
  renderAll();
  showToast('Gasto eliminado de todos los registros');
}

// ===== COMMITMENTS =====
function openAddCommitment() {
  document.getElementById('modal-commitment').classList.remove('hidden');
}

function saveCommitment(e) {
  e.preventDefault();
  const name = document.getElementById('commit-name').value.trim();
  const amount = parseFloat(document.getElementById('commit-amount').value);
  const day = parseInt(document.getElementById('commit-day').value);
  if (!name || !amount || !day) return false;

  state.commitments.push({ id: 'c' + Date.now(), name, amount, day });
  saveState();
  closeModal('modal-commitment');
  document.getElementById('commitment-form').reset();
  renderCommitments();
  showToast('Compromiso agregado');
  return false;
}

function deleteCommitment(id) {
  state.commitments = state.commitments.filter(c => c.id !== id);
  saveState();
  renderCommitments();
  showToast('Compromiso eliminado');
}

// ===== SETTINGS =====
function openSettings() {
  document.getElementById('setting-income').value = state.income;
  document.getElementById('setting-day').value = state.cycleDay;

  // Populate category budgets
  const grid = document.getElementById('category-budgets-grid');
  if (grid) {
    grid.innerHTML = Object.keys(CATEGORY_ICONS).map(cat => `
      <div class="budget-input-group">
        <label for="budget-${cat}">${CATEGORY_ICONS[cat]} ${cat}</label>
        <input id="budget-${cat}" type="number" class="input budget-setting-input" 
               data-cat="${cat}" value="${state.categoryBudgets[cat] || 0}" min="0" />
      </div>
    `).join('');
  }

  document.getElementById('modal-settings').classList.remove('hidden');
}

function saveSettings(e) {
  e.preventDefault();
  const income = parseFloat(document.getElementById('setting-income').value);
  const day = parseInt(document.getElementById('setting-day').value);
  
  if (income > 0) state.income = income;
  if (day >= 1 && day <= 31) state.cycleDay = day;

  // Save category budgets
  const budgetInputs = document.querySelectorAll('.budget-setting-input');
  budgetInputs.forEach(input => {
    const cat = input.dataset.cat;
    const val = parseFloat(input.value) || 0;
    state.categoryBudgets[cat] = val;
  });

  saveState();
  closeModal('modal-settings');
  renderDashboard();
  if (typeof renderAnalytics === 'function') renderAnalytics();
  showToast('Configuración guardada');
  return false;
}

function resetAllData() {
  if (confirm('¿Seguro que quieres borrar todos los datos? Esta acción no se puede deshacer.')) {
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    saveState();
    closeModal('modal-settings');
    renderDashboard();
    showToast('Datos reiniciados');
  }
}

// ===== EXPENSE DETAILS =====
let currentViewingExpenseId = null;

function showExpenseDetails(id) {
  const e = state.expenses.find(ex => ex.id === id);
  if (!e) return;
  currentViewingExpenseId = id;

  document.getElementById('details-icon').textContent = CATEGORY_ICONS[e.category] || '📦';
  document.getElementById('details-merchant').textContent = e.merchant || e.category.charAt(0).toUpperCase() + e.category.slice(1);
  
  const d = new Date(e.timestamp);
  const dateStr = d.toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' });
  const timeStr = d.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
  document.getElementById('details-date').textContent = `${dateStr} · ${timeStr}`;
  
  // Payment Info Tag
  const tag = document.getElementById('details-payment-tag');
  if (e.paymentMethod) {
    tag.classList.remove('hidden');
    let label = e.paymentMethod === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta';
    if (e.paymentMethod === 'tarjeta' && e.paymentEntity) {
      label += ` · ${e.paymentEntity} (${e.paymentType === 'debito' ? 'Débito' : 'Crédito'})`;
    }
    tag.textContent = label;
  } else {
    tag.classList.add('hidden');
  }
  
  const itemsList = document.getElementById('details-items-list');
  const itemsContainer = document.getElementById('details-items-container');
  
  if (e.items && e.items.length > 0) {
    itemsContainer.classList.remove('hidden');
    itemsList.innerHTML = e.items.map(item => `
      <li class="details-item">
        <span>• ${item.desc}</span>
        <span class="details-item-price">${fmt(item.price)}</span>
      </li>
    `).join('');
  } else {
    itemsContainer.classList.add('hidden');
  }
  
  // Metadata List
  const metaList = document.getElementById('details-meta-list');
  const metaContainer = document.getElementById('details-meta-container');
  const metaContent = document.getElementById('details-meta-content');
  const metaToggle = document.querySelector('.details-meta-toggle');
  
  metaContent.classList.add('hidden');
  metaToggle.classList.remove('active');

  if (e.metadata && e.metadata.length > 0) {
    metaContainer.classList.remove('hidden');
    metaList.innerHTML = e.metadata.map(m => `
      <li class="details-meta-item">
        <span>${m.label}</span>
        <span class="details-meta-val">${m.value}</span>
      </li>
    `).join('');
  } else {
    metaContainer.classList.add('hidden');
  }
  
  document.getElementById('details-total').textContent = fmt(e.amount);
  document.getElementById('modal-details').classList.remove('hidden');
}

function toggleMetadata() {
  const content = document.getElementById('details-meta-content');
  const toggle = document.querySelector('.details-meta-toggle');
  content.classList.toggle('hidden');
  toggle.classList.toggle('active');
}

function showMerchantDetails(merchantName) {
  const expenses = getCurrentMonthExpenses().filter(e => e.merchant === merchantName);
  if (expenses.length === 0) return;

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const allItems = [];
  expenses.forEach(e => {
    if (e.items) allItems.push(...e.items);
  });

  document.getElementById('merchant-details-name').textContent = merchantName;
  document.getElementById('merchant-details-count').textContent = `${expenses.length} compras este mes`;
  document.getElementById('merchant-details-total').textContent = fmt(total);

  const list = document.getElementById('merchant-products-list');
  if (allItems.length > 0) {
    list.innerHTML = allItems.map(item => `
      <li class="details-item">
        <span>• ${item.desc}</span>
        <span class="details-item-price">${fmt(item.price)}</span>
      </li>
    `).join('');
  } else {
    list.innerHTML = '<li class="empty-state">No hay detalles de productos para este comercio.</li>';
  }

  document.getElementById('modal-merchant-details').classList.remove('hidden');
}

function deleteCurrentExpense() {
  if (currentViewingExpenseId) {
    document.getElementById('modal-confirm-delete').classList.remove('hidden');
  }
}

function executeDelete() {
  if (currentViewingExpenseId) {
    deleteExpense(currentViewingExpenseId);
    closeModal('modal-confirm-delete');
    closeModal('modal-details');
  }
}

function exportToCSV() {
  if (!state.expenses || state.expenses.length === 0) {
    showToast('No hay gastos para exportar');
    return;
  }

  let csv = 'Fecha,Categoria,Comercio,Monto\n';
  state.expenses.forEach(e => {
    const row = [
      e.date,
      e.category,
      (e.merchant || '').replace(/,/g, ''),
      e.amount
    ].join(',');
    csv += row + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planga_reporte_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Reporte exportado con éxito');
}

// ===== MODALS =====
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}
function closeModalOnBackdrop(e, id) {
  if (e.target === e.currentTarget) closeModal(id);
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2200);
}

// ===== PORTFOLIO LOGIC =====
function renderPortfolio() {
  const totalSavings = state.savings.reduce((s, a) => s + a.amount, 0);
  const totalInvestments = state.investments.reduce((s, a) => s + a.amount, 0);
  const totalAssets = totalSavings + totalInvestments;
  
  const totalDebtRemaining = state.debts.reduce((s, d) => s + (d.total - d.paid), 0);
  const netWorth = totalAssets - totalDebtRemaining;

  document.getElementById('net-worth-amount').textContent = fmt(netWorth);
  document.getElementById('total-assets').textContent = fmt(totalAssets);
  document.getElementById('total-liabilities').textContent = fmt(totalDebtRemaining);

  renderSavings();
  renderInvestments();
  renderDebts();
}

function renderSavings() {
  const list = document.getElementById('savings-list');
  if (state.savings.length === 0) {
    list.innerHTML = '<p class="empty-state">No tienes ahorros registrados.</p>';
    return;
  }
  list.innerHTML = state.savings.map(s => `
    <div class="portfolio-item">
      <div class="portfolio-info">
        <span class="portfolio-name">${s.name}</span>
        <span class="portfolio-val">${fmt(s.amount)}</span>
      </div>
      <button class="icon-btn-sm" onclick="deleteAsset('savings', '${s.id}')">✕</button>
    </div>
  `).join('');
}

function renderInvestments() {
  const list = document.getElementById('investments-list');
  if (state.investments.length === 0) {
    list.innerHTML = '<p class="empty-state">No tienes inversiones registradas.</p>';
    return;
  }
  list.innerHTML = state.investments.map(i => `
    <div class="portfolio-item">
      <div class="portfolio-info">
        <span class="portfolio-name">${i.name}</span>
        <span class="portfolio-val">${fmt(i.amount)}</span>
      </div>
      <button class="icon-btn-sm" onclick="deleteAsset('investments', '${i.id}')">✕</button>
    </div>
  `).join('');
}

function renderDebts() {
  const list = document.getElementById('debts-list');
  if (state.debts.length === 0) {
    list.innerHTML = '<p class="empty-state">No tienes deudas pendientes.</p>';
    return;
  }
  list.innerHTML = state.debts.map(d => {
    const remaining = d.total - d.paid;
    const progress = (d.paid / d.total) * 100;
    return `
      <div class="portfolio-item debt-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <div class="portfolio-info">
            <span class="portfolio-name">${d.name}</span>
            <span class="portfolio-val" style="color:var(--red)">Restante: ${fmt(remaining)}</span>
          </div>
          <button class="icon-btn-sm" onclick="deleteAsset('debts', '${d.id}')">✕</button>
        </div>
        <div class="debt-progress-container">
          <div class="debt-progress-bar" style="width: ${progress}%"></div>
          <span class="debt-progress-text">${Math.round(progress)}% pagado de ${fmt(d.total)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function openAddAsset(type) {
  document.getElementById('asset-type').value = type;
  document.getElementById('asset-modal-title').textContent = type === 'saving' ? 'Nuevo Ahorro' : 'Nueva Inversión';
  document.getElementById('modal-asset').classList.remove('hidden');
}

function saveAsset(e) {
  e.preventDefault();
  const type = document.getElementById('asset-type').value;
  const name = document.getElementById('asset-name').value;
  const amount = parseFloat(document.getElementById('asset-amount').value);
  
  if (type === 'saving') state.savings.push({ id: 's'+Date.now(), name, amount });
  else state.investments.push({ id: 'i'+Date.now(), name, amount });
  
  saveState();
  closeModal('modal-asset');
  document.getElementById('asset-form').reset();
  renderPortfolio();
  showToast('Guardado con éxito');
  return false;
}

function openAddLiability() {
  document.getElementById('modal-liability').classList.remove('hidden');
}

function saveLiability(e) {
  e.preventDefault();
  const name = document.getElementById('debt-name').value;
  const total = parseFloat(document.getElementById('debt-total').value);
  const paid = parseFloat(document.getElementById('debt-paid').value);
  
  state.debts.push({ id: 'd'+Date.now(), name, total, paid });
  saveState();
  closeModal('modal-liability');
  document.getElementById('liability-form').reset();
  renderPortfolio();
  showToast('Deuda registrada');
  return false;
}

function deleteAsset(collection, id) {
  if (confirm('¿Eliminar este registro?')) {
    state[collection] = state[collection].filter(x => x.id !== id);
    saveState();
    renderPortfolio();
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
});
