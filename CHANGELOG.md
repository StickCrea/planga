# Changelog

Todos los cambios notables de Finly se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto usa [Versionado Semántico](https://semver.org/lang/es/):

- **MAJOR** (`2.0.0`) — cambios que rompen algo para el usuario o los datos.
- **MINOR** (`1.1.0`) — funcionalidad nueva compatible hacia atrás.
- **PATCH** (`1.0.1`) — correcciones de bugs y ajustes visuales.

## [1.0.1] — 2026-07-21

### Corregido

- **Login con Google bloqueado al volver atrás:** si el usuario iniciaba el
  acceso con Google y se devolvía sin completarlo, el navegador restauraba la
  pantalla desde el bfcache con el estado intacto, dejando el botón girando y
  deshabilitado para siempre — sin poder reintentar salvo recargando a mano.
  Ahora, al volver a mostrarse la pantalla, se libera ese "cargando" huérfano.
  El reseteo solo aplica si había un acceso externo pendiente, para no
  interferir con el inicio de sesión por contraseña.

## [1.0.0] — 2026-07-21

Primera versión etiquetada. Recoge el estado actual en producción.

### Corregido

- **Compromisos fijos:** al pulsar "Pagar", el gasto se registra *antes* de
  marcar el compromiso como pagado. Antes se marcaba el ✓ aunque el guardado
  fallara, dejando el compromiso "pagado" sin descontar del saldo disponible.
- Guarda contra doble cobro si el compromiso ya está pagado en el ciclo.
- **Header de escritorio:** banda opaca a sangre completa detrás del header
  sticky; las tarjetas translúcidas ya no asoman por los lados al hacer scroll.
- **Arranque en celular:** se añade el manifest PWA, así la pantalla de inicio
  del sistema usa el fondo azul-noche con el ícono y el nombre, en vez del
  ícono suelto sobre fondo blanco.

### Cambiado

- **Dinero Disponible:** el número pasa de texto sobre degradado recortado a
  verde sólido con glow — más legible (AA) — y usa dígitos tabulares para que
  no "bailen" al cambiar el monto.
- Copia humana en el dashboard en lugar del volcado de la fórmula.
- La fila "Recibido / + Ingreso" se centra y elimina el hueco vacío en
  pantallas anchas.
- **Compromisos:** la tarjeta ahora resume lo *pendiente* por pagar (no el
  total bruto), con progreso pagado/total y barra; se quita el bloque
  explicativo duplicado.

### Añadido

- **Splash de arranque** con el ícono de la marca, duración mínima visible,
  glow que respira y fundido de salida hacia la app. Respeta
  `prefers-reduced-motion`.
- La **versión** de la app se muestra al final de Ajustes.
</content>
