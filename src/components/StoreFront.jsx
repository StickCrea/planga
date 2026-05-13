import React, { useState, useEffect } from 'react';
import { ShoppingCart, Store, ArrowLeft, Plus, Minus, Trash2, CheckCircle, Search, ShieldCheck } from 'lucide-react';
import StoreAdmin from './StoreAdmin';

export default function StoreFront({ onExit }) {
  const [view, setView] = useState('catalog'); // 'catalog', 'cart', 'checkout', 'admin'
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [checkoutData, setCheckoutData] = useState({ name: '', email: '', ciudad: '', tel: '' });

  useEffect(() => {
    // Load products from the simulated DB
    const saved = localStorage.getItem('store_products');
    if (saved) {
      setProducts(JSON.parse(saved));
    } else {
      const defaultProducts = [
        { id: 1, name: 'MacBook Pro 14"', cat: 'Electrónica', price: 2500, stock: 15 },
        { id: 2, name: 'iPhone 15 Pro', cat: 'Electrónica', price: 1200, stock: 42 },
        { id: 3, name: 'Silla Gamer RGB', cat: 'Muebles', price: 350, stock: 8 },
        { id: 4, name: 'Escritorio Standing', cat: 'Muebles', price: 580, stock: 12 },
      ];
      setProducts(defaultProducts);
      localStorage.setItem('store_products', JSON.stringify(defaultProducts));
    }
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const totalCart = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);

  const handleCheckout = (e) => {
    e.preventDefault();
    
    // 1. Create/Update Client
    let clients = JSON.parse(localStorage.getItem('store_clients') || '[]');
    let client = clients.find(c => c.email === checkoutData.email);
    if (!client) {
      client = { id: Date.now(), ...checkoutData };
      clients.push(client);
      localStorage.setItem('store_clients', JSON.stringify(clients));
    }

    // 2. Create Orders
    let orders = JSON.parse(localStorage.getItem('store_orders') || '[]');
    cart.forEach(item => {
      orders.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        cliente_id: client.id,
        empleado_id: 1, // Venta online asignada a un empleado por defecto
        producto_id: item.product.id,
        cantidad: item.qty,
        total: item.product.price * item.qty,
        fecha: new Date().toISOString().split('T')[0]
      });
    });
    localStorage.setItem('store_orders', JSON.stringify(orders));

    // Clear cart and show success
    setCart([]);
    setView('success');
  };

  if (view === 'admin') {
    return (
      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => setView('catalog')}
          className="btn-secondary"
          style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100 }}
        >
          <ArrowLeft size={16} /> Volver a Tienda
        </button>
        <StoreAdmin />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: '100px' }}>
      
      {/* Navbar */}
      <nav className="glass-card" style={{ borderRadius: 0, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={onExit} className="icon-btn-sm"><ArrowLeft size={18} /></button>
          <Store size={24} color="var(--accent)" />
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>TechStore</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setView('admin')} className="icon-btn-sm" title="Admin Panel">
            <ShieldCheck size={18} color="var(--accent)" />
          </button>
          <button onClick={() => setView('cart')} className="btn-secondary" style={{ position: 'relative' }}>
            <ShoppingCart size={18} />
            {cart.length > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--red)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {cart.reduce((a, b) => a + b.qty, 0)}
              </span>
            )}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        
        {view === 'catalog' && (
          <>
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>Catálogo de Productos</h2>
              <p style={{ color: 'var(--text2)' }}>Descubre nuestra selección premium.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
              {products.map(p => (
                <div key={p.id} className="glass-card main-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', height: '150px', borderRadius: '12px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Store size={40} color="var(--text3)" />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{p.cat}</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '5px 0' }}>{p.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '15px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>${p.price}</span>
                    <button 
                      onClick={() => addToCart(p)}
                      className="btn-primary" 
                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                      disabled={p.stock <= 0}
                    >
                      {p.stock > 0 ? 'Agregar' : 'Agotado'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {view === 'cart' && (
          <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Tu Carrito</h2>
              <button onClick={() => setView('catalog')} className="btn-secondary" style={{ fontSize: '0.8rem' }}>Seguir Comprando</button>
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <ShoppingCart size={48} style={{ margin: '0 auto 15px', opacity: 0.5 }} />
                <p>Tu carrito está vacío.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                  {cart.map(item => (
                    <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 800 }}>{item.product.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>${item.product.price} c/u</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => updateQty(item.product.id, -1)} className="icon-btn-sm"><Minus size={14} /></button>
                        <span style={{ fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, 1)} className="icon-btn-sm"><Plus size={14} /></button>
                        <div style={{ fontWeight: 900, minWidth: '60px', textAlign: 'right', color: 'var(--accent)' }}>
                          ${item.product.price * item.qty}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>Total a Pagar</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent)' }}>${totalCart}</span>
                </div>
                
                <button onClick={() => setView('checkout')} className="btn-primary" style={{ width: '100%', marginTop: '20px', padding: '15px' }}>
                  Proceder al Pago
                </button>
              </>
            )}
          </div>
        )}

        {view === 'checkout' && (
          <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '30px' }}>
            <button onClick={() => setView('cart')} className="icon-btn-sm" style={{ marginBottom: '20px' }}><ArrowLeft size={16} /> Volver</button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '20px' }}>Finalizar Compra</h2>
            
            <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input type="text" className="input" required value={checkoutData.name} onChange={e => setCheckoutData({...checkoutData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input type="email" className="input" required value={checkoutData.email} onChange={e => setCheckoutData({...checkoutData, email: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Ciudad</label>
                  <input type="text" className="input" required value={checkoutData.ciudad} onChange={e => setCheckoutData({...checkoutData, ciudad: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="tel" className="input" required value={checkoutData.tel} onChange={e => setCheckoutData({...checkoutData, tel: e.target.value})} />
                </div>
              </div>
              
              <div style={{ padding: '15px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)', marginTop: '10px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text2)', textAlign: 'center' }}>
                  Al confirmar, se generará una inserción (INSERT) en la tabla <strong style={{color:'var(--text)'}}>Clientes</strong> y <strong style={{color:'var(--text)'}}>Pedidos</strong> en la Base de Datos.
                </p>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px', padding: '15px' }}>
                Confirmar Orden (${totalCart})
              </button>
            </form>
          </div>
        )}

        {view === 'success' && (
          <div className="glass-card" style={{ maxWidth: '500px', margin: '40px auto', padding: '40px 30px', textAlign: 'center' }}>
            <CheckCircle size={64} color="var(--accent)" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '10px' }}>¡Compra Exitosa!</h2>
            <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>
              La orden ha sido registrada en la base de datos relacional con éxito.
            </p>
            <button onClick={() => setView('catalog')} className="btn-secondary" style={{ width: '100%' }}>
              Volver al Catálogo
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
