# Finly

Finanzas personales para Colombia. Finly responde la pregunta de cada día —**"¿cuánto puedo gastar hoy?"**— calculándola desde el ingreso del ciclo de pago (quincena o mes, desde tu día de cobro) y los días que faltan para el próximo. Alrededor de eso quita la fricción de registrar: escanea el **QR de la factura electrónica** o toma una foto (OCR), y reúne gastos, ingresos, ahorros, inversiones y deudas como un solo patrimonio.

El contexto de producto vive en [`PRODUCT.md`](PRODUCT.md) y el sistema visual "La luz verde" en [`DESIGN.md`](DESIGN.md).

## Stack

- **React 19 + Vite**
- **Supabase** — autenticación, datos y sincronización en tiempo real (`postgres_changes`)
- **Chart.js** (`react-chartjs-2`) para las visualizaciones
- **Tesseract.js** (OCR de facturas) + **jsQR** (QR DIAN)
- **Vitest** + Testing Library para pruebas

## Cómo correr

```bash
npm install
npm run dev       # servidor de desarrollo en http://localhost:5173
npm run build     # build de producción
npm run preview   # sirve el build
npm test          # suite de pruebas (Vitest)
npm run lint      # ESLint
```

## Modo demo local

Sin variables de entorno, Finly arranca en **Local Demo Mode**: un backend simulado en `localStorage` con datos de ejemplo y una cuenta demo (`demo@finly.com` / `finly123`). Es ideal para probar la app sin infraestructura.

Para conectar Supabase real, crea un archivo `.env` (ignorado por git):

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_GEMINI_API_KEY=opcional-para-escaneo-con-ia
```

## Estructura

```
src/
  components/
    auth/        AuthScreen, ResetPasswordScreen, OnboardingScreen
    dashboard/   Dashboard, Summary
    expenses/    ExpenseForm, OCRScanner, ExpenseDetailsModal
    portfolio/   Portfolio, Commitments
    analytics/   Analytics, Reports
    settings/    SettingsScreen, HelpScreen, SidebarMenu
    ui/          Logo, Modal, ConfirmDialog, EmptyState
  context/       FinanceContext — estado global, sesión y realtime
  lib/           supabase.js — cliente Supabase (+ mock del modo demo)
  utils/         financeUtils, ocrUtils, qrUtils
  tests/         pruebas Vitest
docs/            documentación técnica
```

## Documentación

- [`PRODUCT.md`](PRODUCT.md) — producto, usuarios y principios estratégicos.
- [`DESIGN.md`](DESIGN.md) — sistema visual "La luz verde".
- [`docs/TECHNICAL_DOC.md`](docs/TECHNICAL_DOC.md) — arquitectura, modelo de datos y captura (OCR/QR).
