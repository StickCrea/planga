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
    console.log('Finly: Connected to Supabase Cloud.');
  } catch (e) {
    console.error('Finly: Failed to initialize Supabase client, falling back to Local Mode.', e);
  }
}

// True cuando NO hay un cliente real de Supabase (corremos sobre el mock local,
// "modo demo"). Sirve para ocultar herramientas de solo-demo en producción.
export const isDemoMode = !supabaseClient;

if (!supabaseClient) {
  console.warn('Finly: Supabase credentials are not configured. Running in Local Demo Mode with LocalStorage fallback.');
  
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
    email: 'demo@finly.com',
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

  // ─── Mock user registry (email/password) ───
  // Local mode has no real backend, so "does this account exist" / "is this
  // the right password" is simulated against a small localStorage registry
  // instead of always succeeding. The pre-seeded demo account is registered
  // here too, so signing out and back in with it still works.
  const USERS_KEY = 'mock_users';
  const getUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
      return [];
    }
  };
  const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
  if (getUsers().length === 0) {
    saveUsers([{ email: 'demo@finly.com', password: 'finly123', nombre: 'Stiven' }]);
  }
  const findUser = (email) => getUsers().find(u => u.email.toLowerCase() === String(email || '').toLowerCase());

  // One-time recovery code for the forgot-password flow (mirrors Supabase's
  // email-OTP recovery: request a code, then verifyOtp() with it).
  let recoveryCode = null;
  let recoveryEmail = null;

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
    signInWithPassword: ({ email, password }) => {
      const account = findUser(email);
      if (!account) {
        return Promise.resolve({ data: { user: null, session: null }, error: { message: 'No existe una cuenta con este correo.' } });
      }
      if (account.password !== password) {
        return Promise.resolve({ data: { user: null, session: null }, error: { message: 'Contraseña incorrecta.' } });
      }
      localStorage.setItem('mock_logged_in', 'true');
      mockUser.email = account.email;
      mockUser.user_metadata.nombre = account.nombre || mockUser.user_metadata.nombre;
      if (authCallback) authCallback('SIGNED_IN', mockSession);
      return Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null });
    },
    signUp: ({ email, password, options }) => {
      if (findUser(email)) {
        return Promise.resolve({ data: { user: null, session: null }, error: { message: 'Ya existe una cuenta registrada con este correo.' } });
      }
      const nombre = options?.data?.nombre || '';
      const users = getUsers();
      users.push({ email, password, nombre });
      saveUsers(users);

      localStorage.setItem('mock_logged_in', 'true');
      mockUser.email = email;
      if (nombre) mockUser.user_metadata.nombre = nombre;
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
    updateUser: ({ data, password }) => {
      if (data) {
        mockUser.user_metadata = { ...mockUser.user_metadata, ...data };
      }
      if (password) {
        // Keep the registry's stored password in sync so a fresh login after
        // a reset uses the new one instead of the original.
        const users = getUsers();
        const idx = users.findIndex(u => u.email.toLowerCase() === mockUser.email.toLowerCase());
        if (idx !== -1) {
          users[idx].password = password;
          saveUsers(users);
        }
      }
      return Promise.resolve({ data: { user: mockUser }, error: null });
    },
    resetPasswordForEmail: (email) => {
      if (!findUser(email)) {
        // Real Supabase never reveals whether an email exists (avoids account
        // enumeration), so this still resolves successfully with no code sent.
        return Promise.resolve({ data: {}, error: null });
      }
      recoveryCode = String(Math.floor(100000 + Math.random() * 900000));
      recoveryEmail = email;
      return Promise.resolve({ data: {}, error: null, __localDevCode: recoveryCode });
    },
    verifyOtp: ({ email, token, type }) => {
      if (type !== 'recovery') {
        return Promise.resolve({ data: null, error: { message: 'Tipo de verificación no soportado.' } });
      }
      if (!recoveryCode || email !== recoveryEmail || token !== recoveryCode) {
        return Promise.resolve({ data: null, error: { message: 'Código incorrecto o expirado.' } });
      }
      recoveryCode = null;
      recoveryEmail = null;
      // The recovery code doubles as proof of email ownership and grants a
      // session, same as clicking a real recovery link would.
      mockUser.email = email;
      if (authCallback) authCallback('PASSWORD_RECOVERY', mockSession);
      return Promise.resolve({ data: { session: mockSession, user: mockUser }, error: null });
    }
  };

  // Chainable mock query builder. Real supabase-js keeps `.insert()/.update()/.delete()`
  // chainable (so `.insert(x).select().single()` and `.update(x).eq(id)` work) and only
  // performs the write once the chain is actually awaited. This mirrors that: filters
  // (`eq`/`lte`/`gte`) narrow `data` first, the write itself is deferred into `runOp()`,
  // and `update`/`delete` act on that narrowed `data` re-read against a fresh table copy
  // so a filtered chain never touches unrelated rows.
  const makeMockQueryBuilder = (table) => {
    let data = getMockData(table);
    let pendingOp = null;
    let countMode = false;
    let executed = false;
    let cachedResult = null;

    const runOp = () => {
      if (executed) return cachedResult;
      executed = true;

      if (!pendingOp) {
        cachedResult = countMode
          ? { count: data.length, data: [], error: null }
          : { data, error: null };
        return cachedResult;
      }

      const currentData = getMockData(table);

      if (pendingOp.type === 'insert') {
        const isArray = Array.isArray(pendingOp.payload);
        const rows = isArray ? pendingOp.payload : [pendingOp.payload];
        const newRows = rows.map(row => ({
          id: row.id || `${table.substring(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          created_at: new Date().toISOString(),
          ...row
        }));
        setMockData(table, [...newRows, ...currentData]);
        cachedResult = { data: isArray ? newRows : newRows[0], error: null };
        return cachedResult;
      }

      if (pendingOp.type === 'update') {
        const targetIds = new Set(data.map(item => String(item.id)));
        const updatedData = currentData.map(item =>
          targetIds.has(String(item.id)) ? { ...item, ...pendingOp.payload } : item
        );
        setMockData(table, updatedData);
        cachedResult = { data: updatedData.filter(item => targetIds.has(String(item.id))), error: null };
        return cachedResult;
      }

      if (pendingOp.type === 'delete') {
        const targetIds = new Set(data.map(item => String(item.id)));
        setMockData(table, currentData.filter(item => !targetIds.has(String(item.id))));
        cachedResult = { data: null, error: null };
        return cachedResult;
      }

      if (pendingOp.type === 'upsert') {
        const rows = Array.isArray(pendingOp.payload) ? pendingOp.payload : [pendingOp.payload];
        const conflictCols = pendingOp.opts && pendingOp.opts.onConflict
          ? pendingOp.opts.onConflict.split(',').map(s => s.trim())
          : ['id'];
        const updatedData = [...currentData];
        rows.forEach(row => {
          const idx = updatedData.findIndex(item =>
            conflictCols.every(col => item[col] !== undefined && row[col] !== undefined && String(item[col]) === String(row[col]))
          );
          if (idx !== -1) {
            updatedData[idx] = { ...updatedData[idx], ...row };
          } else {
            updatedData.push({ id: row.id || `up-${Date.now()}`, ...row });
          }
        });
        setMockData(table, updatedData);
        cachedResult = { data: pendingOp.payload, error: null };
        return cachedResult;
      }

      cachedResult = { data: null, error: null };
      return cachedResult;
    };

    const builder = {
      select: (columns, options) => {
        if (options && options.count === 'exact') {
          countMode = true;
          return builder;
        }
        // Resolve a `*, related_table(*)` embed by convention: table `gastos` embeds
        // `gasto_items` matched on `gasto_items.gasto_id === gastos.id`.
        const embedMatch = typeof columns === 'string' && columns.match(/,\s*([a-z_]+)\s*\(\*\)/i);
        if (embedMatch) {
          const relatedTable = embedMatch[1];
          const fk = `${table.endsWith('s') ? table.slice(0, -1) : table}_id`;
          const relatedData = getMockData(relatedTable);
          data = data.map(row => ({
            ...row,
            [relatedTable]: relatedData.filter(r => String(r[fk]) === String(row.id))
          }));
        }
        return builder;
      },
      eq: (column, value) => {
        data = data.filter(item => {
          if (column === 'user_id') return true; // single-tenant mock: nothing else to scope by
          return String(item[column]) === String(value);
        });
        return builder;
      },
      lte: (column, value) => {
        data = data.filter(item => (item[column] !== undefined ? item[column] <= value : true));
        return builder;
      },
      gte: (column, value) => {
        data = data.filter(item => (item[column] !== undefined ? item[column] >= value : true));
        return builder;
      },
      order: (column, options) => {
        const ascending = !options || options.ascending !== false;
        data = [...data].sort((a, b) => {
          if (a[column] === b[column]) return 0;
          if (a[column] === undefined) return 1;
          if (b[column] === undefined) return -1;
          if (ascending) return a[column] > b[column] ? 1 : -1;
          return a[column] < b[column] ? 1 : -1;
        });
        return builder;
      },
      limit: (value) => {
        data = data.slice(0, value);
        return builder;
      },
      insert: (payload) => {
        pendingOp = { type: 'insert', payload };
        return builder;
      },
      update: (payload) => {
        pendingOp = { type: 'update', payload };
        return builder;
      },
      upsert: (payload, opts) => {
        pendingOp = { type: 'upsert', payload, opts };
        return builder;
      },
      delete: () => {
        pendingOp = { type: 'delete' };
        return builder;
      },
      single: () => {
        const result = runOp();
        const rows = Array.isArray(result.data) ? result.data : (result.data ? [result.data] : []);
        const item = rows[0] || null;
        const error = result.error || (item ? null : { code: 'PGRST116', message: 'Not found' });
        return Promise.resolve({ data: item, error });
      },
      then: (onfulfilled, onrejected) => {
        return Promise.resolve(runOp()).then(onfulfilled, onrejected);
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
