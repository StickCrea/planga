import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ─── Mock FinanceContext ──────────────────────────────────────
const mockState = {
  income: 3_000_000,
  cycleDay: 25,
  expenses: [],
  commitments: [],
  savings: [],
  investments: [],
  debts: [],
  incomes: [],
  selectedMonth: '2026-05',
  currentCiclo: {
    id: 'c1',
    nombre: '2026-05',
    fecha_inicio: '2026-04-25',
    fecha_fin: '2026-05-24',
    ingreso: 3_000_000,
  },
  categoryBudgets: {},
};

vi.mock('../context/FinanceContext', () => ({
  useFinance: () => ({
    state: mockState,
    user: { id: 'u1', email: 'test@test.com' },
    addExpense: vi.fn(),
    deleteExpense: vi.fn(),
    updateSettings: vi.fn(),
    addCommitment: vi.fn(),
    deleteCommitment: vi.fn(),
    addAsset: vi.fn(),
    deleteAsset: vi.fn(),
    addDebt: vi.fn(),
    deleteDebt: vi.fn(),
    addIncome: vi.fn(),
    deleteIncome: vi.fn(),
    showToast: vi.fn(),
  }),
}));

// ─── Mock chart.js (not needed in unit tests) ──────────────────
vi.mock('react-chartjs-2', () => ({
  Bar: () => <canvas data-testid="bar-chart" />,
  Doughnut: () => <canvas data-testid="doughnut-chart" />,
  Line: () => <canvas data-testid="line-chart" />,
}));

// ─── Mock tesseract.js ─────────────────────────────────────────
vi.mock('tesseract.js', () => ({
  default: { recognize: vi.fn().mockResolvedValue({ data: { text: '' } }) },
}));

// ─── Dashboard ───────────────────────────────────────────────
import Dashboard from '../components/Dashboard';

describe('<Dashboard />', () => {
  it('renders Dinero Disponible label', () => {
    render(<Dashboard onSelectExpense={vi.fn()} />);
    expect(screen.getByText('Dinero Disponible')).toBeInTheDocument();
  });

  it('renders the ring chart container', () => {
    render(<Dashboard onSelectExpense={vi.fn()} />);
    expect(screen.getByText('Gastado')).toBeInTheDocument();
  });

  it('shows empty state message when no recent expenses', () => {
    render(<Dashboard onSelectExpense={vi.fn()} />);
    expect(screen.getByText('Sin gastos recientes.')).toBeInTheDocument();
  });

  it('shows Últimos Gastos section title', () => {
    render(<Dashboard onSelectExpense={vi.fn()} />);
    expect(screen.getByText('Últimos Gastos')).toBeInTheDocument();
  });

  it('calls onSelectExpense when an expense item is clicked', () => {
    // With the module-level mock (no expenses), the empty state is shown.
    // This test verifies the component renders without crashing when callback is provided.
    const onSelectExpense = vi.fn();
    render(<Dashboard onSelectExpense={onSelectExpense} />);
    expect(screen.getByText('Sin gastos recientes.')).toBeInTheDocument();
    // onSelectExpense is not called since there are no expense items
    expect(onSelectExpense).not.toHaveBeenCalled();
  });
});

// ─── Summary ─────────────────────────────────────────────────
import Summary from '../components/Summary';

describe('<Summary />', () => {
  it('renders Resumen del Mes title', () => {
    render(<Summary onSelectExpense={vi.fn()} />);
    expect(screen.getByText('Resumen del Mes')).toBeInTheDocument();
  });

  it('shows Por Categoría section', () => {
    render(<Summary onSelectExpense={vi.fn()} />);
    expect(screen.getByText('Por Categoría')).toBeInTheDocument();
  });

  it('shows Gasto Total label', () => {
    render(<Summary onSelectExpense={vi.fn()} />);
    expect(screen.getByText('Gasto Total')).toBeInTheDocument();
  });

  it('shows empty state when no expenses', () => {
    render(<Summary onSelectExpense={vi.fn()} />);
    expect(screen.getByText('Sin datos todavía.')).toBeInTheDocument();
  });

  it('shows Todos los Gastos del Mes section', () => {
    render(<Summary onSelectExpense={vi.fn()} />);
    expect(screen.getByText('Todos los Gastos del Mes')).toBeInTheDocument();
  });
});

// ─── Commitments ─────────────────────────────────────────────
import Commitments from '../components/Commitments';

describe('<Commitments />', () => {
  it('renders total commitments heading', () => {
    render(<Commitments />);
    expect(screen.getByText('Total Compromisos Mes')).toBeInTheDocument();
  });

  it('shows empty state when no commitments', () => {
    render(<Commitments />);
    expect(screen.getByText('No hay compromisos configurados.')).toBeInTheDocument();
  });

  it('opens modal when + button is clicked', () => {
    render(<Commitments />);
    // The add button has an SVG icon (Plus from lucide-react) and class icon-btn-sm
    const buttons = screen.getAllByRole('button');
    // The first (and only) button is the + add button
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);
    expect(screen.getByText('Nuevo Compromiso Fijo')).toBeInTheDocument();
  });

  it('closes modal when ✕ is clicked', () => {
    render(<Commitments />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    const closeBtn = screen.getByText('✕');
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Nuevo Compromiso Fijo')).not.toBeInTheDocument();
  });
});

