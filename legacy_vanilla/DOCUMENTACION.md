# 📘 Documentación del Proyecto: Planga

**Planga** es una aplicación web de control financiero personal diseñada para ser intuitiva, visualmente atractiva y altamente funcional. Permite a los usuarios gestionar su presupuesto diario, rastrear gastos mediante OCR y administrar su patrimonio total.

---

## 🚀 Funcionalidades Principales

### 1. Tablero de Control (Dashboard)
*   **Dinero Disponible:** Cálculo en tiempo real del dinero restante tras gastos y compromisos.
*   **Presupuesto Diario:** Algoritmo dinámico que calcula cuánto puedes gastar hoy basado en los días restantes del ciclo.
*   **Indicador de Estado:** Mensajes y colores visuales (Verde, Amarillo, Rojo) que indican tu salud financiera del día.
*   **Anillo de Progreso:** Visualización porcentual del gasto total respecto al ingreso mensual.

### 2. Ciclos Financieros Personalizados
*   **Reinicio de Mes:** Capacidad de definir un día específico para el inicio del mes financiero (por defecto el **día 25**).
*   **Lógica de Ciclo:** Los gastos se agrupan automáticamente según el periodo (ej. del 25 de abril al 24 de mayo pertenece al ciclo de "Mayo").
*   **Visualización de Rango:** El cabezote muestra las fechas exactas que abarca el ciclo actual.

### 3. Escaneo de Facturas (OCR)
*   **Tecnología:** Utiliza `Tesseract.js` para procesar imágenes directamente en el navegador.
*   **Limpieza de Datos:** Algoritmos avanzados para eliminar ruido de facturas (códigos de barras, prefijos de unidades como "1 UN", guiones extra).
*   **Detección Inteligente:** Extrae automáticamente el nombre del comercio, la fecha, los productos individuales con sus precios y el total.
*   **Sugerencia de Categoría:** Clasifica automáticamente el gasto basándose en palabras clave detectadas.

### 4. Gestión de Medios de Pago
*   **Tipos de Pago:** Soporte para **Efectivo** y **Tarjeta**.
*   **Detalle de Tarjetas:** Permite registrar la entidad (Bancolombia, Nu, Rappi, etc.) y si es **Débito** o **Crédito**.
*   **Auto-detección:** El OCR intenta detectar el banco y tipo de tarjeta leyendo el texto de la factura.

### 5. Mi Patrimonio (Cartera)
*   **Patrimonio Neto:** Resumen visual de Activos vs. Pasivos.
*   **Ahorros e Inversiones:** Registro de capital acumulado en diferentes cuentas o fondos.
*   **Gestión de Deudas:** Seguimiento de préstamos o saldos pendientes con **barras de progreso** que muestran el porcentaje pagado de cada deuda.

---

## 🛠️ Arquitectura Técnica

### Tecnologías
*   **Frontend:** HTML5 semántico, CSS3 (Vanilla con variables y Flexbox/Grid).
*   **Lógica:** JavaScript ES6+ (Vanilla, sin frameworks para máxima velocidad).
*   **Gráficos:** `Chart.js` para visualizaciones analíticas.
*   **OCR:** `Tesseract.js`.
*   **Almacenamiento:** `LocalStorage` para persistencia de datos local sin necesidad de servidor (privacidad total).

### Estructura de Archivos
*   `index.html`: Estructura de todas las pantallas y modales.
*   `styles.css`: Sistema de diseño "Premium Dark Mode" y animaciones.
*   `app.js`: Lógica de negocio, gestión de estado, navegación y renderizado.
*   `ocr.js`: Lógica de procesamiento de imágenes y limpieza de texto.
*   `charts.js`: Configuración de los tableros analíticos.

---

## ⚙️ Configuración y Uso

### Ajuste de Ciclo
Para cambiar el día de inicio (ej. si te pagan el 30):
1.  Ve a **Configuración** (ícono de engranaje).
2.  Cambia el **"Día de inicio del ciclo"**.
3.  La app recalculará inmediatamente tus presupuestos y días restantes.

### Registro de Gastos
1.  Usa el botón **"+"** o **"Escanear factura"**.
2.  Si escaneas, la app llenará el monto, comercio y productos automáticamente.
3.  Selecciona el medio de pago y guarda.

---

## 📝 Notas de Desarrollo
*   La aplicación está optimizada para ser instalada como una **PWA** (Progressive Web App) en dispositivos móviles.
*   Toda la limpieza de productos OCR se basa en expresiones regulares (regex) para garantizar descripciones limpias y legibles en el historial.
