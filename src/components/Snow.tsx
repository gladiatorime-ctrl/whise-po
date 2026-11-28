import { useEffect, useRef } from 'react'

/** Новогодний сезон: с 25 ноября по 20 января. Потом баннер и снег отключаются сами. */
export function isNewYearSeason(now = new Date()): boolean {
  const m = now.getMonth()
  const d = now.getDate()
  return (m === 10 && d >= 25) || m === 11 || (m === 0 && d <= 20)
}

interface Flake {
  x: number
  y: number
  r: number
  vy: number
  vx: number
  phase: number
  a: number
}

/** Лёгкий снегопад на canvas. Рисуется внутри родителя (родителю нужен position: relative). */
export default function Snow() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let flakes: Flake[] = []
    let raf = 0
    let last = 0

    const make = (initial: boolean): Flake => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : -10,
      r: 0.8 + Math.random() * 2.2,
      vy: 18 + Math.random() * 32,
      vx: -6 + Math.random() * 12,
      phase: Math.random() * Math.PI * 2,
      a: 0.35 + Math.random() * 0.55,
    })

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = parent.clientWidth
      h = parent.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.max(18, Math.min(60, Math.round(w / 14)))
      flakes = Array.from({ length: count }, () => make(true))
    }

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      if (document.hidden) {
        last = t
        return
      }
      const dt = Math.min(0.05, (t - (last || t)) / 1000)
      last = t
      ctx.clearRect(0, 0, w, h)
      for (const f of flakes) {
        f.y += f.vy * dt
        f.phase += dt * 1.2
        f.x += (f.vx + Math.sin(f.phase) * 10) * dt
        if (f.y > h + 10 || f.x < -10 || f.x > w + 10) Object.assign(f, make(false), { x: Math.random() * w })
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${f.a})`
        ctx.fill()
      }
    }

    resize()
    raf = requestAnimationFrame(frame)
    const ro = new ResizeObserver(resize)
    ro.observe(parent)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
}