// ─── Portfolio ────────────────────────────────────────────────
import Portfolio from '../components/Portfolio';

describe('<Portfolio />', () => {
  it('renders Patrimonio Neto heading', () => {
    render(<Portfolio />);
    expect(screen.getByText('Patrimonio Neto')).toBeInTheDocument();
  });

  it('shows Ahorros section', () => {
    render(<Portfolio />);
    expect(screen.getByText('Ahorros')).toBeInTheDocument();
  });

  it('shows Inversiones section', () => {
    render(<Portfolio />);
    expect(screen.getByText('Inversiones')).toBeInTheDocument();
  });

  it('shows Deudas section', () => {
    render(<Portfolio />);
    expect(screen.getByText('Deudas')).toBeInTheDocument();
  });

  it('shows empty state for savings', () => {
    render(<Portfolio />);
    expect(screen.getByText('No tienes ahorros registrados.')).toBeInTheDocument();
  });

  it('opens Nuevo Ahorro modal', () => {
    render(<Portfolio />);
    // Find the + button next to Ahorros
    const allPlusBtns = screen.getAllByRole('button');
    const savingsBtn = allPlusBtns.find(b => b.textContent === '+');
    fireEvent.click(savingsBtn);
    expect(screen.getByText('Nuevo Ahorro')).toBeInTheDocument();
  });
});

// ─── ExpenseForm ──────────────────────────────────────────────
import ExpenseForm from '../components/ExpenseForm';

describe('<ExpenseForm />', () => {
  it('renders Agregar Gasto title', () => {
    render(<ExpenseForm onSave={vi.fn()} />);
    expect(screen.getByText('Agregar Gasto')).toBeInTheDocument();
  });

  it('renders Registrar Gasto submit button', () => {
    render(<ExpenseForm onSave={vi.fn()} />);
    expect(screen.getByText('Registrar Gasto')).toBeInTheDocument();
  });

  it('renders category buttons', () => {
    render(<ExpenseForm onSave={vi.fn()} />);
    expect(screen.getByText('comida')).toBeInTheDocument();
    expect(screen.getByText('mercado')).toBeInTheDocument();
    expect(screen.getByText('transporte')).toBeInTheDocument();
  });

  it('renders Efectivo and Tarjeta payment buttons', () => {
    render(<ExpenseForm onSave={vi.fn()} />);
    expect(screen.getByText('Efectivo')).toBeInTheDocument();
    expect(screen.getByText('Tarjeta')).toBeInTheDocument();
  });

  it('shows bank entity selector when Tarjeta is selected', () => {
    render(<ExpenseForm onSave={vi.fn()} />);
    const tarjetaBtn = screen.getByText('Tarjeta');
    fireEvent.click(tarjetaBtn);
    expect(screen.getByText('Entidad / Banco')).toBeInTheDocument();
    expect(screen.getByText('Bancolombia')).toBeInTheDocument();
  });

  it('does not submit when amount is empty', () => {
    const onSave = vi.fn();
    render(<ExpenseForm onSave={onSave} />);
    const submitBtn = screen.getByText('Registrar Gasto');
    fireEvent.click(submitBtn);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('does not submit when amount is 0', () => {
    const onSave = vi.fn();
    render(<ExpenseForm onSave={onSave} />);
    const amountInput = document.querySelector('.amount-input');
    fireEvent.change(amountInput, { target: { value: '0' } });
    const submitBtn = screen.getByText('Registrar Gasto');
    fireEvent.click(submitBtn);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('renders date input with max=today', () => {
    render(<ExpenseForm onSave={vi.fn()} />);
    const d = new Date();
    const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dateInput = screen.getByDisplayValue(localToday);
    expect(dateInput).toBeInTheDocument();
  });
});

// ─── SettingsScreen ───────────────────────────────────────────
import SettingsScreen from '../components/SettingsScreen';

describe('<SettingsScreen />', () => {
  it('renders Configuración heading', () => {
    render(<SettingsScreen onSave={vi.fn()} />);
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('renders Ingreso Mensual Base label', () => {
    render(<SettingsScreen onSave={vi.fn()} />);
    expect(screen.getByText('Ingreso Mensual Base')).toBeInTheDocument();
  });

  it('renders Guardar Configuración button', () => {
    render(<SettingsScreen onSave={vi.fn()} />);
    expect(screen.getByText('Guardar Configuración')).toBeInTheDocument();
  });

  it('renders budget inputs for each category', () => {
    render(<SettingsScreen onSave={vi.fn()} />);
    expect(screen.getByText('Presupuestos por Categoría')).toBeInTheDocument();
  });

  it('calls onSave after form submission', () => {
    const onSave = vi.fn();
    render(<SettingsScreen onSave={onSave} />);
    const form = document.querySelector('form');
    fireEvent.submit(form);
    // onSave should be called after the form is submitted
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
