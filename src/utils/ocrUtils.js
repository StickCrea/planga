const MERCHANT_MAP = {
  'exito': 'mercado',
  'd1': 'mercado',
  'ara': 'mercado',
  'jumbo': 'mercado',
  'carulla': 'mercado',
  'mcdonald': 'comida',
  'rappi': 'comida',
  'uber': 'transporte',
  'did': 'transporte',
  'beat': 'transporte',
  'cabify': 'transporte',
  'netflix': 'suscripciones',
  'spotify': 'suscripciones',
  'disney': 'suscripciones',
  'star+': 'suscripciones'
};

export async function prepareImage(file, rotation) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Limit resolution to prevent memory crashes on mobile
      const MAX_SIZE = 1200;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      if (rotation === 90 || rotation === 270) {
        canvas.width = height;
        canvas.height = width;
      } else {
        canvas.width = width;
        canvas.height = height;
      }
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -width / 2, -height / 2, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = URL.createObjectURL(file);
  });
}

export function extractDetailedData(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const data = {
    total: null,
    category: suggestCategory(text),
    merchant: extractMerchant(lines),
    date: extractDate(text),
    items: [],
    metadata: []
  };

  const parsed = parseLines(lines);
  data.items = parsed.items;
  data.metadata = parsed.metadata;
  data.total = extractTotal(text, lines);
  
  return data;
}

function parseLines(lines) {
  const items = [];
  const metadata = [];
  const itemRegex = /(.+?)\s+([\d.,]{3,})\s*[A-Z0-9]?$/i;
  
  const metaKeywords = [
    'nit', 'tel', 'resolucion', 'dian', 'trx', 'apro', 'cambio', 
    'vuelto', 'exento', 'base', 'impuesto', 'articulos', 'atendido',
    'factura', 'electronica', 'vigencia', 'cliente', 'tarj', 'pago',
    'total', 'pagar', 'monto', 'suma', 'entregados', 'recibo',
    'efectivo', 'items', 'iva', 'generacion', 'emision'
  ];

  lines.forEach(line => {
    const lower = line.toLowerCase();
    const match = line.match(itemRegex);

    if (match) {
      let desc = match[1].trim();
      let priceStr = match[2];
      const price = parseFloat(priceStr.replace(/[.,]/g, ''));
      
      const isAddress = /(?:calle|cl |cra |carrera|avenida|diagonal|dg |transversal|tv | nro| no\.| sur| norte)\b/i.test(lower) || lower.includes('bogota');
      
      const quantMatch = line.match(/^[\s\w]{0,3}?\s*(\d+)\s*(?:UN|und|pz|X|[\W_])\s*/i);
      const can = quantMatch ? quantMatch[1] : "1";
      const hasQuantityPattern = quantMatch !== null;
      
      const isMeta = (metaKeywords.some(key => lower.includes(key)) || desc.length < 3 || isAddress) && !hasQuantityPattern;

      if (isMeta) {
        metadata.push({ label: desc, value: priceStr });
      } else {
        desc = desc.replace(/^[\s\w]{0,3}?\s*\d+\s*(?:UN|und|pz|X|[\W_]).*?[\d]{7,}\s*/i, '');
        if (desc === match[1].trim()) {
           desc = desc.replace(/^[\s\w]{0,3}?\s*\d+\s*(?:UN|und|pz|X|[\W_])\s*/i, '');
        }
        desc = desc.replace(/^[—\-\s\d.,]+/, '').replace(/[—\-\s\d.,]+$/, '').trim();

        const lettersOnly = desc.replace(/[^a-zA-Z]/g, '');
        if (price > 100 && lettersOnly.length >= 3) {
          items.push({ can, desc, price });
        } else {
          metadata.push({ label: desc, value: priceStr });
        }
      }
    } else {
      if (metaKeywords.some(key => lower.includes(key)) && line.length > 5) {
        metadata.push({ label: line, value: '' });
      }
    }
  });

  return { items, metadata };
}

function extractMerchant(lines) {
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const l = lines[i];
    if (l.includes('NIT') || l.includes('SAS') || l.includes('S.A')) {
      let merchant = l.split('NIT')[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const lower = merchant.toLowerCase();
      if (lower === 'di' || lower === 'di sas' || lower.includes('d1')) merchant = 'D1';
      return merchant;
    }
  }
  return lines[0] ? lines[0].substring(0, 30).trim() : 'Comercio desconocido';
}

