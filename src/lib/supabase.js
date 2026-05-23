import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid and defined
const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined' &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '';

let supabaseClient;

if (isConfigured) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Planga: Connected to Supabase Cloud.');
  } catch (e) {
    console.error('Planga: Failed to initialize Supabase client, falling back to Local Mode.', e);
  }
}

if (!supabaseClient) {
  console.warn('Planga: Supabase credentials are not configured. Running in Local Demo Mode with LocalStorage fallback.');
  
  // --- LocalStorage Mock Database ---
  const getMockData = (table) => {
    const data = localStorage.getItem(`mock_db_${table}`);
    if (data) return JSON.parse(data);
    
    // Premium Sample Data to wow the user on first launch
    if (table === 'profiles') {
      return [{ id: 'demo-user', nombre: 'Stiven Cuesta', ciclo_dia: 25, telefono: '3001234567' }];
    }
    if (table === 'ciclos') {
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 25);
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 25);
      return [{
        id: 'c-1',
        user_id: 'demo-user',
        nombre: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
        fecha_inicio: prevMonth.toISOString().slice(0, 10),
        fecha_fin: nextMonth.toISOString().slice(0, 10),
        ingreso: 3500000,
        gastos_fijos: 1200000,
        created_at: new Date().toISOString()
      }];
    }
    if (table === 'gastos') {
      return [
        {
          id: 'g-1',
          user_id: 'demo-user',
          ciclo_id: 'c-1',
          comercio: 'D1',
          total: 58880,
          categoria: 'mercado',
          medio_pago: 'Efectivo',
          entidad_banco: null,
          fecha_gasto: new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString()
        },
        {
          id: 'g-2',
          user_id: 'demo-user',
          ciclo_id: 'c-1',
          comercio: 'Netflix',
          total: 44900,
          categoria: 'suscripciones',
          medio_pago: 'Tarjeta',
          entidad_banco: 'Nu',
          fecha_gasto: new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString()
        },
        {
          id: 'g-3',
          user_id: 'demo-user',
          ciclo_id: 'c-1',
          comercio: 'McDonalds',
          total: 32000,
          categoria: 'comida',
          medio_pago: 'Tarjeta',
          entidad_banco: 'Bancolombia',
          fecha_gasto: new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString()
        }
      ];
    }
    if (table === 'gasto_items') {
      return [
        { id: 'gi-1', gasto_id: 'g-1', nombre: 'EMPANADA', precio: 2300, cantidad: 1 },
        { id: 'gi-2', gasto_id: 'g-1', nombre: 'LECHE', precio: 3300, cantidad: 2 },
        { id: 'gi-3', gasto_id: 'g-1', nombre: 'QUESO SABANA', precio: 8900, cantidad: 1 },
        { id: 'gi-4', gasto_id: 'g-1', nombre: 'HOJUELAS', precio: 5750, cantidad: 1 },
        { id: 'gi-5', gasto_id: 'g-1', nombre: 'FILETES DE POLLO', precio: 16900, cantidad: 1 }
      ];
    }
    if (table === 'presupuestos') {
      return [
        { user_id: 'demo-user', categoria: 'mercado', monto: 600000 },
        { user_id: 'demo-user', categoria: 'comida', monto: 400000 },
        { user_id: 'demo-user', categoria: 'transporte', monto: 250000 },
        { user_id: 'demo-user', categoria: 'suscripciones', monto: 100000 },
        { user_id: 'demo-user', categoria: 'ocio', monto: 200000 }
      ];
    }
    if (table === 'compromisos') {
      return [
        { id: 'com-1', user_id: 'demo-user', nombre: 'Arriendo', monto: 1000000, dia_pago: 5 },
        { id: 'com-2', user_id: 'demo-user', nombre: 'Plan celular', monto: 45000, dia_pago: 10 }
      ];
    }
    if (table === 'ingresos_extra') {
      return [
        { id: 'inc-1', user_id: 'demo-user', nombre: 'Trabajo Freelance', monto: 800000, fecha: new Date().toISOString().slice(0, 10) }
      ];
    }
    if (table === 'activos') {
      return [
        { id: 'act-1', user_id: 'demo-user', nombre: 'Cuenta de Ahorros', valor: 2500000, tipo: 'ahorro' },
        { id: 'act-2', user_id: 'demo-user', nombre: 'Inversión en CDT', valor: 1500000, tipo: 'inversion' }
      ];
    }
    if (table === 'deudas') {
      return [
        { id: 'deb-1', user_id: 'demo-user', nombre: 'Tarjeta de Crédito', monto_total: 1200000, monto_pagado: 350000 }
      ];
    }
    
    return [];
  };

  const setMockData = (table, data) => {
    localStorage.setItem(`mock_db_${table}`, JSON.stringify(data));
  };

  const mockUser = {
    id: 'demo-user',
    email: 'demo@planga.com',
    user_metadata: { nombre: 'Stiven' }
  };

  const mockSession = {
    user: mockUser,
    access_token: 'mock-token',
    expires_in: 3600
  };

  let authCallback = null;

  // Initialize mock login state to true so the app is instantly usable
  if (localStorage.getItem('mock_logged_in') === null) {
    localStorage.setItem('mock_logged_in', 'true');
  }

  const mockAuth = {
    getSession: () => {
      const isLoggedIn = localStorage.getItem('mock_logged_in') === 'true';
      const session = isLoggedIn ? mockSession : null;
      return Promise.resolve({ data: { session }, error: null });
    },
    onAuthStateChange: (callback) => {
      authCallback = callback;
      const isLoggedIn = localStorage.getItem('mock_logged_in') === 'true';
      const session = isLoggedIn ? mockSession : null;
      // Async emission to simulate natural Auth lifecycles
      setTimeout(() => {
        callback(isLoggedIn ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      }, 50);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: ({ email }) => {
      localStorage.setItem('mock_logged_in', 'true');
      mockUser.email = email;
      if (authCallback) authCallback('SIGNED_IN', mockSession);
      return Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null });
    },
    signUp: ({ email, options }) => {
      localStorage.setItem('mock_logged_in', 'true');
      mockUser.email = email;
      if (options && options.data && options.data.nombre) {
        mockUser.user_metadata.nombre = options.data.nombre;
      }
      if (authCallback) authCallback('SIGNED_IN', mockSession);
      return Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null });
    },
    signInWithOAuth: () => {
      localStorage.setItem('mock_logged_in', 'true');
      if (authCallback) authCallback('SIGNED_IN', mockSession);
      return Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null });
    },
    signOut: () => {
      localStorage.setItem('mock_logged_in', 'false');
      if (authCallback) authCallback('SIGNED_OUT', null);
      return Promise.resolve({ error: null });
    },
    updateUser: ({ data }) => {
      if (data) {
        mockUser.user_metadata = { ...mockUser.user_metadata, ...data };
      }
      return Promise.resolve({ data: { user: mockUser }, error: null });
    }
  };

  const makeMockQueryBuilder = (table) => {
    let data = getMockData(table);
    
    const builder = {
      select: (columns, options) => {
        if (columns === 'id' && options && options.count === 'exact') {
          const count = data.length;
          const promise = Promise.resolve({ count, data: [], error: null });
          promise.then = (onfulfilled) => Promise.resolve({ count, data: [], error: null }).then(onfulfilled);
          return promise;
        }
        return builder;
      },
      eq: (column, value) => {
        data = data.filter(item => {
          if (column === 'user_id') return true; 
          if (column === 'id' || column === 'gasto_id') {
            return String(item[column]) === String(value);
          }
          return true;
        });
        return builder;
      },
      lte: (column, value) => {
        data = data.filter(item => {
          if (item[column]) return item[column] <= value;
          return true;
        });
        return builder;
      },
      gte: (column, value) => {
        data = data.filter(item => {
          if (item[column]) return item[column] >= value;
          return true;
        });
        return builder;
      },
      single: () => {
        const item = data[0] || null;
        const error = item ? null : { code: 'PGRST116', message: 'Not found' };
        const promise = Promise.resolve({ data: item, error });
        promise.then = (onfulfilled) => Promise.resolve({ data: item, error }).then(onfulfilled);
        return promise;
      },
      order: () => {
        return builder;
      },
      limit: (value) => {
        data = data.slice(0, value);
        return builder;
      },
      insert: (payload) => {
        const isArray = Array.isArray(payload);
        const rows = isArray ? payload : [payload];
        
        const newRows = rows.map(row => {
          const newRow = { 
            id: row.id || `${table.substring(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            created_at: new Date().toISOString(),
            ...row 
          };
          return newRow;
        });
        
        const currentData = getMockData(table);
        setMockData(table, [...newRows, ...currentData]);
        
        const resultData = isArray ? newRows : newRows[0];
        const promise = Promise.resolve({ data: resultData, error: null });
        promise.then = (onfulfilled) => Promise.resolve({ data: resultData, error: null }).then(onfulfilled);
        return promise;
      },
      update: (payload) => {
        const currentData = getMockData(table);
        const updatedData = currentData.map(item => {
          const isMatch = data.some(d => String(d.id) === String(item.id));
          if (isMatch) {
            return { ...item, ...payload };
          }
          return item;
        });
        setMockData(table, updatedData);
        
        const promise = Promise.resolve({ data: payload, error: null });
        promise.then = (onfulfilled) => Promise.resolve({ data: payload, error: null }).then(onfulfilled);
        return promise;
      },
      upsert: (payload) => {
        const currentData = getMockData(table);
        const rows = Array.isArray(payload) ? payload : [payload];
        
        let updatedData = [...currentData];
        rows.forEach(row => {
          const idx = updatedData.findIndex(item => item.categoria === row.categoria);
          if (idx !== -1) {
            updatedData[idx] = { ...updatedData[idx], ...row };
          } else {
            updatedData.push({ id: `up-${Date.now()}`, ...row });
          }
        });
        setMockData(table, updatedData);
        
        const promise = Promise.resolve({ data: payload, error: null });
        promise.then = (onfulfilled) => Promise.resolve({ data: payload, error: null }).then(onfulfilled);
        return promise;
      },
      delete: () => {
        const currentData = getMockData(table);
        const updatedData = currentData.filter(item => {
          return !data.some(d => String(d.id) === String(item.id));
        });
        setMockData(table, updatedData);
        
        const promise = Promise.resolve({ data: null, error: null });
        promise.then = (onfulfilled) => Promise.resolve({ data: null, error: null }).then(onfulfilled);
        return promise;
      },
      then: (onfulfilled) => {
        return Promise.resolve({ data, error: null }).then(onfulfilled);
      }
    };
    
    return builder;
  };

  const mockChannel = {
    on: () => mockChannel,
    subscribe: () => mockChannel
  };

  supabaseClient = {
    auth: mockAuth,
    from: makeMockQueryBuilder,
    channel: () => mockChannel,
    removeChannel: () => {}
  };
}

export const supabase = supabaseClient;
