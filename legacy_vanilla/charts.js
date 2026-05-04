/* ========================================================
   PLANGA — Canvas Charts + Analytics Logic
   ======================================================== */

// ===== INCOME MANAGEMENT =====
function openAddIncome() {
  document.getElementById('modal-income').classList.remove('hidden');
}

function saveIncome(e) {
  e.preventDefault();
  const desc = document.getElementById('income-desc').value.trim();
  const amount = parseFloat(document.getElementById('income-amount').value);
  if (!desc || !amount) return false;
  if (!state.incomes) state.incomes = [];
  const now = new Date();
  state.incomes.push({
    id: 'i' + Date.now(), desc, amount,
    month: getMonthKey(),
    date: now.toISOString().slice(0,10),
    timestamp: now.toISOString()
  });
  saveState();
  closeModal('modal-income');
  document.getElementById('income-form').reset();
  renderAnalytics();
  showToast('Ingreso registrado');
  return false;
}

function deleteIncome(id) {
  if (!state.incomes) return;
  state.incomes = state.incomes.filter(i => i.id !== id);
  saveState();
  renderAnalytics();
  showToast('Ingreso eliminado');
}

function getMonthIncomes() {
  if (!state.incomes) state.incomes = [];
  return state.incomes.filter(i => i.month === getMonthKey());
}

function getTotalIncome() {
  return state.income + getMonthIncomes().reduce((s,i) => s + i.amount, 0);
}

// ===== CHART HELPERS =====
function getDevicePixelRatio() { return window.devicePixelRatio || 1; }

function setupCanvas(canvas, w, h) {
  const dpr = getDevicePixelRatio();
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
}

function fmtShort(n) {
  if (n >= 1000000) return '$' + (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return '$' + Math.round(n/1000) + 'K';
  return '$' + Math.round(n);
}

// ===== RENDER ANALYTICS =====
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const active = document.querySelector('.screen.active');
    if (active && active.id === 'screen-analytics') renderAnalytics();
  }, 200);
});

function getChartHeight(base) {
  return window.innerWidth >= 1200 ? base * 1.4 : window.innerWidth >= 768 ? base * 1.2 : base;
}

function renderAnalytics() {
  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalSpent() + getTotalCommitments();
  const balance = totalIncome - totalExpenses;

  // KPIs
  document.getElementById('kpi-income').textContent = fmt(totalIncome);
  document.getElementById('kpi-expenses').textContent = fmt(totalExpenses);
  document.getElementById('kpi-balance').textContent = fmt(balance);

  drawDonut(totalIncome, totalExpenses);
  drawBarChart();
  drawLineChart();
  drawWaterfall(totalIncome);
  renderBudgetTable();
  renderMerchantBreakdown();
  renderTopProducts();
  renderIncomeList();
}

// ===== BUDGET COMPARISON TABLE =====
function renderBudgetTable() {
  const tbody = document.getElementById('budget-table-body');
  if (!tbody) return;

  const expenses = getCurrentMonthExpenses();
  const catTotals = {};
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });

  const cats = Object.keys(CATEGORY_ICONS);
  tbody.innerHTML = cats.map(cat => {
    const budget = state.categoryBudgets[cat] || 0;
    const actual = catTotals[cat] || 0;
    const variation = budget - actual;
    const varClass = variation >= 0 ? 'var-pos' : 'var-neg';
    const varSign = variation >= 0 ? '+' : '';

    return `
      <tr>
        <td>
          <div class="budget-cat-cell">
            <span>${CATEGORY_ICONS[cat]}</span>
            <span style="text-transform:capitalize">${cat}</span>
          </div>
        </td>
        <td class="budget-val">${fmtShort(budget)}</td>
        <td class="budget-val">${fmtShort(actual)}</td>
        <td class="variation-cell ${varClass}">${varSign}${fmtShort(variation)}</td>
      </tr>
    `;
  }).join('');
}

