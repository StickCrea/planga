import React, { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Image, RotateCw, Loader2 } from 'lucide-react';
import { prepareImage, extractDetailedData, extractPaymentInfo } from '../utils/ocrUtils';
import { useFinance } from '../context/FinanceContext';

export default function OCRScanner({ onScanComplete }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const { showToast } = useFinance();
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const [debugData, setDebugData] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setCurrentFile(file);
    setRotation(0);
    processImage(file, 0);
  };

  const rotatePreview = () => {
    if (!currentFile) return;
    const newRot = (rotation + 90) % 360;
    setRotation(newRot);
    processImage(currentFile, newRot);
  };

  const processImage = async (file, rot) => {
    setLoading(true);
    setLoadingProgress(0);

    try {
      const imgSource = await prepareImage(file, rot);
      setPreviewSrc(imgSource);

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

      showToast('Recibo analizado correctamente', 'success');

    } catch (err) {
      console.error("OCR Error:", err);
      showToast('Error al procesar la imagen. Intenta de nuevo.', 'error');
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
            <h3>Escaneando Recibo</h3>
            <p>Analizando datos con IA...</p>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${loadingProgress}%` }} />
            </div>
            <span className="progress-text">{loadingProgress}%</span>
          </div>
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
          <Image size={18} />
          Galería
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

      {/* Gallery input (no capture attr = allows gallery selection) */}
      <input
        type="file"
        accept="image/*"
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
              <p>Resultados del análisis:</p>
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
