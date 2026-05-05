import { describe, it, expect, beforeEach } from 'vitest';
import {
  fmt,
  getCycleInfo,
  getMonthKey,
  getDaysInMonth,
  getDaysRemaining,
  getCurrentMonthExpenses,
  getFutureCommitments,
  getTotalSpent,
  getTotalCommitments,
  getAvailableMoney,
  getDailyBudget,
  getTodaySpent,
  getStatus,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from '../utils/financeUtils';

// ─── helpers ───────────────────────────────────────────────
function makeState(overrides = {}) {
  return {
    income: 3_000_000,
    cycleDay: 25,
    expenses: [],
    commitments: [],
    savings: [],
    investments: [],
    debts: [],
    incomes: [],
    selectedMonth: null,
    currentCiclo: null,
    categoryBudgets: {},
    ...overrides,
  };
}

function makeExpense(overrides = {}) {
  const date = overrides.date ?? new Date().toISOString().slice(0, 10);
  // month key follows getCycleInfo logic for cycleDay=25
  return {
    id: 'e1',
    amount: 50_000,
    category: 'comida',
    date,
    month: '2026-05', // will be overridden when needed
    timestamp: new Date().toISOString(),
    merchant: null,
    paymentMethod: 'efectivo',
    paymentEntity: null,
    paymentType: null,
    items: [],
    metadata: [],
    ...overrides,
  };
}

// ─── fmt ────────────────────────────────────────────────────
describe('fmt()', () => {
  it('formats zero', () => expect(fmt(0)).toBe('$0'));
  it('formats thousands with period separator', () => expect(fmt(1000)).toBe('$1.000'));
  it('formats millions', () => expect(fmt(1_500_000)).toBe('$1.500.000'));
  it('formats negative numbers with minus sign', () => expect(fmt(-50_000)).toBe('-$50.000'));
  it('rounds decimals', () => expect(fmt(1234.7)).toBe('$1.235'));
  it('handles null/undefined gracefully', () => expect(fmt(null)).toBe('$0'));
  it('handles undefined', () => expect(fmt(undefined)).toBe('$0'));
});

// ─── getCycleInfo ────────────────────────────────────────────
describe('getCycleInfo()', () => {
  it('cycle starting on day 25: date AFTER pay-day belongs to current cycle', () => {
    // May 26 → cycle: May 25 – June 24 → monthKey = 2026-06
    const info = getCycleInfo(new Date(2026, 4, 26), 25); // May 26
    expect(info.monthKey).toBe('2026-06');
    expect(info.startDate.getDate()).toBe(25);
    expect(info.startDate.getMonth()).toBe(4); // May (0-indexed)
  });

  it('cycle starting on day 25: date BEFORE pay-day belongs to previous cycle', () => {
    // May 10 → cycle: Apr 25 – May 24 → monthKey = 2026-05
    const info = getCycleInfo(new Date(2026, 4, 10), 25); // May 10
    expect(info.monthKey).toBe('2026-05');
    expect(info.startDate.getMonth()).toBe(3); // April
  });

  it('handles year boundary (cycleDay=25, date=Jan 10 → prev cycle started Dec 25)', () => {
    const info = getCycleInfo(new Date(2026, 0, 10), 25); // Jan 10
    expect(info.monthKey).toBe('2026-01');
    expect(info.startDate.getFullYear()).toBe(2025);
    expect(info.startDate.getMonth()).toBe(11); // December
  });

  it('endDate is one ms before next cycle start', () => {
    const info = getCycleInfo(new Date(2026, 4, 26), 25);
    const nextStart = new Date(2026, 5, 25, 0, 0, 0); // June 25
    expect(info.endDate.getTime()).toBe(nextStart.getTime() - 1);
  });

  it('cycleDay=1 behaves like a normal calendar month', () => {
    const info = getCycleInfo(new Date(2026, 4, 15), 1); // May 15
    expect(info.monthKey).toBe('2026-05');
    expect(info.startDate.getDate()).toBe(1);
    expect(info.startDate.getMonth()).toBe(4);
  });
});

// ─── getMonthKey ─────────────────────────────────────────────
describe('getMonthKey()', () => {
  it('returns selectedMonth when set', () => {
    const state = makeState({ selectedMonth: '2026-03' });
    expect(getMonthKey(state)).toBe('2026-03');
  });

  it('returns current cycle monthKey when no selectedMonth', () => {
    const state = makeState({ selectedMonth: null, cycleDay: 1 });
    const now = new Date();
    const expected = getCycleInfo(now, 1).monthKey;
    expect(getMonthKey(state)).toBe(expected);
  });
});

// ─── getDaysInMonth ──────────────────────────────────────────
describe('getDaysInMonth()', () => {
  it('returns 31 for 2026-05 (May)', () => {
    const state = makeState({ selectedMonth: '2026-05' });
    expect(getDaysInMonth(state)).toBe(31);
  });

  it('returns 28 for 2026-02 (February non-leap)', () => {
    const state = makeState({ selectedMonth: '2026-02' });
    expect(getDaysInMonth(state)).toBe(28);
  });

  it('returns 29 for 2024-02 (February leap year)', () => {
    const state = makeState({ selectedMonth: '2024-02' });
    expect(getDaysInMonth(state)).toBe(29);
  });
});

// ─── getCurrentMonthExpenses ──────────────────────────────────
describe('getCurrentMonthExpenses()', () => {
  it('returns only expenses matching the selected month', () => {
    const state = makeState({
      selectedMonth: '2026-05',
      expenses: [
        makeExpense({ month: '2026-05', amount: 10_000 }),
        makeExpense({ month: '2026-04', amount: 20_000 }),
        makeExpense({ month: '2026-05', amount: 30_000 }),
      ],
    });
    const result = getCurrentMonthExpenses(state);
    expect(result).toHaveLength(2);
    expect(result.every(e => e.month === '2026-05')).toBe(true);
  });

  it('returns empty array when no expenses in selected month', () => {
    const state = makeState({
      selectedMonth: '2026-06',
      expenses: [makeExpense({ month: '2026-05' })],
    });
    expect(getCurrentMonthExpenses(state)).toHaveLength(0);
  });
});

// ─── getTotalSpent ────────────────────────────────────────────
describe('getTotalSpent()', () => {
  it('sums all current month expenses', () => {
    const state = makeState({
      selectedMonth: '2026-05',
      expenses: [
        makeExpense({ month: '2026-05', amount: 100_000 }),
        makeExpense({ month: '2026-05', amount: 200_000 }),
        makeExpense({ month: '2026-04', amount: 999_000 }), // different month
      ],
    });
    expect(getTotalSpent(state)).toBe(300_000);
  });

  it('returns 0 when no expenses', () => {
    expect(getTotalSpent(makeState())).toBe(0);
  });
});

// ─── getFutureCommitments ─────────────────────────────────────
describe('getFutureCommitments()', () => {
  it('returns commitments on or after today', () => {
    const today = new Date().getDate();
    const state = makeState({
      commitments: [
        { id: 'c1', name: 'Arriendo', amount: 800_000, day: today },         // today ✓
        { id: 'c2', name: 'Internet', amount: 100_000, day: today + 5 },     // future ✓
        { id: 'c3', name: 'Gym', amount: 70_000, day: Math.max(today - 1, 1) }, // past ✗ (unless today=1)
      ],
    });
    const result = getFutureCommitments(state);
    // at minimum today's commitment must be included
    expect(result.some(c => c.id === 'c1')).toBe(true);
    expect(result.some(c => c.id === 'c2')).toBe(true);
    if (today > 1) {
      expect(result.some(c => c.id === 'c3')).toBe(false);
    }
  });
});

// ─── getTotalCommitments ──────────────────────────────────────
describe('getTotalCommitments()', () => {
  it('sums only future commitments', () => {
    const today = new Date().getDate();
    const state = makeState({
      commitments: [
        { id: 'c1', name: 'A', amount: 500_000, day: today },      // included
        { id: 'c2', name: 'B', amount: 200_000, day: today + 10 }, // included
        { id: 'c3', name: 'C', amount: 999_000, day: 1 },           // excluded if today > 1
      ],
    });
    const result = getTotalCommitments(state);
    expect(result).toBeGreaterThanOrEqual(700_000);
    if (today > 1) {
      expect(result).toBe(700_000);
    }
  });
});

// ─── getAvailableMoney ────────────────────────────────────────
describe('getAvailableMoney()', () => {
  it('subtracts spent + future commitments from income', () => {
    const today = new Date().getDate();
    const state = makeState({
      income: 3_000_000,
      selectedMonth: '2026-05',
      expenses: [makeExpense({ month: '2026-05', amount: 500_000 })],
      commitments: [{ id: 'c1', name: 'A', amount: 300_000, day: today }],
    });
    const avail = getAvailableMoney(state);
    expect(avail).toBe(3_000_000 - 500_000 - 300_000);
  });

  it('can be negative when overspent', () => {
    const state = makeState({
      income: 100_000,
      selectedMonth: '2026-05',
      expenses: [makeExpense({ month: '2026-05', amount: 200_000 })],
      commitments: [],
    });
    expect(getAvailableMoney(state)).toBe(-100_000);
  });
});

// ─── getDailyBudget ───────────────────────────────────────────
describe('getDailyBudget()', () => {
  it('returns 0 when available is negative', () => {
    const state = makeState({
      income: 100_000,
      selectedMonth: '2026-05',
      expenses: [makeExpense({ month: '2026-05', amount: 200_000 })],
      commitments: [],
      cycleDay: 1,
    });
    expect(getDailyBudget(state)).toBe(0);
  });

  it('daily budget is available / daysRemaining (approx)', () => {
    const state = makeState({ income: 3_000_000, expenses: [], commitments: [], cycleDay: 1 });
    const budget = getDailyBudget(state);
    expect(budget).toBeGreaterThan(0);
    // Should be roughly income / days remaining (less than income)
    expect(budget).toBeLessThan(3_000_000);
  });
});

// ─── getTodaySpent ────────────────────────────────────────────
describe('getTodaySpent()', () => {
  it('sums only expenses with today\'s date', () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const mk = getCycleInfo(now, 25).monthKey;

    const state = makeState({
      selectedMonth: mk,
      cycleDay: 25,
      expenses: [
        makeExpense({ date: todayStr, month: mk, amount: 80_000 }),
        makeExpense({ date: todayStr, month: mk, amount: 20_000 }),
        makeExpense({ date: '2026-01-01', month: '2026-01', amount: 999_000 }), // different day
      ],
    });
    expect(getTodaySpent(state)).toBe(100_000);
  });

  it('returns 0 when no expenses today', () => {
    const state = makeState({
      selectedMonth: '2025-01',
      expenses: [makeExpense({ date: '2025-01-01', month: '2025-01', amount: 50_000 })],
    });
    // Unless it's actually Jan 1 2025, todaySpent should be 0
    const now = new Date();
    if (now.getFullYear() !== 2025 || now.getMonth() !== 0 || now.getDate() !== 1) {
      expect(getTodaySpent(state)).toBe(0);
    }
  });
});

// ─── getStatus ────────────────────────────────────────────────
describe('getStatus()', () => {
  it('returns red level when available money <= 0', () => {
    const state = makeState({
      income: 100_000,
      selectedMonth: '2026-05',
      expenses: [makeExpense({ month: '2026-05', amount: 200_000 })],
      commitments: [],
    });
    const status = getStatus(state);
    expect(status.level).toBe('red');
    expect(status.icon).toBe('🚨');
  });

  it('returns green level when no expenses today', () => {
    const state = makeState({ income: 3_000_000, expenses: [], commitments: [] });
    const status = getStatus(state);
    expect(status.level).toBe('green');
  });
});

// ─── Constants ───────────────────────────────────────────────
describe('CATEGORY_ICONS', () => {
  it('has an icon for each expected category', () => {
    const expectedCategories = ['comida', 'mercado', 'transporte', 'ocio', 'suscripciones', 'otro'];
    expectedCategories.forEach(cat => {
      expect(CATEGORY_ICONS[cat]).toBeDefined();
    });
  });
});

describe('CATEGORY_COLORS', () => {
  it('has a valid hex color for each category', () => {
    Object.values(CATEGORY_COLORS).forEach(color => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});