// ===== DONUT CHART =====
function drawDonut(income, expenses) {
  const canvas = document.getElementById('chart-donut');
  const w = 180, h = 180;
  const ctx = setupCanvas(canvas, w, h);
  const cx = w/2, cy = h/2, r = 65, thickness = 22;

  ctx.clearRect(0, 0, w, h);

  const total = Math.max(income, 1);
  const spent = Math.min(expenses, total);
  const remaining = total - spent;
  const slices = [
    { val: spent, color: '#ef4444', label: 'Gastado' },
    { val: remaining, color: '#22c55e', label: 'Disponible' }
  ];

  let angle = -Math.PI / 2;
  slices.forEach(s => {
    const sweep = (s.val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, angle, angle + sweep);
    ctx.strokeStyle = s.color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.stroke();
    angle += sweep + 0.04;
  });

  // Center text
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '800 20px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const pct = Math.round(spent / total * 100);
  ctx.fillText(pct + '%', cx, cy - 8);
  ctx.font = '600 10px Inter, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('utilizado', cx, cy + 10);

  // Legend
  const legend = document.getElementById('donut-legend');
  legend.innerHTML = slices.map(s =>
    `<div class="donut-legend-item">
      <div class="donut-legend-color" style="background:${s.color}"></div>
      <span class="donut-legend-label">${s.label}</span>
      <span class="donut-legend-val">${fmtShort(s.val)}</span>
    </div>`
  ).join('');
}

function renderReportsScreen() {
  const allMonths = {};
  
  // Group all expenses by month
  state.expenses.forEach(e => {
    if (!allMonths[e.month]) allMonths[e.month] = { spent: 0, income: 0 };
    allMonths[e.month].spent += e.amount;
  });

  // Group all incomes
  state.incomes.forEach(i => {
    if (!allMonths[i.month]) allMonths[i.month] = { spent: 0, income: 0 };
    allMonths[i.month].income += i.amount;
  });

  // Include current month even if empty
  const currentMk = new Date().toISOString().slice(0, 7);
  if (!allMonths[currentMk]) allMonths[currentMk] = { spent: 0, income: 0 };

  const sortedMonths = Object.keys(allMonths).sort().reverse();
  const trendContainer = document.getElementById('annual-trend-chart');
  const historyContainer = document.getElementById('monthly-history-list');

  // Trend Chart (Last 6 months)
  const last6 = [...sortedMonths].reverse().slice(-6);
  const maxVal = Math.max(...last6.map(m => Math.max(allMonths[m].spent, allMonths[m].income, 1)));
  
  trendContainer.style.display = 'flex';
  trendContainer.style.alignItems = 'flex-end';
  trendContainer.style.justifyContent = 'space-between';
  trendContainer.style.height = '120px';
  trendContainer.style.padding = '0 10px';

  trendContainer.innerHTML = last6.map(m => {
    const d = new Date(m + '-01T12:00:00');
    const label = d.toLocaleDateString('es-CO', { month: 'short' }).toUpperCase();
    const spentH = (allMonths[m].spent / maxVal) * 80;
    const incomeH = (allMonths[m].income / maxVal) * 80;
    return `
      <div style="display:flex; flex-direction:column; align-items:center; flex:1">
        <div style="display:flex; align-items:flex-end; gap:3px; height:80px">
          <div style="width:8px; height:${incomeH}px; background:var(--green); border-radius:4px 4px 0 0" title="Ingreso: ${fmt(allMonths[m].income)}"></div>
          <div style="width:8px; height:${spentH}px; background:var(--red); border-radius:4px 4px 0 0" title="Gasto: ${fmt(allMonths[m].spent)}"></div>
        </div>
        <span style="font-size:0.6rem; color:var(--text3); margin-top:8px; font-weight:700">${label}</span>
      </div>
    `;
  }).join('');

  // History List
  historyContainer.innerHTML = sortedMonths.map(m => {
    const d = new Date(m + '-01T12:00:00');
    const label = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const balance = allMonths[m].income - allMonths[m].spent;
    return `
      <li class="expense-item" onclick="selectMonthAndGo('${m}')">
        <div class="expense-icon" style="background: var(--bg3)">📅</div>
        <div class="expense-info">
          <span class="expense-cat">${label.charAt(0).toUpperCase() + label.slice(1)}</span>
          <span class="expense-time">Balance: ${fmt(balance)}</span>
        </div>
        <span class="expense-amount" style="color: var(--text)">${fmt(allMonths[m].spent)}</span>
      </li>
    `;
  }).join('');
}

