import React, { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, RotateCw, Loader2 } from 'lucide-react';
import { prepareImage, extractDetailedData, extractPaymentInfo } from '../utils/ocrUtils';

export default function OCRScanner({ onScanComplete }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const [debugData, setDebugData] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
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
    setIsScanning(true);
    setStatus('Procesando imagen...');
    
    try {
      const imgSource = await prepareImage(file, rot);
      setPreviewSrc(imgSource);
      
      setStatus('Leyendo texto (OCR)...');
      const result = await Tesseract.recognize(imgSource, 'spa', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setStatus(`Analizando: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      setStatus('Analizando detalles...');
      const text = result.data.text;
      const ocrData = extractDetailedData(text);
      const paymentInfo = extractPaymentInfo(text);
      
      setDebugData(ocrData);
      
      if (onScanComplete) {
        onScanComplete({ ...ocrData, paymentInfo });
      }
      
    } catch (err) {
      console.error("OCR Error:", err);
      alert('Error al procesar la imagen');
    } finally {
      setIsScanning(false);
      setStatus('');
    }
  };

  return (
    <div className="ocr-scan-container">
      <button type="button" className="ocr-btn" onClick={() => fileInputRef.current?.click()} disabled={isScanning}>
        {isScanning ? <Loader2 className="ocr-spinner" size={20} /> : <Camera size={20} />}
        Escanear factura
      </button>
      
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
      />

      {isScanning && (
        <div className="ocr-status">
          <Loader2 className="ocr-spinner" size={16} />
          <span>{status}</span>
        </div>
      )}

      {previewSrc && !isScanning && (
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
        </div>
      )}
    </div>
  );
}
