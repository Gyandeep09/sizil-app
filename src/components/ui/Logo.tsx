interface LogoProps {

  iconSize?: number;

  textSize?: number;

  iconOnly?: boolean;
  className?: string;
}

export function Logo({
  iconSize = 40,
  textSize = 22,
  iconOnly = false,
  className = "",
}: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {}
      <img
        src="/favicon.png"
        alt="Sizil icon"
        width={iconSize}
        height={iconSize}
        style={{ objectFit: "contain", display: "block", flexShrink: 0 }}
        aria-hidden={!iconOnly}
      />

      {}
      {!iconOnly && (
        <span
          aria-label="Sizil"
          style={{
            fontSize: textSize,
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "baseline",
            gap: "1px",
          }}
        >
          {}
          <span
            style={{
              fontFamily: '"Noto Sans Bengali", "Vrinda", "Nirmala UI", sans-serif',
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            চি
          </span>
          {}
          <span
            style={{
              fontFamily: '"Syne", "Space Grotesk", -apple-system, sans-serif',
              fontWeight: 800,
              letterSpacing: "-0.05em",
            }}
          >
            zil
          </span>
        </span>
      )}
    </span>
  );
}
