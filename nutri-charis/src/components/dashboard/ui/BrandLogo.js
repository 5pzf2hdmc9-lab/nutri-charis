
export default function BrandLogo({ size = 38, className = '' }) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        background: 'linear-gradient(135deg, #10b981 0%, #059669 55%, #064e3b 100%)',
        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.38), inset 0 1px 0 rgba(255,255,255,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M19.5 4.5C13 4.5 7.5 8 5.5 14.5C4.8 16.8 5 19.5 5 19.5C5 19.5 7.7 19.7 10 19C16.5 17 20 11.5 19.5 4.5Z"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M5 19.5L14.5 10" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
