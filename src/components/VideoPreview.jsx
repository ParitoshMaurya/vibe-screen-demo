import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

const ZOOM_SCALES = { 1: 1.25, 2: 1.5, 3: 1.8, 4: 2.2, 5: 3.5, 6: 5.0 }
const SMOOTHING = 0.1

export default function VideoPreview({
  videoRef,
  videoUrl,
  background,
  padding,
  borderRadius,
  shadowIntensity,
  zoomRegions,
  trimRegions,
  onTimeUpdate,
  onLoadedMetadata,
  onPlay,
  onPause,
  onZoomFocusChange,
  selectedZoomId,
  isExporting,
  aspectRatio,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const animStateRef = useRef({ scale: 1, focusX: 0.5, focusY: 0.5 })
  const bgImageRef = useRef(null)
  const bgImageUrlRef = useRef(null)

  // Keep refs for props used in RAF loop to avoid stale closures
  const backgroundRef = useRef(background)
  const paddingRef = useRef(padding)
  const borderRadiusRef = useRef(borderRadius)
  const shadowIntensityRef = useRef(shadowIntensity)
  const zoomRegionsRef = useRef(zoomRegions)
  const trimRegionsRef = useRef(trimRegions)
  const selectedZoomIdRef = useRef(selectedZoomId)
  const isExportingRef = useRef(isExporting)
  const aspectRatioRef = useRef(aspectRatio)

  useEffect(() => { backgroundRef.current = background }, [background])
  useEffect(() => { paddingRef.current = padding }, [padding])
  useEffect(() => { borderRadiusRef.current = borderRadius }, [borderRadius])
  useEffect(() => { shadowIntensityRef.current = shadowIntensity }, [shadowIntensity])
  useEffect(() => { zoomRegionsRef.current = zoomRegions }, [zoomRegions])
  useEffect(() => { trimRegionsRef.current = trimRegions }, [trimRegions])
  useEffect(() => { selectedZoomIdRef.current = selectedZoomId }, [selectedZoomId])
  useEffect(() => { isExportingRef.current = isExporting }, [isExporting])
  useEffect(() => { aspectRatioRef.current = aspectRatio }, [aspectRatio])

  // Preload background image when it's an image URL
  useEffect(() => {
    let bg = background
    // Extract URL from css url(...) wrapper
    const urlMatch = bg && bg.match(/^url\((.+)\)$/)
    if (urlMatch) bg = urlMatch[1]
    const isImg = bg && (bg.startsWith('data:') || bg.startsWith('http') || bg.startsWith('/'))
    if (isImg && bg !== bgImageUrlRef.current) {
      bgImageUrlRef.current = bg
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { bgImageRef.current = img }
      img.src = bg
    } else if (!isImg) {
      bgImageRef.current = null
      bgImageUrlRef.current = null
    }
  }, [background])

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    const container = containerRef.current
    if (!canvas || !video || !container) return
    // Pause rendering during export to prevent flicker from rapid seeks
    if (isExportingRef.current) return

    const W = container.clientWidth
    const H = container.clientHeight
    if (W === 0 || H === 0) return

    const dpr = window.devicePixelRatio || 1
    const bW = Math.round(W * dpr)
    const bH = Math.round(H * dpr)
    if (canvas.width !== bW || canvas.height !== bH) {
      canvas.width = bW
      canvas.height = bH
    }

    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const bg = backgroundRef.current
    const pad = (paddingRef.current / 100) * Math.min(W, H) * 0.45
    const shadow = shadowIntensityRef.current
    const radius = borderRadiusRef.current

    // --- Draw background ---
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, W, H)
    } else {
      const isGradient = bg && (bg.startsWith('linear-gradient') || bg.startsWith('radial-gradient'))
      if (isGradient) {
        ctx.fillStyle = parseGradientToStyle(ctx, bg, W, H) || '#1a1a2e'
      } else {
        ctx.fillStyle = bg || '#1a1a2e'
      }
      ctx.fillRect(0, 0, W, H)
    }

    // --- Compute video draw rect (always at natural ratio — AR only affects canvas shape) ---
    const vw = (video.videoWidth > 0 ? video.videoWidth : 16)
    const vh = (video.videoHeight > 0 ? video.videoHeight : 9)
    const naturalAspect = vw / vh

    let drawW = W - pad * 2
    let drawH = drawW / naturalAspect
    if (drawH > H - pad * 2) {
      drawH = H - pad * 2
      drawW = drawH * naturalAspect
    }
    const drawX = (W - drawW) / 2
    const drawY = (H - drawH) / 2

    // --- Zoom animation ---
    const timeMs = video.currentTime * 1000
    const activeZoom = zoomRegionsRef.current?.find(r => timeMs >= r.startMs && timeMs <= r.endMs) ?? null
    const targetScale = activeZoom ? (ZOOM_SCALES[activeZoom.depth] ?? 1.5) : 1
    const targetFX = activeZoom ? activeZoom.focus.cx : 0.5
    const targetFY = activeZoom ? activeZoom.focus.cy : 0.5

    const state = animStateRef.current
    state.scale += (targetScale - state.scale) * SMOOTHING
    state.focusX += (targetFX - state.focusX) * SMOOTHING
    state.focusY += (targetFY - state.focusY) * SMOOTHING

    ctx.save()

    // --- Shadow (drawn before clip) ---
    if (shadow > 0 && video.readyState >= 2) {
      ctx.shadowColor = `rgba(0,0,0,${Math.min(shadow * 0.85, 0.85)})`
      ctx.shadowBlur = shadow * 50
      ctx.shadowOffsetY = shadow * 10
      // Draw a rect just for shadow
      ctx.beginPath()
      ctx.roundRect(drawX, drawY, drawW, drawH, radius)
      ctx.fillStyle = 'rgba(0,0,0,0.01)'
      ctx.fill()
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
    }

    // --- Clip to rounded rect ---
    ctx.beginPath()
    ctx.roundRect(drawX, drawY, drawW, drawH, radius)
    ctx.clip()

    // --- Zoom transform ---
    if (state.scale !== 1) {
      const pivotX = drawX + drawW * state.focusX
      const pivotY = drawY + drawH * state.focusY
      ctx.translate(pivotX, pivotY)
      ctx.scale(state.scale, state.scale)
      ctx.translate(-pivotX, -pivotY)
    }

    // --- Draw video frame ---
    if (video.readyState >= 2) {
      ctx.drawImage(video, drawX, drawY, drawW, drawH)
    } else {
      // Placeholder while video loads
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fillRect(drawX, drawY, drawW, drawH)
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.font = `${Math.round(drawH * 0.05)}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Loading video...', drawX + drawW / 2, drawY + drawH / 2)
    }

    ctx.restore()

    // --- Zoom focus indicator ---
    if (selectedZoomIdRef.current) {
      const selZoom = zoomRegionsRef.current?.find(r => r.id === selectedZoomIdRef.current)
      if (selZoom) {
        const fx = drawX + drawW * selZoom.focus.cx
        const fy = drawY + drawH * selZoom.focus.cy
        const r2 = 16
        ctx.save()
        ctx.strokeStyle = 'rgba(52,178,123,0.9)'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.arc(fx, fy, r2, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = 'rgba(52,178,123,0.2)'
        ctx.fill()
        ctx.restore()
      }
    }
  }, [videoRef])

  useEffect(() => {
    const tick = () => {
      drawFrame()
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [drawFrame])

  // Handle trim skip
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleTime = () => {
      const timeMs = video.currentTime * 1000
      const inTrim = trimRegionsRef.current?.find(r => timeMs >= r.startMs && timeMs <= r.endMs)
      if (inTrim) {
        video.currentTime = inTrim.endMs / 1000
      }
      onTimeUpdate?.()
    }
    video.addEventListener('timeupdate', handleTime)
    return () => video.removeEventListener('timeupdate', handleTime)
  }, [onTimeUpdate, videoRef])

  const handleCanvasClick = useCallback((e) => {
    const zoomId = selectedZoomIdRef.current
    if (!zoomId) return
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const rect = canvas.getBoundingClientRect()
    const W = rect.width
    const H = rect.height
    const pad = (paddingRef.current / 100) * Math.min(W, H) * 0.45
    const vw = video.videoWidth || 16
    const vh = video.videoHeight || 9
    const aspect = vw / vh

    let drawW = W - pad * 2
    let drawH = drawW / aspect
    if (drawH > H - pad * 2) {
      drawH = H - pad * 2
      drawW = drawH * aspect
    }
    const drawX = (W - drawW) / 2
    const drawY = (H - drawH) / 2

    const localX = e.clientX - rect.left
    const localY = e.clientY - rect.top
    const cx = Math.max(0, Math.min(1, (localX - drawX) / drawW))
    const cy = Math.max(0, Math.min(1, (localY - drawY) / drawH))
    onZoomFocusChange?.(zoomId, { cx, cy })
  }, [onZoomFocusChange, videoRef])

  // Compute CSS aspect-ratio string for the canvas container
  const forcedAR = aspectRatio
  const arStyle = (forcedAR && forcedAR !== 'auto')
    ? { aspectRatio: String(forcedAR) }
    : {}

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        ref={containerRef}
        className="relative"
        style={{
          ...arStyle,
          maxWidth: '100%',
          maxHeight: '100%',
          width: (forcedAR && forcedAR !== 'auto') ? 'auto' : '100%',
          height: (forcedAR && forcedAR !== 'auto') ? '100%' : '100%',
        }}
      >
        <canvas
          ref={canvasRef}
          className={cn('w-full h-full block', selectedZoomId ? 'cursor-crosshair' : 'cursor-default')}
          onClick={handleCanvasClick}
        />
      </div>
      <video
        ref={videoRef}
        src={videoUrl}
        className="hidden"
        preload="auto"
        playsInline
        onLoadedMetadata={onLoadedMetadata}
        onPlay={onPlay}
        onPause={onPause}
        onError={() => console.error('Video load error')}
      />
    </div>
  )
}

function parseGradientToStyle(ctx, gradient, W, H) {
  try {
    const stops = gradient.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g) || []
    if (stops.length === 0) return null
    if (gradient.startsWith('linear-gradient')) {
      const grad = ctx.createLinearGradient(0, 0, W, H)
      stops.forEach((color, i) => grad.addColorStop(i / Math.max(stops.length - 1, 1), color))
      return grad
    }
    if (gradient.startsWith('radial-gradient')) {
      const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7)
      stops.forEach((color, i) => grad.addColorStop(i / Math.max(stops.length - 1, 1), color))
      return grad
    }
  } catch {
    return null
  }
  return null
}
