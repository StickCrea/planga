# Handoff: Finly Logo & Brand Identity

## Overview
Identidad visual de Finly (app de finanzas personales, Colombia/LatAm), dirección "La Luz Verde": fondo azul-noche + verde como semáforo de estado. Este paquete cubre el logo/app icon final y el Brand Book completo (estrategia, paleta, tipografía, iconografía, sistema UI, UX Dark/Light Mode).

## Sobre los archivos de diseño
Los archivos HTML incluidos son **referencias de diseño**, no código de producción para copiar tal cual. La tarea es **recrear este diseño en el entorno real de la web app** (el framework/librerías que ya use el proyecto — React, Vue, etc., o el que se elija si aún no existe), usando sus propios patrones de componentes.

## Fidelidad
**Alta fidelidad (hifi)**: colores, tipografía y proporciones son finales. Recrear pixel-perfect.

## Logo / App Icon (dirección final)
- **Símbolo**: triángulo sólido apuntando hacia arriba ("adelante" / "vas bien"), un solo color, sin gradiente ni sombra decorativa.
- **Contenedor**: rounded-square, fondo `#0A0F1E`, radio de esquina ~25% del ancho (estilo iOS) o 0 (Android, sin recorte extra).
- **Símbolo SVG** (viewBox 52×52): `<path d="M10 34 L26 14 L42 34 Z" fill="#00E676"/>`
- **Lockup horizontal** (ícono + wordmark): ícono a la izquierda (radio 12–14px si es pequeño), gap 16px, wordmark "Finly" en Inter 700, letter-spacing 0.5px, color `#F5F5F5` sobre fondo oscuro.
- **Tamaños de referencia**: favicon 32×32 (símbolo sin espacio extra), app icon 96–192px, ícono en lockup 44–56px.
- **Área de seguridad**: padding interno del triángulo dentro del contenedor ≈ 20% en cada lado (ver proporciones del SVG: canvas 52×52, símbolo ocupa aprox. 32×20 centrado).
- **Variantes de color**: verde `#00E676` sobre fondo oscuro `#0A0F1E` (primaria). Sobre fondo claro, usar verde ajustado `#00B84D`. Monocromo blanco/negro solo en casos restringidos (merch, sellos).
- **Nunca**: gradientes, sombras decorativas, deformar el triángulo, rotarlo, usar otro color fuera de la paleta funcional.

## Design Tokens

### Colores
| Token | Hex | Uso |
|---|---|---|
| Fondo base | #0A0F1E | Lienzo principal, contenedor del ícono |
| Superficie | #1C243A | Cards, inputs |
| Verde primario | #00E676 | Símbolo del logo, CTA, estado positivo |
| Verde profundo | #059669 | Hover/pressed |
| Rojo alerta | #FF5252 | Estados negativos |
| Ámbar | #FFD740 | Advertencia |
| Azul info | #60A5FA | Datos neutros/links |
| Texto principal | #F5F5F5 | Wordmark, cuerpo |
| Texto secundario | #A0AEC0 | Subtítulos |
| Texto tenue | #718096 | Etiquetas |

### Tipografía
- Wordmark / UI: **Inter** (400–900)
- Cifras/números: **IBM Plex Mono** (evolución recomendada sobre JetBrains Mono)
- Wordmark del logo: Inter 700, letter-spacing +0.5px

### Radios
- sm: 12px · md: 20px · App icon: 24–28% del tamaño (iOS-style)

## Assets
Todo el logo está construido en SVG inline (un solo `<path>` triangular) — no hay imágenes rasterizadas que exportar. Para producción, exportar como SVG/PNG en los tamaños: 16, 32, 48, 96, 180 (iOS), 192 (Android), 512 (store).

## Files
- `Finly Logo Showcase.dc.html` — logo/app icon final (símbolo + lockup)
- `Finly Brand Book.dc.html` — estudio de marca completo (estrategia, competidores, personalidad, paleta, tipografía, iconografía, sistema visual, UX Dark/Light Mode, conclusión)
