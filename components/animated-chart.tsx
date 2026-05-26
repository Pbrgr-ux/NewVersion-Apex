"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  color: string
  type: "coin" | "spark" | "trophy"
}

interface FloatingScore {
  x: number
  y: number
  value: string
  alpha: number
  vy: number
  color: string
}

export function AnimatedChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let offset = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener("resize", resize)

    // Particles for gamification effect
    const particles: Particle[] = []
    const floatingScores: FloatingScore[] = []

    const colors = {
      gold: "rgba(212, 175, 55, 1)",
      goldFade: "rgba(212, 175, 55, 0.6)",
      green: "rgba(34, 197, 94, 1)",
      cyan: "rgba(34, 211, 238, 0.8)",
      white: "rgba(255, 255, 255, 0.9)",
    }

    // Spawn particles periodically
    const spawnParticle = () => {
      if (particles.length < 40) {
        const types: Particle["type"][] = ["coin", "spark", "trophy"]
        const type = types[Math.floor(Math.random() * types.length)]
        particles.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 20,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random() * 2,
          size: type === "trophy" ? 16 : type === "coin" ? 12 : 6,
          alpha: 1,
          color: type === "coin" ? colors.gold : type === "trophy" ? colors.green : colors.cyan,
          type,
        })
      }
    }

    // Spawn floating scores
    const spawnScore = () => {
      if (floatingScores.length < 5) {
        const values = ["+€420", "+$1.2K", "+2.4%", "#1", "+€89", "+$5K", "-1.2%", "#3", "+€2.1K", "+$340", "+5.8%", "#12"]
        floatingScores.push({
          x: Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
          y: canvas.height * 0.3 + Math.random() * canvas.height * 0.4,
          value: values[Math.floor(Math.random() * values.length)],
          alpha: 1,
          vy: -0.8,
          color: Math.random() > 0.3 ? colors.gold : colors.green,
        })
      }
    }

    // Generate chart data with more dramatic movements
    const generateChartData = (
      points: number,
      volatility: number,
      trend: number,
      baseY: number
    ) => {
      const data: number[] = []
      let value = baseY
      for (let i = 0; i < points; i++) {
        // Add occasional spikes for excitement
        const spike = Math.random() > 0.95 ? (Math.random() - 0.5) * 0.15 : 0
        value += (Math.random() - 0.5) * volatility + trend + spike
        value = Math.max(0.15, Math.min(0.85, value))
        data.push(value)
      }
      return data
    }

    const charts = [
      {
        data: generateChartData(200, 0.04, 0.002, 0.5),
        color: "rgba(212, 175, 55, 0.5)",
        glowColor: "rgba(212, 175, 55, 0.3)",
        lineWidth: 3,
        speed: 0.25,
        glow: true,
      },
      {
        data: generateChartData(200, 0.035, 0.001, 0.6),
        color: "rgba(34, 197, 94, 0.4)",
        glowColor: "rgba(34, 197, 94, 0.2)",
        lineWidth: 2,
        speed: 0.18,
        glow: true,
      },
      {
        data: generateChartData(200, 0.03, -0.0005, 0.4),
        color: "rgba(34, 211, 238, 0.25)",
        glowColor: "rgba(34, 211, 238, 0.1)",
        lineWidth: 1.5,
        speed: 0.3,
        glow: false,
      },
    ]

    const drawChart = (
      chart: (typeof charts)[0],
      offsetMultiplier: number
    ) => {
      const { data, color, glowColor, lineWidth, speed, glow } = chart
      const chartOffset = (offset * speed) % data.length

      // Draw glow effect
      if (glow) {
        ctx.beginPath()
        ctx.strokeStyle = glowColor
        ctx.lineWidth = lineWidth + 6
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        for (let i = 0; i < canvas.width; i++) {
          const dataIndex =
            Math.floor(i / 4 + chartOffset * offsetMultiplier) % data.length
          const y = data[dataIndex] * canvas.height

          if (i === 0) {
            ctx.moveTo(i, y)
          } else {
            ctx.lineTo(i, y)
          }
        }
        ctx.stroke()
      }

      // Draw main line
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      for (let i = 0; i < canvas.width; i++) {
        const dataIndex =
          Math.floor(i / 4 + chartOffset * offsetMultiplier) % data.length
        const y = data[dataIndex] * canvas.height

        if (i === 0) {
          ctx.moveTo(i, y)
        } else {
          ctx.lineTo(i, y)
        }
      }

      ctx.stroke()

      // Draw pulsing dot at the end
      const lastIndex = Math.floor((canvas.width - 1) / 4 + chartOffset * offsetMultiplier) % data.length
      const lastY = data[lastIndex] * canvas.height
      const pulseSize = 4 + Math.sin(offset * 0.1) * 2

      ctx.beginPath()
      ctx.fillStyle = color.replace("0.5", "1").replace("0.4", "1").replace("0.25", "0.8")
      ctx.arc(canvas.width - 10, lastY, pulseSize, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw animated grid with pulse effect
    const drawGrid = () => {
      const pulseAlpha = 0.02 + Math.sin(offset * 0.05) * 0.01
      ctx.strokeStyle = `rgba(255, 255, 255, ${pulseAlpha})`
      ctx.lineWidth = 1

      // Horizontal lines
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
        ctx.stroke()
      }

      // Vertical lines with movement
      for (let i = 0; i < canvas.width + 80; i += 80) {
        const x = (i - (offset * 0.5) % 80 + 80) % (canvas.width + 80)
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
    }

    // Draw particles
    const drawParticles = () => {
      particles.forEach((p, index) => {
        p.x += p.vx
        p.y += p.vy
        p.alpha -= 0.005
        p.vy -= 0.01 // Slight float up acceleration

        if (p.alpha <= 0 || p.y < -50) {
          particles.splice(index, 1)
          return
        }

        ctx.save()
        ctx.globalAlpha = p.alpha

        if (p.type === "coin") {
          // Draw coin shape
          const wobble = Math.sin(offset * 0.1 + p.x) * 0.3
          ctx.beginPath()
          ctx.ellipse(p.x, p.y, p.size * (0.7 + wobble * 0.3), p.size, 0, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.fill()
          ctx.strokeStyle = "rgba(255, 215, 0, 0.8)"
          ctx.lineWidth = 1
          ctx.stroke()
          // Dollar sign
          ctx.fillStyle = "rgba(15, 23, 42, 0.6)"
          ctx.font = `bold ${p.size * 0.8}px sans-serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("$", p.x, p.y)
        } else if (p.type === "trophy") {
          // Draw simple trophy/star
          ctx.fillStyle = p.color
          ctx.beginPath()
          const spikes = 5
          const outerRadius = p.size
          const innerRadius = p.size * 0.5
          for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius
            const angle = (i * Math.PI) / spikes - Math.PI / 2
            const x = p.x + Math.cos(angle) * radius
            const y = p.y + Math.sin(angle) * radius
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()
          ctx.fill()
        } else {
          // Spark/diamond
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.moveTo(p.x, p.y - p.size)
          ctx.lineTo(p.x + p.size * 0.6, p.y)
          ctx.lineTo(p.x, p.y + p.size)
          ctx.lineTo(p.x - p.size * 0.6, p.y)
          ctx.closePath()
          ctx.fill()
        }

        ctx.restore()
      })
    }

    // Draw floating score popups
    const drawFloatingScores = () => {
      floatingScores.forEach((score, index) => {
        score.y += score.vy
        score.alpha -= 0.008

        if (score.alpha <= 0) {
          floatingScores.splice(index, 1)
          return
        }

        ctx.save()
        ctx.globalAlpha = score.alpha
        ctx.font = "bold 18px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        
        // Glow effect
        ctx.shadowColor = score.color
        ctx.shadowBlur = 15
        ctx.fillStyle = score.color
        ctx.fillText(score.value, score.x, score.y)
        
        ctx.restore()
      })
    }

    // Draw progress bar decoration
    const drawProgressBar = () => {
      const barWidth = 120
      const barHeight = 6
      const x = canvas.width - barWidth - 30
      const y = 40
      const progress = (Math.sin(offset * 0.02) + 1) / 2

      // Background
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, 3)
      ctx.fill()

      // Progress fill with gradient
      const gradient = ctx.createLinearGradient(x, y, x + barWidth * progress, y)
      gradient.addColorStop(0, colors.gold)
      gradient.addColorStop(1, colors.green)
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth * progress, barHeight, 3)
      ctx.fill()

      // Label
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "right"
      ctx.fillText("LEVEL UP", x + barWidth, y - 8)
    }

    let frameCount = 0
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Subtle radial gradient background pulse
      const pulseIntensity = 0.15 + Math.sin(offset * 0.02) * 0.05
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.7
      )
      gradient.addColorStop(0, `rgba(212, 175, 55, ${pulseIntensity * 0.1})`)
      gradient.addColorStop(0.5, "rgba(15, 23, 42, 0)")
      gradient.addColorStop(1, "rgba(15, 23, 42, 0)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      drawGrid()

      charts.forEach((chart, index) => {
        drawChart(chart, index + 1)
      })

      drawParticles()
      drawFloatingScores()
      drawProgressBar()

      // Spawn new elements periodically
      frameCount++
      if (frameCount % 30 === 0) spawnParticle()
      if (frameCount % 150 === 0) spawnScore()

      offset += 0.6
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}
