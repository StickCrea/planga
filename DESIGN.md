---
name: Finly
description: Todo tu dinero en un solo lugar — cuánto puedes gastar hoy, sin fricción.
colors:
  bg: "#0A0F1E"
  surface: "#1C243A"
  surface-glass: "#151B2D"
  ink: "#F5F5F5"
  ink-muted: "#A0AEC0"
  ink-subtle: "#718096"
  accent: "#00E676"
  accent-deep: "#059669"
  danger: "#FF5252"
  warning: "#FFD740"
  info: "#60A5FA"
  border: "#FFFFFF14"
  border-strong: "#FFFFFF1A"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.2rem, 8vw, 3.2rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.05em"
  mono:
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace"
    fontSize: "0.85rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "12px"
  md: "20px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.bg}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-deep}"
    textColor: "{colors.bg}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  card:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "20px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
---

# Design System: Finly

## 1. Overview

**Creative North Star: "La luz verde"**

Finly vive sobre un fondo azul-noche casi negro para que una sola cosa brille: el verde. Ese verde (#00E676) no es decoración, es un semáforo emocional — la señal de "vas bien, adelante". La app responde la pregunta de cada día ("¿cuánto puedo gastar hoy?") y el color de marca es la respuesta hecha luz: cuando el número está en verde, el usuario respira. La penumbra alrededor existe para que esa señal destaque, no para verse "oscura por moda".

El sistema es cercano y motivador sin ser blando. Acompaña como un aliado que no juzga: comunica el estado financiero —incluso el malo— con calma y claridad, nunca con alarma ni culpa. La densidad es media: la pantalla se ordena alrededor del número que importa ahora, y todo lo demás es soporte. El material es una mezcla equilibrada: vidrio y brillos suaves solo donde aportan atmósfera (la tarjeta principal, el patrimonio), y superficies sólidas y legibles donde hay datos densos (listas de gastos, tablas, históricos).

Esto rechaza explícitamente lo infantil y de juguete: nada de colores primarios chillones, ilustraciones caricaturescas ni tono que reste seriedad al hecho de que se maneja dinero real. La cercanía se logra con calidez, claridad y un verde que celebra — no bajando el nivel.

**Key Characteristics:**
- Fondo azul-noche que existe para hacer brillar un único acento verde.
- El verde comunica estado ("vas bien"), no solo marca.
- Jerarquía construida alrededor de un número hero por pantalla.
- Vidrio y brillo con moderación; solidez donde manda la lectura.
- Tono aliado: motiva, nunca regaña.

## 2. Colors

Una paleta de un solo protagonista —verde vivo— sobre neutros azul-noche, con tres colores semánticos reservados para estado.

### Primary
- **Verde Señal** (#00E676): El acento y el corazón emocional. Marca el dinero disponible, los CTAs primarios, los estados "vas bien", los íconos activos de navegación. Su brillo sobre el fondo oscuro es el efecto central del sistema.
- **Verde Profundo** (#059669): El extremo del degradado del acento (`linear-gradient(135deg, #00E676, #059669)`) y el estado hover de los botones primarios. Da volumen sin apagar el brillo.

### Secondary (semánticos de estado)
- **Rojo Alerta** (#FF5252): Gastos, deudas, montos negativos, acciones destructivas y el estado "sin dinero". Nunca decorativo; siempre significa "cuidado" o "salida de dinero".
- **Ámbar** (#FFD740): Estado intermedio — te acercas al límite del día, promedio de gasto, advertencias suaves.
- **Azul Info** (#60A5FA): Datos neutros de contexto (compromisos reservados, medios de pago), donde no cabe ni verde ni rojo.

### Neutral
- **Azul-Noche** (#0A0F1E): El fondo base de toda la app. Casi negro con sesgo azul frío; el lienzo que hace brillar el verde.
- **Superficie** (#1C243A): Fondos de inputs y superficies sólidas para datos densos.
- **Vidrio** (#151B2D a 60-70% de opacidad): Tarjetas translúcidas con desenfoque; se usa donde la atmósfera aporta.
- **Tinta** (#F5F5F5): Texto principal y números hero. Blanco suave, no puro — descansa la vista sobre el fondo noche.
- **Tinta Media** (#A0AEC0): Texto secundario, descripciones. Mínimo para cuerpo sobre fondo oscuro.
- **Tinta Tenue** (#718096): Etiquetas, metadatos, texto de apoyo. Nunca para cuerpo largo.
- **Bordes** (#FFFFFF a 8-10%): Divisiones sutiles de vidrio; se ven, no gritan.

### Named Rules
**La Regla del Semáforo.** El verde nunca es un adorno. Aparece solo donde comunica "positivo / disponible / vas bien / adelante". Rojo y ámbar cargan el resto del significado de estado. Si un elemento verde no dice nada sobre el dinero del usuario, pierde el verde.

**La Regla de un Solo Protagonista.** Una pantalla tiene un acento dominante a la vez. El verde brilla porque es escaso sobre la noche; llenar la pantalla de verde apaga la señal.

## 3. Typography

**Display / Body Font:** Inter (con system-ui, -apple-system, sans-serif)
**Numeric Font:** IBM Plex Mono (para precios y totales alineados en columnas; más cálida que JetBrains, menos "code")

**Character:** Una sola familia humanista-geométrica (Inter) cargando toda la jerarquía por peso, del 400 al 900, para una voz limpia y sin ruido. Los números importantes se apoyan en un mono de cifras tabulares para que las columnas de pesos cuadren y se lean como datos, no como prosa.

### Hierarchy
- **Display** (900, clamp(2.2rem–3.2rem), line-height 1, tracking -0.02em): El número hero — "Dinero Disponible", "Patrimonio Neto". Es lo primero que el ojo encuentra y a menudo va en verde.
- **Headline** (800, ~1.1rem): Títulos de pantalla y de modales.
- **Title** (700, ~0.95rem): Títulos de tarjeta y de sección.
- **Body** (400, 1rem, line-height 1.55): Texto de lectura. Tope de 65–75ch en bloques largos.
- **Caption** (400, 0.8rem): Texto de apoyo pequeño — subtítulos explicativos bajo una cifra, notas de contexto. En tinta media (#A0AEC0), nunca tinta tenue: sigue siendo lectura, no metadato.
- **Label** (700, ~0.7rem, tracking 0.05em, MAYÚSCULAS): Etiquetas de estadística ("DINERO DISPONIBLE", "DÍAS RESTANTES"), en tinta tenue.
- **Mono** (600, ~0.85rem, IBM Plex Mono): Precios de ítems y totales de factura donde importa la alineación.

### Named Rules
**La Regla del Número Hero.** Cada pantalla clave tiene un número protagonista en Display, más grande que todo lo demás por un margen claro. La cifra manda; la etiqueta la sirve.

## 4. Elevation

Sistema híbrido y deliberado. Las superficies no son planas por defecto ni flotan todas: el vidrio con desenfoque y los brillos verdes se reservan para los momentos protagonistas (la tarjeta de dinero disponible, el patrimonio), mientras que las listas y datos densos usan superficies sólidas con bordes sutiles para máxima legibilidad. La profundidad comunica jerarquía, no adorno.

### Shadow Vocabulary
- **Sombra de tarjeta** (`box-shadow: 0 8px 32px rgba(0,0,0,0.4)`): Separa las tarjetas del fondo noche. Difusa y baja, nunca dura.
- **Brillo de acento** (`box-shadow: 0 8px 20px rgba(0,230,118,0.3)`): El halo verde bajo botones primarios y la tarjeta hero. Es luz, no sombra — refuerza "La luz verde".

### Named Rules
**La Regla del Brillo Ganado.** El halo verde aparece solo bajo elementos que ya son protagonistas (CTA primario, número hero). Si todo brilla, nada destaca.

## 5. Components

### Buttons
- **Shape:** Esquinas suaves (12px, `--radius-sm`).
- **Primary:** Degradado verde (`#00E676 → #059669`) con texto azul-noche (#0A0F1E) para contraste alto; halo verde debajo. Es la única acción que brilla.
- **Hover / Focus:** Se asienta en el verde profundo; foco visible con anillo/realce, nunca solo cambio de color.
- **Secondary:** Superficie sólida translúcida con borde sutil y texto tinta; para acciones de apoyo (Cancelar).
- **Danger:** Rojo alerta (#FF5252) para acciones destructivas confirmadas; siempre tras un `ConfirmDialog`.

### Cards / Containers
- **Corner Style:** Generoso (20px, `--radius-md`).
- **Background:** Vidrio (`--bg-card`, ~70% opacidad) para tarjetas protagonistas; superficie sólida para listas densas.
- **Shadow Strategy:** Sombra de tarjeta difusa; brillo verde solo en la tarjeta hero (ver Elevation).
- **Border:** Borde de vidrio de 1px (#FFFFFF a 8-10%). Nunca franjas laterales de color como acento.
- **Internal Padding:** 20px (`--space-5` en superficies amplias).

### Inputs / Fields
- **Style:** Fondo superficie oscura (#1C243A), borde sutil, esquinas 12px.
- **Focus:** El borde vira a verde señal (#00E676). El foco es verde: coherente con la señal de "adelante".
- **Error:** Mensaje en rojo alerta sobre fondo rojo tenue; el borde no compite con el texto de error.

### Navigation
- **Móvil:** Barra inferior flotante translúcida con FAB central "Nuevo Gasto"; ícono activo en verde. Es la navegación primaria en el contexto de uso real (celular).
- **Escritorio:** Barra lateral fija; enlace activo con fondo verde tenue (`--accent-light`) y texto verde.
- **Regla de capas:** La barra persistente vive por debajo de overlays (menú de perfil, modales); nunca los tapa.

### Tarjeta Hero de Dinero (signature)
La tarjeta de "Dinero Disponible" / "Patrimonio Neto" es el componente firma: número Display enorme —a menudo verde—, etiqueta en label tenue, y una fila de estadísticas de apoyo debajo. Es donde el vidrio, el brillo verde y el número hero convergen. Ninguna otra tarjeta debe competir con ella en la misma pantalla.

## 6. Do's and Don'ts

### Do:
- **Do** reservar el verde señal (#00E676) para lo que comunica "disponible / positivo / adelante". La Regla del Semáforo es el alma del sistema.
- **Do** dar a cada pantalla clave un único número hero en Display, más grande que todo lo demás.
- **Do** mantener el texto de cuerpo en tinta (#F5F5F5) o tinta media (#A0AEC0) sobre el fondo noche, con contraste ≥4.5:1. La legibilidad es criterio de calidad, no opcional.
- **Do** usar texto azul-noche oscuro (#0A0F1E) sobre los botones verdes; el verde es claro y pide tinta oscura.
- **Do** usar JetBrains Mono para columnas de precios y totales, para que las cifras cuadren.
- **Do** confirmar toda acción destructiva con un `ConfirmDialog` en rojo antes de ejecutarla.

### Don't:
- **Don't** hacer que Finly se vea infantil ni de juguete: nada de colores primarios chillones, ilustraciones caricaturescas ni tono que reste seriedad a que se maneja dinero real.
- **Don't** ahogar la pantalla en verde. Su rareza sobre la noche es lo que lo hace brillar; el exceso apaga la señal.
- **Don't** usar tinta tenue (#718096) para texto de cuerpo o placeholders; solo para etiquetas y metadatos. El gris claro "por elegancia" es la razón número uno de que un diseño se lea mal.
- **Don't** poner brillo verde bajo cualquier elemento; solo bajo protagonistas ya ganados (CTA primario, número hero).
- **Don't** usar el vidrio con desenfoque como relleno decorativo en listas densas; ahí manda la superficie sólida y legible.
- **Don't** dejar que otra tarjeta compita con la tarjeta hero de dinero en la misma pantalla.
