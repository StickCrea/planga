import { describe, it, expect } from 'vitest';
import { parseDianQR, mergeInvoiceData } from '../utils/qrUtils';

describe('parseDianQR', () => {
  it('returns empty result for null/empty/non-string input', () => {
    for (const input of [null, undefined, '', '   ', 42]) {
      expect(parseDianQR(input)).toEqual({ total: null, date: null, nit: null, cufe: null, isDian: false });
    }
  });

  it('marks a random non-DIAN string as not an invoice', () => {
    const r = parseDianQR('https://example.com/hello');
    expect(r.isDian).toBe(false);
    expect(r.total).toBeNull();
  });

  it('parses a DIAN portal URL with documentkey (CUFE)', () => {
    const r = parseDianQR('https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=abc123def456');
    expect(r.isDian).toBe(true);
    expect(r.cufe).toBe('abc123def456');
  });

  it('parses key=value fields (NitFac / FecFac / ValTolFac / CUFE)', () => {
    const payload = [
      'NumFac=SETP990000001',
      'FecFac=2026-05-23',
      'NitFac=900123456',
      'ValFac=15000.00',
      'ValIva=2850.00',
      'ValTolFac=17850.00',
      'CUFE=9f8e7d6c5b4a',
    ].join('\n');
    const r = parseDianQR(payload);
    expect(r.total).toBe(17850);
    expect(r.date).toBe('2026-05-23');
    expect(r.nit).toBe('900123456');
    expect(r.cufe).toBe('9f8e7d6c5b4a');
    expect(r.isDian).toBe(true);
  });

  it('parses "Key: Value" style fields', () => {
    const r = parseDianQR('NitFac: 800197268\nFecFac: 15/03/2026\nValTolFac: 42000');
    expect(r.nit).toBe('800197268');
    expect(r.date).toBe('2026-03-15');
    expect(r.total).toBe(42000);
  });

  it('handles Colombian thousands separators in the total', () => {
    expect(parseDianQR('ValTolFac=58.880').total).toBe(58880);
    expect(parseDianQR('ValTolFac=1.234.567,50').total).toBe(1234568);
  });

  it('normalizes DD/MM/YYYY dates to ISO', () => {
    expect(parseDianQR('FecFac=07/01/2026').date).toBe('2026-01-07');
  });

  it('treats presence of total or NIT alone as a DIAN invoice', () => {
    expect(parseDianQR('ValTolFac=10000').isDian).toBe(true);
    expect(parseDianQR('NitFac=900123456').isDian).toBe(true);
  });
});

describe('mergeInvoiceData', () => {
  const baseOcr = {
    total: 9999,
    date: '2026-01-01',
    merchant: 'Tienda OCR',
    category: 'mercado',
    items: [{ can: '1', desc: 'ARROZ', price: 3200 }],
    metadata: [],
  };

  it('leaves OCR data untouched when QR is not a DIAN invoice', () => {
    const qr = parseDianQR('random text');
    const { data, usedQR } = mergeInvoiceData(baseOcr, qr);
    expect(usedQR).toBe(false);
    expect(data).toBe(baseOcr);
  });

  it('overrides total and date from QR but keeps OCR products', () => {
    const qr = parseDianQR('FecFac=2026-05-23\nNitFac=900123456\nValTolFac=17850.00\nCUFE=abc');
    const { data, usedQR } = mergeInvoiceData(baseOcr, qr);
    expect(usedQR).toBe(true);
    expect(data.total).toBe(17850);
    expect(data.date).toBe('2026-05-23');
    expect(data.items).toEqual(baseOcr.items); // products preserved from OCR
    expect(data.merchant).toBe('Tienda OCR'); // merchant preserved from OCR
    expect(data.metadata).toContainEqual({ label: 'NIT (factura electrónica)', value: '900123456' });
    expect(data.metadata).toContainEqual({ label: 'CUFE', value: 'abc' });
  });

  it('keeps OCR total when QR has no total', () => {
    const qr = parseDianQR('CUFE=onlycufe');
    const { data } = mergeInvoiceData(baseOcr, qr);
    expect(data.total).toBe(9999);
  });
});
