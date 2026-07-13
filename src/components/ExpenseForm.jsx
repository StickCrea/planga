import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { getCycleInfo, CATEGORY_ICONS, formatColombianInput, parseColombianInput } from '../utils/financeUtils';
import OCRScanner from './OCRScanner';
import { CreditCard, Banknote } from 'lucide-react';

const getLocalISODate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function ExpenseForm({ onSave }) {
  const { state, addExpense, showToast } = useFinance();
  
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getLocalISODate());
  const [category, setCategory] = useState('comida');
  
  // OCR Data
  const [merchant, setMerchant] = useState('');
  const [items, setItems] = useState([]);
  const [metadata, setMetadata] = useState([]);
  
  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState('efectivo'); // efectivo, tarjeta
  const [paymentEntity, setPaymentEntity] = useState('Bancolombia');
  const [paymentType, setPaymentType] = useState('debito'); // debito, credito

  const handleOcrComplete = (data) => {
    if (data.total) setAmount(formatColombianInput(data.total));
    if (data.category) setCategory(data.category);
    if (data.date) setDate(data.date);
    if (data.merchant) setMerchant(data.merchant);
    if (data.items) setItems(data.items);
    if (data.metadata) setMetadata(data.metadata);
    
    if (data.paymentInfo) {
      setPaymentMethod(data.paymentInfo.method);
      if (data.paymentInfo.entity) setPaymentEntity(data.paymentInfo.entity);
      setPaymentType(data.paymentInfo.type);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseColombianInput(amount);
    if (!amount || parsedAmount <= 0) {
      showToast('Por favor ingresa un monto válido mayor a 0', 'error');
      return;
    }

    const expenseDate = date ? new Date(date + 'T12:00:00') : new Date();
    const cycleInfo = getCycleInfo(expenseDate, state.cycleDay);
    
    const expense = {
      id: 'e' + Date.now(),
      amount: parsedAmount,
      category,
      date: expenseDate.toISOString().slice(0, 10),
      month: cycleInfo.monthKey,
      timestamp: new Date().toISOString(),
      merchant: merchant || null,
      items,
      metadata,
      paymentMethod,
      paymentEntity: paymentMethod === 'tarjeta' ? paymentEntity : null,
      paymentType: paymentMethod === 'tarjeta' ? paymentType : null
    };

    addExpense(expense);
    if (onSave) onSave();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
      
      <OCRScanner onScanComplete={handleOcrComplete} />

      <div className="glass-card">
        <h2 className="modal-title">Agregar Gasto</h2>
        <form onSubmit={handleSubmit} className="expense-form">
          <div className="amount-card">
            <label className="amount-label">Monto del gasto</label>
            <div className="amount-input-wrap">
              <span className="currency-prefix">$</span>
              <input 
                type="text" 
                className="amount-input" 
                placeholder="0" value={amount} 
                onChange={e => setAmount(formatColombianInput(e.target.value))}
              />
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: '4px', textAlign: 'center' }}>
              Monto en pesos colombianos que se descontará de tu presupuesto disponible.
            </p>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label>Fecha</label>
            <input 
              type="date" className="input" 
              value={date} onChange={e => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
            <p style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: '4px' }}>
              Fecha de la compra. Determina el ciclo presupuestal en el que se registra el gasto.
            </p>
          </div>

          <div style={{ marginTop: '12px' }}>
            <label className="cat-label">Categoría</label>
            <p style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: '-4px', marginBottom: '8px' }}>
              Clasifica el consumo para contrastarlo contra tu presupuesto límite de categoría.
            </p>
            <div className="category-grid">
              {Object.entries(CATEGORY_ICONS).map(([cat, icon]) => (
                <button 
                  key={cat} type="button" 
                  className={`cat-btn ${category === cat ? 'selected' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  <span className="cat-icon">{icon}</span>
                  <span className="cat-name">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label className="cat-label">Medio de Pago</label>
            <p style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: '-4px', marginBottom: '8px' }}>
              Selecciona cómo pagaste para rastrear si afecta efectivo líquido o tus pasivos.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button 
                type="button" 
                className={`btn-secondary pay-btn ${paymentMethod === 'efectivo' ? 'selected' : ''}`}
                style={paymentMethod === 'efectivo' ? { borderColor: 'var(--green)', color: 'var(--green)' } : {}}
                onClick={() => setPaymentMethod('efectivo')}
              >
                <Banknote size={18} /> Efectivo
              </button>
              <button 
                type="button" 
                className={`btn-secondary pay-btn ${paymentMethod === 'tarjeta' ? 'selected' : ''}`}
                style={paymentMethod === 'tarjeta' ? { borderColor: 'var(--green)', color: 'var(--green)' } : {}}
                onClick={() => setPaymentMethod('tarjeta')}
              >
                <CreditCard size={18} /> Tarjeta
              </button>
            </div>
          </div>

          {paymentMethod === 'tarjeta' && (
            <div className="glass-card" style={{ padding: '12px', marginTop: '8px' }}>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label>Entidad / Banco</label>
                <select 
                  className="input" 
                  value={paymentEntity} 
                  onChange={(e) => setPaymentEntity(e.target.value)}
                >
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="Nu">Nu</option>
                  <option value="Rappi">Rappi</option>
                  <option value="Daviplata">Daviplata</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Otro">Otro</option>
                </select>
                <span style={{ fontSize: '0.65rem', color: 'var(--text3)', display: 'block', marginTop: '2px' }}>
                  El banco emisor de la tarjeta con la que pagaste.
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    style={{ 
                      width: '100%', 
                      ...(paymentType === 'debito' ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : {})
                    }}
                    onClick={() => setPaymentType('debito')}
                  >
                    Débito
                  </button>
                  <span style={{ fontSize: '0.58rem', color: 'var(--text3)', display: 'block', marginTop: '2px', textAlign: 'center' }}>
                    Descuenta de tus activos
                  </span>
                </div>
                <div>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    style={{ 
                      width: '100%', 
                      ...(paymentType === 'credito' ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : {})
                    }}
                    onClick={() => setPaymentType('credito')}
                  >
                    Crédito
                  </button>
                  <span style={{ fontSize: '0.58rem', color: 'var(--text3)', display: 'block', marginTop: '2px', textAlign: 'center' }}>
                    Aumenta tus pasivos
                  </span>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>
            Registrar Gasto
          </button>
        </form>
      </div>
    </div>
  );
}
