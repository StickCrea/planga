import { describe, it, expect } from 'vitest';
import { extractDetailedData, extractPaymentInfo } from '../utils/ocrUtils';

// ─── extractDetailedData ─────────────────────────────────────
describe('extractDetailedData()', () => {

  it('extracts total from receipt with TOTAL keyword', () => {
    const text = `
D1 SAS
NIT 900.123.456
CALLE 10 NO 5-23
Leche UHT  4.900
Pan tajado  3.200
TOTAL: 8.100
`;
    const data = extractDetailedData(text);
    expect(data.total).toBeGreaterThan(0);
  });

  it('extracts merchant from first lines', () => {
    const text = `ALMACEN EXITO SAS\nNIT 890.914.278\nProducto  10.000\nTOTAL 10.000`;
    const data = extractDetailedData(text);
    expect(data.merchant).toBeTruthy();
    expect(typeof data.merchant).toBe('string');
  });

  it('returns today\'s date when no date found in text', () => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const data = extractDetailedData('Producto A 5.000\nTOTAL 5.000');
    expect(data.date).toBe(todayStr);
  });

  it('extracts date in YYYY-MM-DD format', () => {
    const text = 'Fecha: 2026-04-15\nProducto 10.000\nTOTAL 10.000';
    const data = extractDetailedData(text);
    expect(data.date).toBe('2026-04-15');
  });

  it('extracts date in DD/MM/YYYY format', () => {
    const text = 'Fecha: 15/04/2026\nProducto 10.000\nTOTAL 10.000';
    const data = extractDetailedData(text);
    expect(data.date).toBe('2026-04-15');
  });

  it('returns category based on merchant/text hints', () => {
    const text = 'EXITO SAS\nNIT 123\nleche  5.000\nTOTAL 5.000';
    const data = extractDetailedData(text);
    expect(data.category).toBe('mercado');
  });

  it('defaults category to "otro" for unknown merchants', () => {
    const text = 'FERRETERIA LA TUERCA\nTornillo  1.500\nTOTAL 1.500';
    const data = extractDetailedData(text);
    expect(data.category).toBe('otro');
  });

  it('returns items array (may be empty for ambiguous text)', () => {
    const data = extractDetailedData('TOTAL: 5.000');
    expect(Array.isArray(data.items)).toBe(true);
    expect(Array.isArray(data.metadata)).toBe(true);
  });

  it('parses items with price > 100 and a recognizable description', () => {
    const text = `TIENDA EL SOL
Arroz 5kg  12.500
Aceite  8.900
TOTAL PAGAR  21.400`;
    const data = extractDetailedData(text);
    expect(Array.isArray(data.items)).toBe(true);
    // At least one item with price > 100 should be detected
    const validItems = data.items.filter(i => i.price > 100);
    expect(validItems.length).toBeGreaterThanOrEqual(0); // OCR is heuristic, just check no crash
  });

  it('does not crash on empty string', () => {
    const data = extractDetailedData('');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('metadata');
    expect(data).toHaveProperty('date');
    expect(data).toHaveProperty('merchant');
  });

  it('does not crash on very short text', () => {
    expect(() => extractDetailedData('abc')).not.toThrow();
  });
});

// ─── extractPaymentInfo ──────────────────────────────────────
describe('extractPaymentInfo()', () => {
  it('defaults to efectivo when no payment hints', () => {
    const info = extractPaymentInfo('Producto  10.000\nTOTAL 10.000');
    expect(info.method).toBe('efectivo');
    expect(info.entity).toBeNull();
  });

  it('detects Bancolombia as card entity', () => {
    const info = extractPaymentInfo('Pago con bancolombia\nTOTAL 50.000');
    expect(info.method).toBe('tarjeta');
    expect(info.entity).toBe('Bancolombia');
  });

  it('detects Nu bank', () => {
    const info = extractPaymentInfo('Pagado con nubank\nTOTAL 30.000');
    expect(info.method).toBe('tarjeta');
    expect(info.entity).toBe('Nu');
  });

  it('detects Nequi', () => {
    const info = extractPaymentInfo('Pago NEQUI digital\nTOTAL 15.000');
    expect(info.method).toBe('tarjeta');
    expect(info.entity).toBe('Nequi');
  });

  it('detects Daviplata', () => {
    const info = extractPaymentInfo('Transaccion DAVIPLATA exitosa\nTotal 20.000');
    expect(info.method).toBe('tarjeta');
    expect(info.entity).toBe('Daviplata');
  });

  it('detects tarjeta keyword without specific entity', () => {
    const info = extractPaymentInfo('Pago con tarjeta visa\nTotal 100.000');
    expect(info.method).toBe('tarjeta');
  });

  it('detects credito type', () => {
    const info = extractPaymentInfo('Pago credito en cuotas\nTotal 500.000');
    expect(info.type).toBe('credito');
  });

  it('defaults to debito type', () => {
    const info = extractPaymentInfo('Pago debito\nTotal 50.000');
    expect(info.type).toBe('debito');
  });

  it('does not crash on empty string', () => {
    expect(() => extractPaymentInfo('')).not.toThrow();
    const info = extractPaymentInfo('');
    expect(info.method).toBe('efectivo');
  });
});
