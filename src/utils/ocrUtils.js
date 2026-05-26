const MERCHANT_MAP = {
  'exito': 'mercado',
  'carulla': 'mercado',
  'olimpica': 'mercado',
  'jumbo': 'mercado',
  'metro': 'mercado',
  'd1': 'mercado',
  'ara': 'mercado',
  'isimo': 'mercado',
  'mcdonald': 'comida',
  'burger king': 'comida',
  'rappi': 'comida',
  'uber': 'transporte',
  'didi': 'transporte',
  'cabify': 'transporte',
  'indriver': 'transporte',
  'netflix': 'suscripciones',
  'spotify': 'suscripciones',
  'disney': 'suscripciones',
  'star+': 'suscripciones',
  'amazon': 'otro',
  'cine colombia': 'ocio',
  'procinal': 'ocio'
};

export async function prepareImage(file, rotation) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
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
    'nit', 'tel', 'telefono', 'resolucion', 'dian', 'trx', 'apro', 'aprobado', 'cambio', 
    'vuelto', 'exento', 'base', 'impuesto', 'articulos', 'articulo', 'atendido',
    'factura', 'electronica', 'vigencia', 'cliente', 'tarj', 'tarjeta', 'pago',
    'total', 'pagar', 'monto', 'suma', 'entregados', 'recibo',
    'efectivo', 'items', 'item', 'iva', 'generacion', 'emision'
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
      
      // Robust word boundaries matching to prevent false positives like "Diana" matching "dian"
      const isMeta = (metaKeywords.some(key => {
        if (key === 'tarj') {
          return /\btarj(eta)?\b/i.test(lower);
        }
        if (key === 'tel') {
          return /\btel(efono)?\b/i.test(lower);
        }
        const regex = new RegExp(`\\b${key}\\b`, 'i');
        return regex.test(lower);
      }) || desc.length < 3 || isAddress) && !hasQuantityPattern;

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
      const isMetaLine = metaKeywords.some(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'i');
        return regex.test(lower);
      });
      if (isMetaLine && line.length > 5) {
        metadata.push({ label: line, value: '' });
      }
    }
  });

  return { items, metadata };
}

function extractMerchant(lines) {
  if (lines.length === 0) return 'Comercio desconocido';

  const fullText = lines.join('\n').toLowerCase();
  
  // 1. Check for a known merchant from MERCHANT_MAP in the whole text
  for (const merchantKey of Object.keys(MERCHANT_MAP)) {
    if (fullText.includes(merchantKey)) {
      return merchantKey.charAt(0).toUpperCase() + merchantKey.slice(1);
    }
  }
  
  // 2. Look for typical NIT / SAS / S.A. in the first 5 lines
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const l = lines[i];
    const upper = l.toUpperCase();
    if (upper.includes('NIT') || upper.includes('SAS') || upper.includes('S.A.') || upper.includes('S.A')) {
      let part = l;
      if (upper.includes('NIT')) {
        part = l.split(/nit/i)[0];
      }
      let merchant = part.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const lower = merchant.toLowerCase();
      if (lower === 'di' || lower === 'di sas' || lower.includes('d1')) return 'D1';
      if (merchant.length > 2) return merchant;
    }
  }
  
  // 3. Fallback: First line that is not a welcoming header or metadata noise
  const noiseHeaders = [
    'bienvenido', 'bienvenidos', 'factura', 'simplificada', 'electronica', 
    'venta', 'ticket', 'recibo', 'caja', 'cajero', 'original', 'copia'
  ];
  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    const line = lines[i];
    if (!line) continue;
    const lower = line.toLowerCase();
    const hasNoise = noiseHeaders.some(noise => lower.includes(noise));
    if (!hasNoise && line.replace(/[^a-zA-Z]/g, '').length >= 3) {
      return line.substring(0, 30).trim();
    }
  }
  
  return lines[0] ? lines[0].substring(0, 30).trim() : 'Comercio desconocido';
}

