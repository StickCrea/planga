import React from 'react';
import { BookOpen, Camera, Shield, Zap, TrendingUp, Wallet, CheckCircle2 } from 'lucide-react';

export default function HelpScreen() {
  const guides = [
    {
      icon: <Camera size={24} color="var(--green)" />,
      title: 'Escaner OCR Inteligente',
      desc: 'Pulsa el icono de cámara en "Nuevo Gasto". Finly analizará el total, comercio y artículos automáticamente. Priorizamos el "Valor Pagado" para mayor precisión.'
    },
    {
      icon: <Zap size={24} color="var(--yellow)" />,
      title: 'Sincronización 5ms',
      desc: 'Gracias a WebSockets, tus datos se sincronizan al instante entre todos tus dispositivos. No necesitas refrescar para ver cambios realizados en otro móvil.'
    },
    {
      icon: <Shield size={24} color="var(--accent)" />,
      title: 'Seguridad y Privacidad',
      desc: 'Tus datos están cifrados en Supabase. Por seguridad, cerraremos tu sesión automáticamente tras 30 minutos de inactividad.'
    },
    {
      icon: <TrendingUp size={24} color="var(--green)" />,
      title: 'Ciclos de Pago',
      desc: 'Configura tu día de pago en Ajustes. Finly agrupará tus gastos desde ese día hasta el siguiente mes, dándote una visión real de tu presupuesto.'
    },
    {
      icon: <Wallet size={24} color="var(--accent)" />,
      title: 'Gestión de Cartera',
      desc: 'En la sección "Cartera", puedes trackear tus ahorros, inversiones y deudas. Las barras de progreso te indican qué tan cerca estás de liquidar una deuda.'
    }
  ];

  return (
    <div className="help-screen" style={{ padding: '0 4px 40px' }}>
      <div className="glass-card" style={{ padding: '24px', marginBottom: '20px', background: 'var(--accent-glow)' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text)' }}>
          Bienvenido a Finly <span className="logo-dot">.</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.5 }}>
          Estás usando una herramienta financiera de alta ingeniería. Aquí tienes una guía rápida para dominar todas sus funciones.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {guides.map((g, i) => (
          <div key={i} className="glass-card" style={{ padding: '20px', display: 'flex', gap: '16px' }}>
            <div style={{ flexShrink: 0, paddingTop: '4px' }}>{g.icon}</div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>{g.title}</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text3)', lineHeight: 1.5 }}>{g.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '24px', marginTop: '20px', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
        <CheckCircle2 size={32} color="var(--green)" style={{ marginBottom: '12px', opacity: 0.8 }} />
        <p style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
          Finly v3.1 Cloud Intelligence<br />
          Todo listo para tu libertad financiera.
        </p>
      </div>
    </div>
  );
}