function selectMonthAndGo(month) {
  state.selectedMonth = month;
  updateMonthDisplay();
  navigateTo('screen-dashboard');
}

// ===== BAR CHART =====
function drawBarChart() {
  const canvas = document.getElementById('chart-bar');
  const w = canvas.parentElement.clientWidth - 32;
  const h = getChartHeight(200);
  const ctx = setupCanvas(canvas, w, h);
  ctx.clearRect(0, 0, w, h);

  const expenses = getCurrentMonthExpenses();
  const catTotals = {};
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });

  const cats = Object.keys(CATEGORY_ICONS);
  const values = cats.map(c => catTotals[c] || 0);
  const maxVal = Math.max(...values, 1);

  const padL = 50, padR = 10, padT = 10, padB = 40;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const barW = Math.min(chartW / cats.length * 0.6, window.innerWidth >= 768 ? 52 : 36);
  const gap = chartW / cats.length;

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = padT + chartH - (chartH * i / 4);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.strokeStyle = 'rgba(148,163,184,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '500 9px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(fmtShort(maxVal * i / 4), padL - 6, y);
  }

  // Bars
  cats.forEach((cat, i) => {
    const x = padL + gap * i + (gap - barW) / 2;
    const val = values[i];
    const barH = (val / maxVal) * chartH;
    const y = padT + chartH - barH;
    const color = CATEGORY_COLORS[cat] || '#3b82f6';

    // Bar with rounded top
    const radius = Math.min(barW / 2, 6);
    ctx.beginPath();
    ctx.moveTo(x, padT + chartH);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.lineTo(x + barW - radius, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
    ctx.lineTo(x + barW, padT + chartH);
    ctx.closePath();

    const grad = ctx.createLinearGradient(x, y, x, padT + chartH);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + '44');
    ctx.fillStyle = grad;
    ctx.fill();

    // Value on top
    if (val > 0) {
      ctx.fillStyle = '#f1f5f9';
      ctx.font = '700 8px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fmtShort(val), x + barW/2, y - 6);
    }

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    const icon = CATEGORY_ICONS[cat];
    ctx.fillText(icon, padL + gap * i + gap/2, h - padB + 14);
    ctx.font = '500 7px Inter, sans-serif';
    ctx.fillText(cat.slice(0,6), padL + gap * i + gap/2, h - padB + 26);
  });
}

