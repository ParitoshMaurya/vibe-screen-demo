/**
 * Export Compositor Worker
 * Receives ImageBitmap frames from the main thread and composites them
 * onto an OffscreenCanvas (transferred from main thread's HTMLCanvasElement).
 * MediaRecorder lives on the main thread — this worker only draws frames.
 *
 * Message protocol (in):
 *   init   → { type:'init', canvas: OffscreenCanvas, bgImageBitmap?, cfg: {...} }
 *   frame  → { type:'frame', bitmap: ImageBitmap, animScale, animFX, animFY }
 *   finish → { type:'finish' }
 *
 * Posts back:
 *   ready   → worker initialized
 *   flushed → all frames drawn, safe to stop recorder
 *   error   → { type:'error', message: string }
 */

let ctx = null
let config = null
let bgBitmap = null

function parseGradient(gradient, W, H) {
  try {
    const stops = gradient.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g) || []
    if (!stops.length) return null
    let grad
    if (gradient.startsWith('linear-gradient')) {
      grad = ctx.createLinearGradient(0, 0, W, H)
    } else {
      grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7)
    }
    stops.forEach((c, i) => grad.addColorStop(i / Math.max(stops.length - 1, 1), c))
    return grad
  } catch {
    return null
  }
}

function drawBackground(W, H) {
  if (bgBitmap) {
    ctx.drawImage(bgBitmap, 0, 0, W, H)
    return
  }
  const bg = config.background
  const isGrad = bg && (bg.startsWith('linear-gradient') || bg.startsWith('radial-gradient'))
  if (isGrad) {
    ctx.fillStyle = parseGradient(bg, W, H) || '#1a1a2e'
  } else {
    ctx.fillStyle = bg || '#1a1a2e'
  }
  ctx.fillRect(0, 0, W, H)
}

self.onmessage = (e) => {
  const { type } = e.data

  if (type === 'init') {
    try {
      const { canvas, cfg, bgImageBitmap } = e.data
      config = cfg
      bgBitmap = bgImageBitmap || null
      ctx = canvas.getContext('2d')
      self.postMessage({ type: 'ready' })
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message })
    }
    return
  }

  if (type === 'frame') {
    const { bitmap, animScale, animFX, animFY } = e.data
    const { OUT_W, OUT_H, drawX, drawY, drawW, drawH, borderRadius, shadowIntensity } = config

    ctx.clearRect(0, 0, OUT_W, OUT_H)
    drawBackground(OUT_W, OUT_H)

    ctx.save()
    if (shadowIntensity > 0) {
      ctx.shadowColor = `rgba(0,0,0,${Math.min(shadowIntensity * 0.85, 0.85)})`
      ctx.shadowBlur = shadowIntensity * 50
      ctx.shadowOffsetY = shadowIntensity * 10
      ctx.beginPath()
      ctx.roundRect(drawX, drawY, drawW, drawH, borderRadius)
      ctx.fillStyle = 'rgba(0,0,0,0.01)'
      ctx.fill()
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
    }
    ctx.beginPath()
    ctx.roundRect(drawX, drawY, drawW, drawH, borderRadius)
    ctx.clip()
    if (animScale > 1.001) {
      const px = drawX + drawW * animFX
      const py = drawY + drawH * animFY
      ctx.translate(px, py)
      ctx.scale(animScale, animScale)
      ctx.translate(-px, -py)
    }
    ctx.drawImage(bitmap, drawX, drawY, drawW, drawH)
    ctx.restore()
    bitmap.close()
    return
  }

  if (type === 'finish') {
    // All frames have been drawn — signal main thread it's safe to stop recorder
    self.postMessage({ type: 'flushed' })
    return
  }
}
