interface NavIconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

export function NavIcon({ name, className, filled = false }: NavIconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className ?? ''}`.trim()}
      aria-hidden
      style={
        filled
          ? {
              fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24",
            }
          : undefined
      }
    >
      {name}
    </span>
  );
}
