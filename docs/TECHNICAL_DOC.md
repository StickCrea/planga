# Documentación Técnica: Finly

Arquitectura, modelo de datos y decisiones de diseño de Finly. El contexto de producto está en [`../PRODUCT.md`](../PRODUCT.md) y el sistema visual en [`../DESIGN.md`](../DESIGN.md).

## 1. Arquitectura del sistema

Finly es una SPA construida sobre **React 19 (Vite)** + **Supabase**.

- **FinanceContext** (`src/context/FinanceContext.jsx`): el estado global de la app. Maneja sesión, carga y persistencia de datos, caché local por usuario, listeners en tiempo real y el cierre de sesión por inactividad.
- **Supabase Realtime**: se suscribe a `postgres_changes` en las tablas `gastos`, `presupuestos` e `ingresos_extra` (canales por usuario) para reflejar cambios entre dispositivos sin recargar.
- **Inactivity Guard**: rastrea eventos del usuario (`mousemove`, `keypress`, `scroll`, etc.) y cierra la sesión automáticamente tras 30 minutos de inactividad.

### Modo demo local

Si no hay credenciales de Supabase (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`), `src/lib/supabase.js` levanta un **backend simulado en `localStorage`** con datos de ejemplo, una cuenta demo (`demo@finly.com` / `finly123`) y un query builder que imita a `supabase-js` (incluye recuperación de contraseña por código OTP). Permite ejecutar toda la app —registro, sesión, captura, patrimonio— sin infraestructura.

## 2. Modelo de datos (Supabase)

Tablas principales (todas deben tener **RLS** atada a `auth.uid()` en producción):

- **`profiles`**: `id` (UUID, = `auth.users`), `nombre`, `ciclo_dia` (día de cobro), `moneda`, `frecuencia`, `telefono`.
- **`ciclos`**: `id`, `user_id`, `nombre` (`YYYY-MM`), `fecha_inicio`, `fecha_fin`, `ingreso`, `gastos_fijos`.
- **`gastos`**: `id`, `user_id`, `ciclo_id`, `comercio`, `total`, `categoria`, `medio_pago` (`efectivo`/`tarjeta`), `entidad_banco`, `fecha_gasto`.
- **`gasto_items`**: `id`, `gasto_id`, `nombre`, `precio`, `cantidad` (detalle de productos de una factura).

Tablas de apoyo: **`presupuestos`** (límite por categoría), **`compromisos`** (gastos fijos), **`ingresos_extra`**, **`activos`** (ahorros e inversiones) y **`deudas`** — la base de "un solo patrimonio".

## 3. Captura de gastos (QR + OCR)

Registrar no debe dar pereza: la captura vive en `src/components/expenses/OCRScanner.jsx` con dos utilitarios, `ocrUtils.js` y `qrUtils.js`.

- **Escáner de QR en vivo**: abre la cámara (`getUserMedia`) y decodifica el QR con **jsQR** frame a frame. El QR de una factura electrónica **DIAN** trae total, fecha, NIT y CUFE de forma digital, así que prellena el gasto al instante, sin OCR.
- **"QR primero"**: al tomar una foto o subir un recibo/PDF, se lee primero el QR (autoritativo para total y fecha) y **después** se corre el OCR para enriquecer. Si el OCR falla (p. ej. sin red para su modelo), el gasto igual se registra desde el QR.
- **OCR local (Tesseract.js)**: motor de extracción propio en `ocrUtils.js` — normaliza el texto, prioriza palabras clave de total ("VALOR PAGADO", "TOTAL", "VALOR A PAGAR") para no capturar subtotales/impuestos, y mapea comercios conocidos (D1, Éxito, Ara…).
- **Escaneo con IA (opcional)**: si hay `VITE_GEMINI_API_KEY`, el usuario puede reprocesar una factura difícil con Gemini (con límite diario), obteniendo comercio, ítems, categoría y medio de pago.

## 4. Diseño y UX

- **Sistema visual**: "La luz verde" (fondo azul-noche + verde señal `#00E676` como estado "vas bien"). Ver `DESIGN.md`.
- **Estilos**: un único `src/index.css` con variables de diseño (sin framework de CSS).
- **Navegación móvil**: barra inferior flotante con FAB central "Nuevo Gasto"; barra lateral en escritorio.

## 5. Pruebas

Suite de **110 pruebas** (`Vitest` + Testing Library) que validan:

- Formateo y parseo de moneda colombiana, cálculo de ciclos de pago y meses financieros (`financeUtils`).
- Extracción de OCR y parseo de QR DIAN (`ocrUtils`, `qrUtils`).
- Comportamiento de los componentes de interfaz.

Ejecutar con `npm test`.
