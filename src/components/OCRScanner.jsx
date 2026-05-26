import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Image, FileText, RotateCw, Loader2, Sparkles } from 'lucide-react';
import { prepareImage, extractDetailedData, extractPaymentInfo } from '../utils/ocrUtils';
import { useFinance } from '../context/FinanceContext';

// Dynamic loader for PDF.js to keep initial bundle light
const loadPdfJS = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib || window['pdfjs-dist/build/pdf']) {
      resolve(window.pdfjsLib || window['pdfjs-dist/build/pdf']);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      const pdfjs = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      resolve(pdfjs);
    };
    script.onerror = () => reject(new Error('No se pudo cargar la librería PDF.js'));
    document.head.appendChild(script);
  });
};

export default function OCRScanner({ onScanComplete }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const { showToast } = useFinance();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Escaneando Factura');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const [debugData, setDebugData] = useState(null);
  
  // Track if current preview was upgraded to Gemini AI
  const [wasAiProcessed, setWasAiProcessed] = useState(false);
  
  // Daily rate limits
  const [aiScansToday, setAiScansToday] = useState(0);

  const getAiScansCountToday = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const storedDate = localStorage.getItem('planga_ai_scan_date');
    if (storedDate !== todayStr) {
      localStorage.setItem('planga_ai_scan_date', todayStr);
      localStorage.setItem('planga_ai_scan_count', '0');
      return 0;
    }
    return parseInt(localStorage.getItem('planga_ai_scan_count') || '0', 10);
  };

  const incrementAiScansCount = () => {
    const count = getAiScansCountToday();
    localStorage.setItem('planga_ai_scan_count', String(count + 1));
    setAiScansToday(count + 1);
  };

  useEffect(() => {
    setAiScansToday(getAiScansCountToday());
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setCurrentFile(file);
    setRotation(0);
    setWasAiProcessed(false);
    
    if (file.type === 'application/pdf') {
      processPdf(file, 0);
    } else {
      processImage(file, 0);
    }
  };

  const rotatePreview = () => {
    if (!currentFile) return;
    const newRot = (rotation + 90) % 360;
    setRotation(newRot);
    setWasAiProcessed(false);
    
    if (currentFile.type === 'application/pdf') {
      processPdf(currentFile, newRot);
    } else {
      processImage(currentFile, newRot);
    }
  };

  const processWithGemini = async (imgBase64, mimeType, keyToUse) => {
    let rawBase64 = imgBase64;
    if (imgBase64.includes(';base64,')) {
      rawBase64 = imgBase64.split(';base64,')[1];
    }
    
    const todayStr = new Date().toISOString().slice(0, 10);
    const prompt = `Analiza esta factura e identifica:
1. Nombre del comercio o tienda (merchant).
2. Fecha de la compra (date en formato YYYY-MM-DD). Si no hay fecha visible, usa la fecha de hoy: ${todayStr}. Si dice "ayer", calcula el día anterior a ${todayStr}.
3. Total final de la compra (total como número entero, sin centavos ni decimales de centavos. Redondea al entero más cercano).
4. Lista detallada de productos comprados (items), donde cada artículo debe ser un objeto con:
   - "can": cantidad como número o string (ej. "1", "2").
   - "desc": descripción clara y corta del producto en mayúsculas (ej. "QUESO SABANA").
   - "price": precio final del producto como número entero.
5. Categoría sugerida del gasto (category) que debe ser exactamente una de estas: 'mercado', 'comida', 'transporte', 'ocio', 'suscripciones', 'otro'.
6. Datos de pago si están visibles (paymentInfo):
   - "method": 'efectivo' o 'tarjeta'.
   - "entity": nombre del banco o billetera si está visible (ej. 'Bancolombia', 'Nu', 'Nequi', 'Daviplata', 'Rappi').
   - "type": 'debito' o 'credito'.

Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta, sin bloques de código markdown (\`\`\`json), sin explicaciones adicionales y sin texto extra. Debe ser estrictamente JSON parseable:
{
  "merchant": string,
  "date": string,
  "total": number,
  "category": string,
  "items": Array<{ "can": string|number, "desc": string, "price": number }>,
  "paymentInfo": { "method": string, "entity": string|null, "type": string }
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyToUse}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: rawBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP error! status: ${response.status}`);
    }

    const resData = await response.json();
    const textResponse = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      throw new Error('No se recibió respuesta válida del modelo.');
    }

    try {
      const cleanJsonStr = textResponse.replace(/```json/i, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJsonStr);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", textResponse);
      throw new Error('Error al interpretar la respuesta de IA.');
    }
  };

  const handleUpgradeToGemini = async () => {
    if (!previewSrc) return;
    
    const count = getAiScansCountToday();
    if (count >= 10) {
      showToast('Has alcanzado el límite de 10 escaneos de IA por hoy', 'error');
      return;
    }

    // Prioritize Env Variable, fallback to internal developer key
    const systemApiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('planga_gemini_api_key') || '';
    if (!systemApiKey) {
      showToast('Error de configuración: Clave API de Gemini del sistema no encontrada', 'error');
      console.error("Gemini API key is missing. Please configure VITE_GEMINI_API_KEY in your environmental variables or configure it internally.");
      return;
    }

    setLoading(true);
    setLoadingMessage('Mejorando con IA Inteligente');
    setLoadingProgress(30);

    try {
      setLoadingProgress(55);
      const aiResult = await processWithGemini(previewSrc, 'image/jpeg', systemApiKey);
      setLoadingProgress(85);

      const ocrData = {
        total: aiResult.total || null,
        category: aiResult.category || 'otro',
        merchant: aiResult.merchant || 'Comercio',
        date: aiResult.date || new Date().toISOString().slice(0, 10),
        items: aiResult.items || [],
        metadata: []
      };
      const paymentInfo = aiResult.paymentInfo || { method: 'efectivo', entity: null, type: 'debito' };

      setDebugData(ocrData);
      setWasAiProcessed(true);
      incrementAiScansCount();

      if (onScanComplete) {
        onScanComplete({ ...ocrData, paymentInfo });
      }

      setLoadingProgress(100);
      showToast('Factura optimizada con éxito mediante Gemini AI', 'success');

    } catch (err) {
      console.error("Gemini Upgrade Error:", err);
      showToast('Error al conectar con la IA de Gemini. Reintenta.', 'error');
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const processImage = async (file, rot) => {
    setLoading(true);
    setLoadingMessage('Escaneando Factura');
    setLoadingProgress(0);

    try {
      const imgSource = await prepareImage(file, rot);
      setPreviewSrc(imgSource);

      // Default: local Tesseract OCR engine (fast & completely offline-free)
      const result = await Tesseract.recognize(imgSource, 'spa', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setLoadingProgress(Math.round(m.progress * 100));
          }
        }
      });

      const text = result.data.text;
      const ocrData = extractDetailedData(text);
      const paymentInfo = extractPaymentInfo(text);

      setDebugData(ocrData);

      if (onScanComplete) {
        onScanComplete({ ...ocrData, paymentInfo });
      }

      showToast('Factura analizada (lector local)', 'success');

    } catch (err) {
      console.error("Local OCR Error:", err);
      showToast('Error al analizar la imagen. Intenta de nuevo.', 'error');
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const processPdf = async (file, rot) => {
    setLoading(true);
    setLoadingMessage('Renderizando PDF');
    setLoadingProgress(0);

    try {
      const pdfjs = await loadPdfJS();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      if (pdf.numPages === 0) {
        throw new Error('El PDF no contiene páginas.');
      }
      
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0, rotation: (page.rotate + rot) % 360 });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;
      
      const imgSource = canvas.toDataURL('image/jpeg', 0.95);
      setPreviewSrc(imgSource);

      setLoadingMessage('Escaneando Factura');
      setLoadingProgress(15);

      // Default: local Tesseract OCR
      const result = await Tesseract.recognize(imgSource, 'spa', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setLoadingProgress(Math.round(m.progress * 15 + 15)); // Scale local Tesseract progress
          }
        }
      });

      const text = result.data.text;
      const ocrData = extractDetailedData(text);
      const paymentInfo = extractPaymentInfo(text);

      setDebugData(ocrData);

      if (onScanComplete) {
        onScanComplete({ ...ocrData, paymentInfo });
      }

      showToast('Factura PDF analizada (lector local)', 'success');

    } catch (err) {
      console.error("PDF Processing/Local OCR Error:", err);
      showToast('Error al procesar el archivo PDF.', 'error');
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  return (
    <div className="ocr-scan-container">
      {loading && (
        <div className="ocr-loading-overlay">
          <div className="ocr-loading-card">
            <Loader2 size={40} className="spin" style={{ color: 'var(--accent)' }} />
            <h3>{loadingMessage}</h3>
            <p>Procesando datos del recibo...</p>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${loadingProgress}%` }} />
            </div>
            <span className="progress-text">{loadingProgress}%</span>
          </div>
        </div>
      )}

      {wasAiProcessed && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '8px 12px', borderRadius: '12px', marginBottom: '8px', fontSize: '0.75rem', color: 'var(--green)', fontWeight: 700 }}>
          <span style={{ fontSize: '0.95rem' }}>✨</span>
          Optimizado con Escaneo Inteligente (Gemini AI)
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button
          type="button"
          className="ocr-btn"
          onClick={() => cameraInputRef.current?.click()}
          disabled={loading}
          style={{ fontSize: '0.82rem' }}
        >
          {loading ? <Loader2 className="ocr-spinner" size={18} /> : <Camera size={18} />}
          Tomar Foto
        </button>
        <button
          type="button"
          className="ocr-btn"
          onClick={() => galleryInputRef.current?.click()}
          disabled={loading}
          style={{ fontSize: '0.82rem', opacity: 0.85 }}
        >
          <FileText size={18} />
          Subir Recibo / PDF
        </button>
      </div>

      {/* Camera input (mobile: opens camera directly) */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Gallery/File input (allows images and PDFs) */}
      <input
        type="file"
        accept="image/*,application/pdf"
        ref={galleryInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {previewSrc && !loading && (
        <div className="glass-card ocr-preview-card">
          <div className="ocr-preview-header">
            <span className="ocr-preview-title">Vista Previa</span>
            <button type="button" className="icon-btn-sm" onClick={rotatePreview} title="Rotar imagen">
              <RotateCw size={16} />
            </button>
          </div>
          <img src={previewSrc} alt="Factura" className="ocr-preview-img" />

          {debugData && (
            <div className="ocr-debug-info">
              <p>Resultados del análisis (lector local):</p>
              <div className="ocr-debug-text">
                <div style={{ color: 'var(--accent)', marginBottom: '4px' }}><strong>Tienda:</strong> {debugData.merchant}</div>
                <div style={{ color: 'var(--green)', marginBottom: '4px' }}><strong>Fecha:</strong> {debugData.date}</div>
                <div style={{ marginBottom: '8px', borderTop: '1px solid var(--glass-border)', paddingTop: '8px' }}>
                  <strong>Productos ({debugData.items.length}):</strong>
                </div>
                {debugData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '2px' }}>
                    <span>• {item.desc}</span>
                    <span>${item.price.toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Premium "Upgrade to AI" button under the preview results */}
          {!wasAiProcessed && debugData && (
            <button
              type="button"
              className="btn-primary"
              disabled={loading || aiScansToday >= 10}
              onClick={handleUpgradeToGemini}
              style={{
                marginTop: '12px',
                width: '100%',
                background: aiScansToday >= 10 
                  ? 'var(--bg3)' 
                  : 'linear-gradient(135deg, #10b981, #059669)',
                borderColor: aiScansToday >= 10 ? 'var(--glass-border)' : '#059669',
                color: aiScansToday >= 10 ? 'var(--text3)' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 700,
                boxShadow: aiScansToday >= 10 ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}
            >
              <Sparkles size={16} />
              {aiScansToday >= 10 
                ? 'Límite de IA alcanzado hoy (10/10)' 
                : `¿Datos incorrectos? Escaneo Inteligente (Quedan ${10 - aiScansToday} hoy)`
              }
            </button>
          )}
          
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => setPreviewSrc(null)}
            style={{ marginTop: '12px', width: '100%', borderColor: 'var(--glass-border)' }}
          >
            Llenar formulario y cerrar
          </button>
        </div>
      )}
    </div>
  );
}