// ===== LINE CHART =====
function drawLineChart() {
  const canvas = document.getElementById('chart-line');
  const w = canvas.parentElement.clientWidth - 32;
  const h = getChartHeight(180);
  const ctx = setupCanvas(canvas, w, h);
  ctx.clearRect(0, 0, w, h);

  const today = new Date();
  const daysInMonth = getDaysInMonth(today);
  const currentDay = today.getDate();

  // Build daily data
  const expenses = getCurrentMonthExpenses();
  const dailyData = new Array(daysInMonth).fill(0);
  expenses.forEach(e => {
    const day = parseInt(e.date.split('-')[2]);
    if (day >= 1 && day <= daysInMonth) dailyData[day-1] += e.amount;
  });

  // Budget line
  const commitTotal = state.commitments.reduce((s,c) => s + c.amount, 0);
  const dailyBudgetLine = (state.income - commitTotal) / daysInMonth;

  const padL = 45, padR = 10, padT = 15, padB = 30;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const maxVal = Math.max(...dailyData, dailyBudgetLine * 1.5, 1);

  const getX = (i) => padL + (i / (daysInMonth - 1)) * chartW;
  const getY = (v) => padT + chartH - (v / maxVal) * chartH;

  // Grid
  for (let i = 0; i <= 3; i++) {
    const y = padT + chartH - (chartH * i / 3);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.strokeStyle = 'rgba(148,163,184,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '500 8px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(fmtShort(maxVal * i / 3), padL - 5, y + 3);
  }

  // Budget reference line
  ctx.beginPath();
  ctx.moveTo(padL, getY(dailyBudgetLine));
  ctx.lineTo(w - padR, getY(dailyBudgetLine));
  ctx.strokeStyle = '#22c55e44';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#22c55e';
  ctx.font = '600 8px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Meta', padL + 3, getY(dailyBudgetLine) - 5);

  // Area fill
  ctx.beginPath();
  ctx.moveTo(getX(0), padT + chartH);
  for (let i = 0; i < currentDay; i++) {
    ctx.lineTo(getX(i), getY(dailyData[i]));
  }
  ctx.lineTo(getX(currentDay - 1), padT + chartH);
  ctx.closePath();
  const areaGrad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
  areaGrad.addColorStop(0, 'rgba(59,130,246,0.25)');
  areaGrad.addColorStop(1, 'rgba(59,130,246,0.02)');
  ctx.fillStyle = areaGrad;
  ctx.fill();

  // Line
  ctx.beginPath();
  for (let i = 0; i < currentDay; i++) {
    const x = getX(i), y = getY(dailyData[i]);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dots on last 5 days
  for (let i = Math.max(0, currentDay - 5); i < currentDay; i++) {
    ctx.beginPath();
    ctx.arc(getX(i), getY(dailyData[i]), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = dailyData[i] > dailyBudgetLine ? '#ef4444' : '#3b82f6';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Day labels
  const step = daysInMonth <= 15 ? 1 : Math.ceil(daysInMonth / 8);
  for (let i = 0; i < daysInMonth; i += step) {
    ctx.fillStyle = '#64748b';
    ctx.font = '500 8px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(i + 1, getX(i), h - padB + 14);
  }
}

// ===== WATERFALL CHART =====
function drawWaterfall(totalIncome) {
  const canvas = document.getElementById('chart-waterfall');
  const w = canvas.parentElement.clientWidth - 32;
  const h = getChartHeight(200);
  const ctx = setupCanvas(canvas, w, h);
  ctx.clearRect(0, 0, w, h);

  const expenses = getCurrentMonthExpenses();
  const catTotals = {};
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const commitTotal = state.commitments.reduce((s,c) => s + c.amount, 0);

  // Build waterfall items
  const items = [{ label: 'Ingreso', val: totalIncome, type: 'plus' }];
  if (commitTotal > 0) items.push({ label: 'Fijos', val: -commitTotal, type: 'minus' });
  Object.entries(catTotals).sort((a,b) => b[1]-a[1]).forEach(([cat, val]) => {
    items.push({ label: cat.slice(0,7), val: -val, type: 'minus' });
  });
  const balance = totalIncome - getTotalSpent() - commitTotal;
  items.push({ label: 'Balance', val: balance, type: balance >= 0 ? 'total' : 'minus' });

  const padL = 10, padR = 10, padT = 15, padB = 35;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const barW = Math.min(chartW / items.length * 0.65, 40);
  const gap = chartW / items.length;

  const maxVal = totalIncome;
  const getY = (v) => padT + chartH - (v / maxVal) * chartH;

  let running = 0;

  items.forEach((item, i) => {
    const x = padL + gap * i + (gap - barW) / 2;
    let y1, y2;

    if (item.type === 'plus') {
      y1 = getY(0);
      y2 = getY(item.val);
      running = item.val;
    } else if (item.type === 'total') {
      y1 = getY(0);
      y2 = getY(Math.max(item.val, 0));
    } else {
      const oldR = running;
      running += item.val;
      y1 = getY(oldR);
      y2 = getY(running);
    }

    const color = item.type === 'plus' ? '#22c55e' : item.type === 'total' ? '#3b82f6' : '#ef4444';
    const top = Math.min(y1, y2);
    const barH = Math.abs(y2 - y1) || 2;

    // Rounded bar
    const radius = Math.min(barW/2, 4);
    ctx.beginPath();
    ctx.moveTo(x + radius, top);
    ctx.lineTo(x + barW - radius, top);
    ctx.quadraticCurveTo(x + barW, top, x + barW, top + radius);
    ctx.lineTo(x + barW, top + barH - radius);
    ctx.quadraticCurveTo(x + barW, top + barH, x + barW - radius, top + barH);
    ctx.lineTo(x + radius, top + barH);
    ctx.quadraticCurveTo(x, top + barH, x, top + barH - radius);
    ctx.lineTo(x, top + radius);
    ctx.quadraticCurveTo(x, top, x + radius, top);
    ctx.closePath();

    const grad = ctx.createLinearGradient(x, top, x, top + barH);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + '55');
    ctx.fillStyle = grad;
    ctx.fill();

    // Connector line
    if (i < items.length - 1 && item.type !== 'total') {
      const nextX = padL + gap * (i+1) + (gap - barW)/2;
      ctx.beginPath();
      ctx.moveTo(x + barW, item.type === 'plus' ? y2 : getY(running));
      ctx.lineTo(nextX, item.type === 'plus' ? y2 : getY(running));
      ctx.strokeStyle = 'rgba(148,163,184,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3,3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Value
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '700 7px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(fmtShort(Math.abs(item.val)), x + barW/2, top - 5);

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 8px Inter, sans-serif';
    ctx.fillText(item.label, x + barW/2, h - padB + 14);
  });
}

// ===== INCOME LIST =====
function renderIncomeList() {
  const list = document.getElementById('income-list');
  const incomes = getMonthIncomes();
  const base = [{ desc: 'Salario base (config)', amount: state.income, isBase: true }];
  const all = [...base, ...incomes];

  list.innerHTML = all.map(i => {
    const deleteBtn = i.isBase ? '' : `<button class="expense-delete" onclick="deleteIncome('${i.id}')" aria-label="Eliminar">✕</button>`;
    const timeStr = i.timestamp ? new Date(i.timestamp).toLocaleDateString('es-CO',{day:'numeric',month:'short'}) : 'Mensual';
    return `<li class="expense-item">
      <div class="expense-icon" style="background:rgba(34,197,94,0.15)">💰</div>
      <div class="expense-info"><span class="expense-cat">${i.desc}</span><span class="expense-time">${timeStr}</span></div>
      <span class="expense-amount" style="color:var(--green)">+${fmt(i.amount)}</span>
      ${deleteBtn}
    </li>`;
  }).join('');
}

function renderMerchantBreakdown() {
  const expenses = getCurrentMonthExpenses();
  const merchantTotals = {};
  
  expenses.forEach(e => {
    const merchant = e.merchant || 'Otros (Sin clasificar)';
    merchantTotals[merchant] = (merchantTotals[merchant] || 0) + e.amount;
  });

  const sortedMerchants = Object.entries(merchantTotals)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5);

  const realMax = sortedMerchants.length > 0 ? sortedMerchants[0][1] : 1;
  const container = document.getElementById('merchant-breakdown');
  if (!container) return;
  
  if (sortedMerchants.length === 0) {
    container.innerHTML = '<p class="empty-state">Sin datos de comercios este mes.</p>';
    return;
  }

  container.innerHTML = sortedMerchants.map(([name, total]) => `
    <div class="merchant-row" onclick="showMerchantDetails('${name}')" style="cursor: pointer">
      <span class="merchant-name" title="${name}">${name}</span>
      <div class="merchant-bar-wrap">
        <div class="merchant-bar" style="width: ${(total/realMax)*100}%"></div>
      </div>
      <span class="merchant-amount">${fmt(total)}</span>
    </div>
  `).join('');
}

function renderTopProducts() {
  const expenses = getCurrentMonthExpenses();
  const productCounts = {};
  
  expenses.forEach(e => {
    if (e.items) {
      e.items.forEach(item => {
        const name = item.desc.toUpperCase().trim();
        productCounts[name] = (productCounts[name] || 0) + 1;
      });
    }
  });

  const sortedProducts = Object.entries(productCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5);

  const realMax = sortedProducts.length > 0 ? sortedProducts[0][1] : 1;
  const container = document.getElementById('products-breakdown');
  if (!container) return;
  
  if (sortedProducts.length === 0) {
    container.innerHTML = '<p class="empty-state">Aún no hay productos registrados.</p>';
    return;
  }

  container.innerHTML = sortedProducts.map(([name, count]) => `
    <div class="merchant-row">
      <span class="merchant-name" title="${name}">${name}</span>
      <div class="merchant-bar-wrap">
        <div class="merchant-bar" style="width: ${(count/realMax)*100}%; background: var(--green)"></div>
      </div>
      <span class="merchant-amount">${count} veces</span>
    </div>
  `).join('');
}
