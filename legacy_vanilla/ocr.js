/* ========================================================
   PLANGA — OCR Receipt Scanner Logic
   ======================================================== */

// ===== CONFIG & MAPPING =====
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

// ===== OCR FUNCTIONS =====
let currentImageFile = null;
let currentRotation = 0;

function triggerScanner() {
  document.getElementById('ocr-input').click();
}

async function handleOcrScan(event) {
  const file = event ? event.target.files[0] : currentImageFile;
  if (!file) return;
  currentImageFile = file;

  const status = document.getElementById('ocr-status');
  const statusText = document.getElementById('ocr-status-text');
  
  status.classList.remove('hidden');
  statusText.textContent = 'Procesando imagen...';

  try {
    // 1. Prepare Image (Apply rotation if any)
    let imgSource = await prepareImage(file, currentRotation);

    // 2. Update Preview
    document.getElementById('ocr-preview-container').classList.remove('hidden');
    document.getElementById('ocr-preview-img').src = imgSource;
    document.getElementById('ocr-preview-img').style.transform = `rotate(0deg)`; // Reset CSS rotation since we baked it into the src

    // 3. Run Tesseract OCR
    statusText.textContent = 'Leyendo texto (OCR)...';
    const result = await Tesseract.recognize(imgSource, 'spa', {
      logger: m => {
        if (m.status === 'recognizing text') {
          statusText.textContent = `Analizando: ${Math.round(m.progress * 100)}%`;
        }
      }
    });

    const text = result.data.text;
    console.log("OCR Result:", text);

    // 3. Extract Detailed Data
    statusText.textContent = 'Analizando detalles...';
    const ocrData = extractDetailedData(text);

    // 4. Update UI with Preview and Debug info
    document.getElementById('ocr-preview-container').classList.remove('hidden');
    document.getElementById('ocr-preview-img').src = imgSource;
    document.getElementById('ocr-debug-text').innerHTML = `
      <div style="color:var(--blue); margin-bottom:4px"><strong>Tienda:</strong> ${ocrData.merchant}</div>
      <div style="color:var(--green); margin-bottom:4px"><strong>Fecha:</strong> ${ocrData.date}</div>
      
      <div style="margin-bottom:8px; border-top:1px solid var(--glass-border); padding-top:8px">
        <strong>Productos (${ocrData.items.length}):</strong>
      </div>
      ${ocrData.items.map(item => `
        <div style="display:flex; justify-content:space-between; font-size:0.7rem; margin-bottom:2px">
          <span>• ${item.desc}</span>
          <span>$${item.price.toLocaleString()}</span>
        </div>
      `).join('') || "No se detectaron productos específicos"}

      <div style="margin-top:12px; color:var(--text3); font-size:0.65rem">
        <strong>Datos técnicos detectados:</strong>
        ${ocrData.metadata.slice(0, 3).map(m => `<div>${m.label} ${m.value}</div>`).join('')}
        ${ocrData.metadata.length > 3 ? `<div>...y ${ocrData.metadata.length - 3} datos más</div>` : ''}
      </div>
    `;

    // 5. Update Form
    if (ocrData.total) {
      document.getElementById('expense-amount').value = Math.round(ocrData.total);
      if (typeof updateAmountFeedback === 'function') updateAmountFeedback(ocrData.total);
    }

    if (ocrData.category) {
      const catBtn = document.querySelector(`.cat-btn[data-cat="${ocrData.category}"]`);
      if (catBtn) selectCategory(catBtn);
    }

    if (ocrData.date) {
      const dateInput = document.getElementById('expense-date');
      if (dateInput) dateInput.value = ocrData.date;
    }

    // Store ocr data globally for app.js to use when saving
    window.currentOcrData = ocrData;

    // 6. Update Payment Method UI from detection
    const paymentInfo = extractPaymentInfo(text);
    const payBtn = document.querySelector(`.pay-btn[data-method="${paymentInfo.method}"]`);
    if (payBtn) {
      if (typeof selectPaymentMethod === 'function') selectPaymentMethod(payBtn);
      if (paymentInfo.method === 'tarjeta') {
        if (paymentInfo.entity) document.getElementById('payment-entity').value = paymentInfo.entity;
        if (typeof selectCardType === 'function') selectCardType(paymentInfo.type);
      }
    }

    status.classList.add('hidden');
    showToast(ocrData.total ? 'Factura analizada con éxito' : 'OCR finalizado (revisa el total)');

  } catch (err) {
    console.error("OCR Error:", err);
    status.classList.add('hidden');
    showToast('Error al procesar la imagen');
  }
}

