export default function CornerOrnaments() {
  const Ornament = ({ className }: { className: string }) => (
    <div className={`absolute w-24 h-24 pointer-events-none opacity-30 ${className}`}
         style={{ color: '#C9A84C' }}>
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
        <path d="M10,10 L10,50 Q10,10 50,10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10,10 L50,10" stroke="currentColor" strokeWidth="0.7" strokeDasharray="2,4" />
        <circle cx="10" cy="10" r="3" fill="currentColor" />
        <path d="M25,10 L10,25" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      </svg>
    </div>
  )

  return (
    <>
      <Ornament className="top-4 left-4" />
      <Ornament className="top-4 right-4 scale-x-[-1]" />
      <Ornament className="bottom-4 left-4 scale-y-[-1]" />
      <Ornament className="bottom-4 right-4 scale-[-1]" />
    </>
  )
}
