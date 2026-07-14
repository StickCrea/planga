// Logo de marca: triángulo verde "adelante" (isotipo) + wordmark "Finly".
// Sobre el fondo azul-noche de la app el triángulo va sin contenedor (brilla solo);
// el contenedor oscuro redondeado solo existe en el favicon/app icon (public/finly.svg).
export default function Logo({ size = 28, wordmark = true }) {
  const gap = Math.round(size * 0.42);
  const fontSize = Math.round(size * 0.86);
  return (
    <span
      className="brand-logo"
      translate="no"
      style={{ display: 'inline-flex', alignItems: 'center', gap: `${gap}px`, lineHeight: 1 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ display: 'block', flexShrink: 0 }}
        role={wordmark ? 'presentation' : 'img'}
        aria-label={wordmark ? undefined : 'Finly'}
        aria-hidden={wordmark ? 'true' : undefined}
      >
        <path d="M12 4 L21 19 L3 19 Z" fill="var(--green)" />
      </svg>
      {wordmark && (
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, letterSpacing: '0.5px', fontSize: `${fontSize}px`, color: 'var(--text1)' }}>
          Finly
        </span>
      )}
    </span>
  );
}