async function rotatePreview() {
  currentRotation = (currentRotation + 90) % 360;
  // Trigger re-scan with the new rotation
  handleOcrScan();
}

async function prepareImage(file, rotation) {
  return new Promise((resolve) => {
    if (rotation === 0) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (rotation === 90 || rotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = URL.createObjectURL(file);
  });
}

function clearOcrPreview() {
  document.getElementById('ocr-preview-container').classList.add('hidden');
  document.getElementById('ocr-preview-img').src = '';
  document.getElementById('ocr-debug-text').textContent = '';
  document.getElementById('ocr-input').value = '';
  currentImageFile = null;
  currentRotation = 0;
}

// ===== EXTRACTION LOGIC =====
function extractDetailedData(text) {
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
      
      // Look for quantity: optional noise + digits + unit/separator
      const quantMatch = line.match(/^[\s\w]{0,3}?\s*(\d+)\s*(?:UN|und|pz|X|[\W_])\s*/i);
      const can = quantMatch ? quantMatch[1] : "1";
      const hasQuantityPattern = quantMatch !== null;
      
      const isMeta = (metaKeywords.some(key => lower.includes(key)) || desc.length < 3 || isAddress) && !hasQuantityPattern;

      if (isMeta) {
        metadata.push({ label: desc, value: priceStr });
      } else {
        // Clean up prefixes including optional noise, quantity, unit, price and barcode
        desc = desc.replace(/^[\s\w]{0,3}?\s*\d+\s*(?:UN|und|pz|X|[\W_]).*?[\d]{7,}\s*/i, '');
        // If that didn't catch it, try a fallback cleaning
        if (desc === match[1].trim()) {
           desc = desc.replace(/^[\s\w]{0,3}?\s*\d+\s*(?:UN|und|pz|X|[\W_])\s*/i, '');
        }

        // Additional cleanup for common separators or leftovers
        desc = desc.replace(/^[—\-\s\d.,]+/, '').replace(/[—\-\s\d.,]+$/, '').trim();

        // Require description to have at least 3 letters and price to be significant
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
  // Usually the first non-empty line or the one containing "SAS", "NIT", "S.A."
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const l = lines[i];
    if (l.includes('NIT') || l.includes('SAS') || l.includes('S.A')) {
      let merchant = l.split('NIT')[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
      if (merchant.toLowerCase() === 'di') merchant = 'D1';
      return merchant;
    }
  }
  return lines[0] ? lines[0].substring(0, 30).trim() : 'Comercio desconocido';
}

function extractDate(text) {
  // Look for patterns like 2024/04/29 or 29/04/2024
  const dateRegex = /(\d{4})[/-](\d{2})[/-](\d{2})|(\d{2})[/-](\d{2})[/-](\d{4})/;
  const match = text.match(dateRegex);
  
  let dateStr = new Date().toISOString().slice(0, 10);

  if (match) {
    if (match[1]) { // YYYY-MM-DD
      dateStr = `${match[1]}-${match[2]}-${match[3]}`;
    } else if (match[4]) { // DD-MM-YYYY
      dateStr = `${match[6]}-${match[5]}-${match[4]}`;
    }
  } else {
    // Look for "Generacion: 2024/04/29"
    const genMatch = text.match(/(?:Generacion|Fecha|Emision)[:\s]*([\d/-]{8,})/i);
    if (genMatch) {
      const parts = genMatch[1].split(/[/-]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) dateStr = parts.join('-');
        else dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
  }
  
  // Final cleanup: ensure it's a valid date
  try {
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch(e) {
    return new Date().toISOString().slice(0, 10);
  }
}

function extractTotal(text, lines) {
  const totalRegex = /(?:TOTAL|PAGAR|VALOR|MONTO|SUMA|RECIBO)\s*[:$]*\s*([\d.,]+)/i;
  let foundAmounts = [];

  lines.forEach(line => {
    const match = line.match(totalRegex);
    if (match) {
      let numStr = match[1].replace(/[.,](?=\d{3})/g, '');
      numStr = numStr.replace(',', '.');
      const val = parseFloat(numStr);
      if (!isNaN(val) && val > 0) foundAmounts.push(val);
    }
  });

  if (foundAmounts.length === 0) {
    const allNumbers = text.match(/\b\d{1,3}(?:[.,]\d{3})+\b|\b\d{4,}\b/g);
    if (allNumbers) {
      allNumbers.forEach(n => {
        const val = parseFloat(n.replace(/[.,]/g, ''));
        if (val > 100) foundAmounts.push(val);
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

function extractPaymentInfo(text) {
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

