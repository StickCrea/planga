import React, { useState } from 'react';
import { Package, Users, ShoppingCart, Search, Plus, Database, Code, Play } from 'lucide-react';

export default function StoreAdmin() {
  const [activeTab, setActiveTab] = useState('products');
  
  // Mock Data for the Video Demonstration
  const products = [
    { id: 1, name: 'MacBook Pro', cat: 'Electrónica', price: 2500, stock: 15 },
    { id: 2, name: 'iPhone 15', cat: 'Electrónica', price: 1200, stock: 42 },
    { id: 3, name: 'Silla Gamer', cat: 'Muebles', price: 350, stock: 8 },
  ];

  const clients = [
    { id: 1, name: 'Juan Pérez', email: 'juan@test.com', tel: '3001234567' },
    { id: 2, name: 'María López', email: 'maria@test.com', tel: '3109876543' },
  ];

  const orders = [
    { id: 'ORD-001', client: 'Juan Pérez', total: 3700, date: '2026-05-10', status: 'Entregado' },
    { id: 'ORD-002', client: 'María López', total: 1200, date: '2026-05-11', status: 'Pendiente' },
  ];

  return (
    <div className="store-admin" style={{ paddingBottom: '40px' }}>
      {/* Header Project Info */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', borderLeft: '4px solid var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Database size={24} color="var(--accent)" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Gestión de Tienda Virtual</h2>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
          Proyecto Académico: Implementación de Base de Datos Relacional (SQL, DDL, DML).
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        <TabBtn active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package size={16} />} label="Productos" />
        <TabBtn active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={<Users size={16} />} label="Clientes" />
        <TabBtn active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<ShoppingCart size={16} />} label="Pedidos" />
        <TabBtn active={activeTab === 'queries'} onClick={() => setActiveTab('queries')} icon={<Code size={16} />} label="SQL Avanzado" />
      </div>

      {/* Content Area */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {activeTab === 'products' && (
          <Table 
            headers={['ID', 'Nombre', 'Precio', 'Stock']} 
            data={products.map(p => [p.id, p.name, `$${p.price}`, p.stock])}
            onAdd={() => alert('DML: INSERT INTO productos...')}
          />
        )}
        {activeTab === 'clients' && (
          <Table 
            headers={['ID', 'Nombre', 'Correo', 'Teléfono']} 
            data={clients.map(c => [c.id, c.name, c.email, c.tel])}
          />
        )}
        {activeTab === 'orders' && (
          <Table 
            headers={['ID', 'Cliente', 'Total', 'Estado']} 
            data={orders.map(o => [o.id, o.client, `$${o.total}`, o.status])}
          />
        )}
        {activeTab === 'queries' && <SQLConsole />}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
        borderRadius: '12px', border: '1px solid var(--glass-border)',
        background: active ? 'var(--accent-glow)' : 'var(--bg2)',
        color: active ? 'var(--accent)' : 'var(--text3)',
        fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
        whiteSpace: 'nowrap'
      }}
    >
      {icon} {label}
    </button>
  );
}

function Table({ headers, data, onAdd }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text2)' }}>Registros en Base de Datos</span>
        <button style={{ background: 'var(--accent)', border: 'none', borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={14} /> Agregar (DML)
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
            {headers.map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600 }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
              {row.map((cell, j) => <td key={j} style={{ padding: '12px 16px', color: 'var(--text2)' }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SQLConsole() {
  const query = `SELECT c.nombre, p.total, e.nombre as vendedor 
FROM pedidos p
JOIN clientes c ON p.id_cliente = c.id
JOIN empleados e ON p.id_empleado = e.id
WHERE p.total > 1000;`;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ background: '#000', borderRadius: '12px', padding: '16px', fontFamily: 'monospace', position: 'relative' }}>
        <div style={{ color: '#00E676', marginBottom: '8px' }}>-- Consulta Compleja (JOIN)</div>
        <div style={{ color: '#fff', lineHeight: 1.5 }}>{query}</div>
        <button style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'var(--accent)', border: 'none', borderRadius: '6px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
          <Play size={12} /> EJECUTAR
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '10px' }}>Resultado de la consulta</p>
        <div className="glass-card" style={{ padding: '12px', fontSize: '0.8rem', background: 'rgba(0,230,118,0.05)' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--accent)' }}>
                <th>Cliente</th><th>Total</th><th>Vendedor</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Juan Pérez</td><td>$3700</td><td>Carlos Admin</td></tr>
              <tr><td>María López</td><td>$1200</td><td>Ana Ventas</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
