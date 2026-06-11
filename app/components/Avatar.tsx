/**
 * Avatar do cliente. Mostra a foto (custom.pfp) quando existe; senão desenha
 * um fallback com a inicial do nome sobre fundo preto — gerado em render, sem
 * precisar de storage. É o avatar "padrão" que todo cliente tem ao criar conta.
 */
export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  const cls = ['avatar', className].filter(Boolean).join(' ');
  const style = {width: size, height: size} as const;

  if (src) {
    return (
      <img
        className={cls}
        src={src}
        alt={name ? `Foto de ${name}` : 'Foto de perfil'}
        style={style}
        width={size}
        height={size}
      />
    );
  }

  return (
    <span
      className={`${cls} avatar--fallback`}
      style={{...style, fontSize: Math.round(size * 0.42)}}
      aria-hidden
    >
      {initial}
    </span>
  );
}