function extractDate(text) {
  // Support Spanish month names like "23 de mayo de 2026" or "15 dic 25"
  const monthsEs = {
    enero: '01', feb: '02', febrero: '02', marzo: '03', abr: '04', abril: '04', 
    mayo: '05', jun: '06', junio: '06', jul: '07', julio: '07', ago: '08', agosto: '08', 
    sep: '09', septiembre: '09', oct: '10', octubre: '10', nov: '11', noviembre: '11', 
    dic: '12', diciembre: '12'
  };
  
  const spanishDateRegex = /(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|feb|abr|jun|jul|ago|sep|oct|nov|dic)\s+(?:de\s+)?(\d{2,4})/i;
  const esMatch = text.match(spanishDateRegex);
  if (esMatch) {
    const day = esMatch[1].padStart(2, '0');
    const monthName = esMatch[2].toLowerCase();
    const month = monthsEs[monthName];
    let year = esMatch[3];
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${year}-${month}-${day}`;
  }

  // 1. Check for DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY first (4-digit year)
  const date4YrRegex = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/;
  const match4 = text.match(date4YrRegex);
  if (match4) {
    const day = match4[1].padStart(2, '0');
    const month = match4[2].padStart(2, '0');
    const year = match4[3];
    return `${year}-${month}-${day}`;
  }

  // 2. Check for YYYY/MM/DD or YYYY-MM-DD
  const dateYrFirstRegex = /\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b/;
  const matchYrFirst = text.match(dateYrFirstRegex);
  if (matchYrFirst) {
    const year = matchYrFirst[1];
    const month = matchYrFirst[2].padStart(2, '0');
    const day = matchYrFirst[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 3. Check for DD/MM/YY or DD-MM-YY (2-digit year)
  const date2YrRegex = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2})\b/;
  const match2 = text.match(date2YrRegex);
  if (match2) {
    const day = match2[1].padStart(2, '0');
    const month = match2[2].padStart(2, '0');
    let year = match2[3];
    year = '20' + year; // Assume 20xx
    return `${year}-${month}-${day}`;
  }

  // Check generic date phrases
  const genMatch = text.match(/(?:Generacion|Fecha|Emision)[:\s]*([\d/-]{6,10})/i);
  if (genMatch) {
    const parts = genMatch[1].split(/[/-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        let year = parts[2];
        if (year.length === 2) year = '20' + year;
        return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }

  return new Date().toISOString().slice(0, 10);
}

function extractTotal(text, lines) {
  // Capture typical total keywords. Priority list.
  const keywords = ['TOTAL A PAGAR', 'VALOR PAGADO', 'TOTAL', 'PAGAR', 'VALOR', 'MONTO', 'SUMA', 'RECIBO', 'T0TAL'];
  let foundAmounts = [];

  for (const kw of keywords) {
    // Ensure word boundary check to avoid matching parts of other words (e.g. subtotal matching total)
    // and allow non-digit characters in between the keyword and the total number (e.g. Total Recaudado)
    const regex = new RegExp(`\\b${kw}\\b[^0-9\\n]*\\$?[:\\s]*([0-9.,\\sOoIl]{3,})`, 'i');
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      // Skip subtotal lines if looking for TOTAL or other general keywords
      if (kw === 'TOTAL' && (lowerLine.includes('subtotal') || lowerLine.includes('sub-total') || lowerLine.includes('sub total'))) {
        continue;
      }
      // Skip base/impuesto/iva/quantity/order lines when looking for final total
      if (['TOTAL', 'PAGAR', 'VALOR', 'MONTO'].includes(kw) && 
          (lowerLine.includes('iva') || lowerLine.includes('base') || lowerLine.includes('impuesto') || 
           lowerLine.includes('retefuente') || lowerLine.includes('descuento') || 
           lowerLine.includes('articulos') || lowerLine.includes('items') || 
           lowerLine.includes('productos') || lowerLine.includes('unidades') || 
           lowerLine.includes('cantidad') || lowerLine.includes('orden'))) {
        continue;
      }

      const match = line.match(regex);
      if (match) {
        let numStr = match[1].trim();
        if (!numStr) continue;

        // Fix common OCR misreads
        numStr = numStr.replace(/[Oo]/g, '0').replace(/[Il]/g, '1');
        // Remove all spaces
        numStr = numStr.replace(/\s+/g, '');
        
        // Strip trailing 2-digit decimals (cents like .00 or ,00 or ,19)
        numStr = numStr.replace(/[.,]\d{2}\b/g, '');

        // Handle Colombian format: 58.880 -> 58880
        // If it has a dot or comma, and there are 3 digits after it, it's likely a thousands separator
        if (/[.,]\d{3}(?!\d)/.test(numStr)) {
          numStr = numStr.replace(/[.,]/g, '');
        } else {
          // Normal decimal handling
          numStr = numStr.replace(',', '.');
        }

        const val = parseFloat(numStr);
        if (!isNaN(val) && val > 0) return val; // Return the first strong match found (priority order)
      }
    }
  }

  // Fallback: search all currency-like numbers
  const currencyRegex = /\b\d{1,3}(?:[.,\s]\d{3})+\b|\b\d{4,7}\b/g;
  const allNumbers = text.match(currencyRegex);
  if (allNumbers) {
    allNumbers.forEach(n => {
      let cleanVal = n.replace(/[\s.,]/g, '');
      const val = parseFloat(cleanVal);
      // Exclude huge numbers like NITs or phone numbers
      if (val > 500 && val < 2000000) {
        foundAmounts.push(val);
      }
    });
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
