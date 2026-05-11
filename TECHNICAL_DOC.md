# Documentación Técnica: Finly Cloud v3.1 Intelligence

Esta documentación detalla la arquitectura, el modelo de datos y las decisiones de diseño tomadas durante el desarrollo de la plataforma Finly.

## 1. Arquitectura del Sistema
Finly es una aplicación web SPA (Single Page Application) construida sobre el stack moderno **React (Vite)** + **Supabase Cloud**.

### Componentes Core:
- **FinanceContext:** El cerebro de la aplicación. Maneja el estado global, la persistencia en la nube, los listeners en tiempo real y la lógica de sesión por inactividad.
- **Supabase Realtime:** Utiliza WebSockets para sincronizar cambios entre múltiples dispositivos sin necesidad de refrescar la interfaz (latencia <10ms).
- **Inactivity Guard:** Un sistema de seguridad que rastrea eventos del usuario (`mousemove`, `keypress`, etc.) y cierra la sesión automáticamente tras 30 minutos de inactividad.

## 2. Modelo de Datos (Supabase Schema)

### `profiles`
- `id`: UUID (vinculado a auth.users).
- `nombre`: Texto (apodo del usuario).
- `ciclo_dia`: Entero (día del mes en que inicia el ciclo financiero).
- `telefono`: Texto.

### `ciclos`
- `id`: UUID.
- `user_id`: UUID.
- `nombre`: Texto (Formato: YYYY-MM).
- `ingreso`: Numérico (Presupuesto total para ese ciclo).

### `gastos`
- `id`: UUID.
- `ciclo_id`: Referencia a ciclos.
- `comercio`: Texto.
- `total`: Numérico.
- `categoria`: Enum (alimentacion, transporte, etc.).
- `medio_pago`: Enum (Efectivo, Debito, Credito).
- `fecha_gasto`: Timestamp.

## 3. Inteligencia OCR
El módulo OCR utiliza **Tesseract.js** con un motor de extracción personalizado (`ocrUtils.js`):
- **Normalización:** Convierte el texto extraído a un formato uniforme (minúsculas, sin tildes).
- **Lógica de Prioridad:** Busca palabras clave como "VALOR PAGADO", "TOTAL", "VALOR A PAGAR" en un orden de jerarquía específico para evitar capturar subtotales o impuestos.
- **Mapeo de Comercios:** Utiliza una base de datos interna (`MERCHANT_MAP`) para identificar automáticamente el comercio basado en patrones de texto (ej: "D1", "EXITO", "ARA").

## 4. Diseño y UX
- **Estética:** Glassmorphism Oscuro (#0A0F1E).
- **Frontend Framework:** Vanilla CSS para máximo rendimiento.
- **Navegación:** Floating Bottom Nav optimizado para dispositivos móviles con efecto de desenfoque progresivo.

## 5. Pruebas (Testing)
El proyecto incluye una suite de 86 pruebas unitarias (`Vitest`) que validan:
- Lógica de formateo de moneda colombiana.
- Cálculo de días de ciclo y meses financieros.
- Integridad de los componentes de la interfaz de usuario.