function extractDate(text) {
  const dateRegex = /(\d{4})[/-](\d{2})[/-](\d{2})|(\d{2})[/-](\d{2})[/-](\d{4})/;
  const match = text.match(dateRegex);
  
  let dateStr = new Date().toISOString().slice(0, 10);

  if (match) {
    if (match[1]) {
      dateStr = `${match[1]}-${match[2]}-${match[3]}`;
    } else if (match[4]) {
      dateStr = `${match[6]}-${match[5]}-${match[4]}`;
    }
  } else {
    const genMatch = text.match(/(?:Generacion|Fecha|Emision)[:\s]*([\d/-]{8,})/i);
    if (genMatch) {
      const parts = genMatch[1].split(/[/-]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) dateStr = parts.join('-');
        else dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
  }
  
  try {
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch(e) {
    return new Date().toISOString().slice(0, 10);
  }
}

function extractTotal(text, lines) {
  // Capture typical total keywords. Allow common OCR typos like 'T0TAL'.
  const totalRegex = /(?:TOTAL|PAGAR|VALOR|MONTO|SUMA|RECIBO|T0TAL)\s*[:$]*\s*([0-9.,\sOoIl]+)/i;
  let foundAmounts = [];

  lines.forEach(line => {
    const match = line.match(totalRegex);
    if (match) {
      let numStr = match[1].trim();
      if (!numStr) return;

      // Fix common OCR misreads in numbers
      numStr = numStr.replace(/[Oo]/g, '0').replace(/[Il]/g, '1');
      // Remove spaces between digits
      numStr = numStr.replace(/\s+/g, '');
      
      // Remove thousands separators (dot or comma followed by exactly 3 digits)
      numStr = numStr.replace(/[.,](?=\d{3}(?!\d))/g, '');
      numStr = numStr.replace(',', '.'); // Any remaining comma is likely a decimal
      
      const val = parseFloat(numStr);
      if (!isNaN(val) && val > 0) foundAmounts.push(val);
    }
  });

  // If no keyword match, look for numbers formatted as currency (e.g., 58.880 or 58 880)
  if (foundAmounts.length === 0) {
    const currencyRegex = /\b\d{1,3}(?:[.,\s]\d{3})+\b/g;
    const allNumbers = text.match(currencyRegex);
    if (allNumbers) {
      allNumbers.forEach(n => {
        const cleanVal = n.replace(/[\s.,]/g, '');
        const val = parseFloat(cleanVal);
        // Exclude huge numbers like NITs or phone numbers if they slip through
        if (val > 100 && val < 10000000) {
          foundAmounts.push(val);
        }
      });
    }
  }

  return foundAmounts.length > 0 ? Math.max(...foundAmounts) : null;
}

function suggestCategory(text) {
  const lowerText = text.toLowerCase();
  for (const [merchant, category] of Object.entries(MERCHANT_MAP)) {
    if (lowerText.includes(merchant)) return category;
  }
  if (lowerText.includes('restaurante') || lowerText.includes('cafe') || lowerText.includes('comida')) return 'comida';
  if (lowerText.includes('supermercado') || lowerText.includes('tienda') || lowerText.includes('viveres')) return 'mercado';
  if (lowerText.includes('pasaje') || lowerText.includes('peaje') || lowerText.includes('gasolina')) return 'transporte';
  return 'otro';
}

export function extractPaymentInfo(text) {
  const lower = text.toLowerCase();
  const info = { method: 'efectivo', entity: null, type: 'debito' };
  
  const entities = [
    { key: 'bancolombia', name: 'Bancolombia' },
    { key: 'nu ', name: 'Nu' },
    { key: 'nubank', name: 'Nu' },
    { key: 'rappi', name: 'Rappi' },
    { key: 'daviplata', name: 'Daviplata' },
    { key: 'nequi', name: 'Nequi' }
  ];
  
  const entityFound = entities.find(e => lower.includes(e.key));
  if (entityFound) {
    info.method = 'tarjeta';
    info.entity = entityFound.name;
  }
  
  if (lower.includes('tarjeta') || lower.includes('visa') || lower.includes('mastercard') || lower.includes('cre/deb')) {
    info.method = 'tarjeta';
  }
  
  if (lower.includes('credito') || lower.includes('cuotas') || lower.includes('pago diferido')) {
    info.type = 'credito';
  }
  
  return info;
}
