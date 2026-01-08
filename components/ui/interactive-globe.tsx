"use client"

import { useEffect, useRef } from 'react'

export function InteractiveGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    resizeCanvas()

    const satellites = Array.from({ length: 3 }, (_, i) => ({
      angle: (i * 120) * Math.PI / 180,
      radius: 300,
      speed: 0.005 + i * 0.002
    }))

    let animationId: number

    const animate = () => {
      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2

      ctx.clearRect(0, 0, w, h)

      // Globe
      const gradient = ctx.createRadialGradient(cx - 40, cy - 40, 0, cx, cy, 300)
      gradient.addColorStop(0, '#d4a574')
      gradient.addColorStop(0.5, '#a0826d')
      gradient.addColorStop(1, '#6b5344')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(cx, cy, 300, 0, Math.PI * 2)
      ctx.fill()

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1
      for (let i = 0; i < 6; i++) {
        ctx.beginPath()
        ctx.ellipse(cx, cy, 300, 300 * Math.sin((i * 30) * Math.PI / 180), 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Satellites
      satellites.forEach((sat) => {
        sat.angle += sat.speed
        const x = cx + Math.cos(sat.angle) * sat.radius
        const y = cy + Math.sin(sat.angle) * sat.radius * 0.4

        ctx.fillStyle = '#d4a574'
        ctx.shadowColor = '#d4a574'
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
