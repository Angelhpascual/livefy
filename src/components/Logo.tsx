interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export function Logo({ size = 32, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Circle background */}
        <circle cx="20" cy="20" r="20" fill="#1DB954" />

        {/* Equalizer bars — Spotify-style, centered */}
        {/* Bar 1 */}
        <rect x="8" y="22" width="4" height="10" rx="2" fill="#0a0a0a" />
        {/* Bar 2 */}
        <rect x="14" y="15" width="4" height="17" rx="2" fill="#0a0a0a" />
        {/* Bar 3 */}
        <rect x="20" y="10" width="4" height="22" rx="2" fill="#0a0a0a" />
        {/* Bar 4 */}
        <rect x="26" y="18" width="4" height="14" rx="2" fill="#0a0a0a" />

        {/* Live dot — top right */}
        <circle cx="34" cy="8" r="4" fill="#ef4444" />
      </svg>

      {/* Wordmark */}
      {showText && (
        <span
          className="font-display font-black tracking-tight"
          style={{
            fontSize: size * 0.6,
            color: '#1DB954',
            letterSpacing: '-0.02em',
          }}
        >
          Livefy
        </span>
      )}
    </div>
  )
}
