/**
 * Lazily loads jsQR (kept out of the initial bundle, like PDF.js on the OCR
 * screen). The import promise is cached so the live-scan loop and the
 * still-image path share a single module instance. Returns the jsQR function,
 * or null if the module can't be loaded.
 */
let _jsQRPromise;
export function loadJsQR() {
  if (!_jsQRPromise) {
    _jsQRPromise = import('jsqr').then((m) => m.default).catch(() => null);
  }
  return _jsQRPromise;
}

/**
 * Runs jsQR over a raw ImageData (e.g. a video frame or a decoded picture) and
 * returns the decoded string, or null. `inversion` defaults to 'dontInvert' —
 * cheapest, right for the per-frame live loop; the still-image path passes
 * 'attemptBoth' since it only runs once and wants to be thorough.
 */
export function scanImageData(jsQR, imageData, inversion = 'dontInvert') {
  if (!jsQR || !imageData) return null;
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: inversion,
  });
  return result ? result.data : null;
}

/**
 * Decodes a QR code from an image data URL (the same JPEG data URL the OCR
 * pipeline already produces via prepareImage / PDF render). Returns the raw
 * decoded string, or null if no QR is present or it can't be read.
 */
export async function readQRFromDataUrl(dataUrl) {
  const jsQR = await loadJsQR();
  if (!jsQR) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(scanImageData(jsQR, imageData, 'attemptBoth'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/**
 * Parses the QR payload of a Colombian DIAN electronic invoice.
 *
 * DIAN invoices encode their QR in one of two shapes:
 *  1. A URL to the DIAN portal carrying the CUFE, e.g.
 *     https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=<CUFE>
 *  2. Newline/`=`-separated key/value fields printed on the graphic
 *     representation, e.g. NitFac=..., FecFac=..., ValTolFac=..., CUFE=...
 *
 * Some payloads mix both (a URL plus embedded fields). We extract whatever is
 * present and return a normalized object. Missing values are left null so the
 * caller can fall back to OCR for those.
 *
 * @returns {{ total: number|null, date: string|null, nit: string|null, cufe: string|null, isDian: boolean }}
 */
export function parseDianQR(qrText) {
  const empty = { total: null, date: null, nit: null, cufe: null, isDian: false };
  if (!qrText || typeof qrText !== 'string') return empty;

  const text = qrText.trim();
  const result = { ...empty };

  // Collect key/value pairs from both `Key=Value` and `Key: Value` forms, and
  // from URL query params, into one case-insensitive lookup.
  const fields = {};
  const addField = (rawKey, rawVal) => {
    if (!rawKey || rawVal === undefined || rawVal === null) return;
    const key = rawKey.trim().toLowerCase();
    const val = String(rawVal).trim();
    if (key && val && fields[key] === undefined) fields[key] = val;
  };

  // 1. URL query params (documentkey, and any embedded DIAN fields).
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    const url = urlMatch[0];
    const qIndex = url.indexOf('?');
    if (qIndex !== -1) {
      url.slice(qIndex + 1).split('&').forEach((pair) => {
        const eq = pair.indexOf('=');
        if (eq !== -1) addField(decodeURIComponent(pair.slice(0, eq)), decodeURIComponent(pair.slice(eq + 1)));
      });
    }
    if (/dian\.gov\.co/i.test(url)) result.isDian = true;
  }

  // 2. Free-form `Key=Value` or `Key: Value` lines anywhere in the payload.
  const kvRegex = /([A-Za-zÁÉÍÓÚñÑ]+)\s*[:=]\s*([^\n;&]+)/g;
  let m;
  while ((m = kvRegex.exec(text)) !== null) {
    addField(m[1], m[2]);
  }

  // ── Normalize known DIAN field names ──
  // Total: ValTolFac (grand total) preferred; fall back to ValFac / ValorTotal.
  const totalRaw = fields['valtolfac'] || fields['valortotalfactura'] || fields['valortotal'] || fields['valfac'] || fields['total'];
  if (totalRaw) {
    const num = parseFloat(String(totalRaw).replace(/[^\d.,]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
    if (!isNaN(num) && num > 0) result.total = Math.round(num);
  }

  // Date: FecFac (YYYY-MM-DD or DD/MM/YYYY).
  const dateRaw = fields['fecfac'] || fields['fechafactura'] || fields['fecha'];
  if (dateRaw) {
    result.date = normalizeDate(dateRaw);
  }

  // NIT of the issuer.
  const nitRaw = fields['nitfac'] || fields['nitoemisor'] || fields['nit'];
  if (nitRaw) result.nit = String(nitRaw).replace(/[^\d]/g, '') || null;

  // CUFE — the unique invoice code; also the strongest signal it's a DIAN invoice.
  const cufeRaw = fields['cufe'] || fields['documentkey'] || fields['cude'];
  if (cufeRaw) {
    result.cufe = String(cufeRaw).trim();
    result.isDian = true;
  }

  if (result.total !== null || result.nit !== null) result.isDian = true;

  return result;
}

/**
 * Merges QR-decoded invoice data into an OCR result. The QR (when it's a real
 * DIAN invoice) is authoritative for the total and date since those come
 * digitally encoded, while the product list stays whatever OCR/Gemini found.
 * NIT and CUFE are appended to metadata for traceability.
 *
 * @returns {{ data: object, usedQR: boolean }}
 */
export function mergeInvoiceData(ocrData, qr) {
  if (!qr || !qr.isDian) return { data: ocrData, usedQR: false };
  const metadata = [...(ocrData.metadata || [])];
  if (qr.nit) metadata.push({ label: 'NIT (factura electrónica)', value: qr.nit });
  if (qr.cufe) metadata.push({ label: 'CUFE', value: qr.cufe });
  return {
    data: {
      ...ocrData,
      total: qr.total !== null ? qr.total : ocrData.total,
      date: qr.date || ocrData.date,
      metadata,
    },
    usedQR: true,
  };
}

function normalizeDate(raw) {
  const s = String(raw).trim();
  // YYYY-MM-DD (optionally with time)
  let match = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  // DD/MM/YYYY or DD-MM-YYYY
  match = s.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  return null;
}
