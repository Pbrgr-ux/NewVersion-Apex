"use client"

import { useRef, useEffect } from "react"

interface MiniSparklineProps {
  data: number[]
  positive: boolean
  width?: number
  height?: number
}

export function MiniSparkline({ data, positive, width = 60, height = 24 }: MiniSparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * width,
      y: height - ((value - min) / range) * (height - 4) - 2,
    }))

    // Draw line
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.strokeStyle = positive ? "oklch(0.65 0.2 145)" : "oklch(0.6 0.22 25)"
    ctx.lineWidth = 1.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, positive ? "rgba(74, 222, 128, 0.3)" : "rgba(248, 113, 113, 0.3)")
    gradient.addColorStop(1, "transparent")

    ctx.beginPath()
    ctx.moveTo(points[0].x, height)
    for (const point of points) {
      ctx.lineTo(point.x, point.y)
    }
    ctx.lineTo(points[points.length - 1].x, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
  }, [data, positive, width, height])

  return <canvas ref={canvasRef} width={width} height={height} style={{ width, height }} />
}
