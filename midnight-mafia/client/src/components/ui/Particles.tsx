import { useEffect, useRef } from 'react'

export default function Particles() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    container.innerHTML = ''

    for (let i = 0; i < 35; i++) {
      const p = document.createElement('div')
      const x     = Math.random() * 100
      const drift = (Math.random() - 0.5) * 200
      const dur   = 8 + Math.random() * 12
      const delay = Math.random() * 15
      const size  = Math.random() * 2.5 + 0.8

      p.style.cssText = `
        position: absolute;
        left: ${x}%;
        width: ${size}px;
        height: ${size}px;
        background: #C9A84C;
        border-radius: 50%;
        opacity: 0;
        animation: particleFloat ${dur}s ${delay}s linear infinite;
        --drift: ${drift}px;
      `
      container.appendChild(p)
    }

    // Inject keyframes if not already present
    if (!document.getElementById('particle-style')) {
      const style = document.createElement('style')
      style.id = 'particle-style'
      style.textContent = `
        @keyframes particleFloat {
          0%   { transform: translateY(100vh) translateX(0) scale(0); opacity: 0; }
          10%  { opacity: 0.55; }
          90%  { opacity: 0.25; }
          100% { transform: translateY(-10vh) translateX(var(--drift)) scale(1.5); opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return (
    <div ref={ref}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0" />
  )
}
