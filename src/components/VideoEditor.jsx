import { useState, useRef, useCallback, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import VideoPreview from './VideoPreview'
import Timeline from './Timeline'
import SettingsPanel from './SettingsPanel'
import ExportDialog from './ExportDialog'
import PlaybackControls, { PlayButton, FullPlaybackControls } from './PlaybackControls'
import { ArrowLeft, Expand, Shrink } from 'lucide-react'
import { WALLPAPERS } from '../lib/config'

const QUALITY_PRESETS = {
  low:    { label: 'Low',    maxW: 1280, fps: 24, bitrate: 4_000_000,  desc: '720p · 24fps · 4 Mbps' },
  medium: { label: 'Medium', maxW: 1920, fps: 30, bitrate: 8_000_000,  desc: '1080p · 30fps · 8 Mbps' },
  high:   { label: 'High',   maxW: 1920, fps: 30, bitrate: 16_000_000, desc: '1080p · 30fps · 16 Mbps' },
  ultra:  { label: 'Ultra',  maxW: 3840, fps: 60, bitrate: 32_000_000, desc: '4K · 60fps · 32 Mbps' },
}

export default function VideoEditor({ videoData, onBack }) {
  const { url: videoUrl } = videoData

  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [background, setBackground] = useState(WALLPAPERS[0])
  const [padding, setPadding] = useState(10)
  const [borderRadius, setBorderRadius] = useState(10)
  const [shadowIntensity, setShadowIntensity] = useState(0.5)

  const [zoomRegions, setZoomRegions] = useState([])
  const [trimRegions, setTrimRegions] = useState([])
  const [speedRegions, setSpeedRegions] = useState([])
  const [selectedRegionId, setSelectedRegionId] = useState(null)
  const [selectedRegionType, setSelectedRegionType] = useState(null)

  const [aspectRatio, setAspectRatio] = useState(16 / 9)
  const [isPreview, setIsPreview] = useState(false)

  const [showExport, setShowExport] = useState(false)
  const [exportProgress, setExportProgress] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [exportQuality, setExportQuality] = useState('high')
  const cancelExportRef = useRef(false)

  const nextIdRef = useRef(1)

  // Warn before page unload (refresh / close tab)
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // Confirm before navigating back
  const handleBack = useCallback(() => {
    if (window.confirm('Leave editor? Any unsaved work will be lost. Make sure to export your video first.')) {
      onBack()
    }
  }, [onBack])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)

    const timeMs = video.currentTime * 1000
    const activeSpeed = speedRegions.find(r => timeMs >= r.startMs && timeMs <= r.endMs)
    if (activeSpeed && video.playbackRate !== activeSpeed.speed) {
      video.playbackRate = activeSpeed.speed
    } else if (!activeSpeed && video.playbackRate !== 1) {
      video.playbackRate = 1
    }
  }, [speedRegions])

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration)
    setCurrentTime(0)
  }, [])

  const handlePlayStateChange = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setIsPlaying(!video.paused)
  }, [])

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(console.error)
    } else {
      video.pause()
    }
  }, [])

  const handleSeek = useCallback((time) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = time
    setCurrentTime(time)
  }, [])

  const handleAddZoom = useCallback((span) => {
    const id = `zoom-${nextIdRef.current++}`
    setZoomRegions(prev => [...prev, {
      id,
      startMs: Math.round(span.start),
      endMs: Math.round(span.end),
      depth: 2,
      focus: { cx: 0.5, cy: 0.5 },
    }])
    setSelectedRegionId(id)
    setSelectedRegionType('zoom')
  }, [])

  const handleAddTrim = useCallback((span) => {
    const id = `trim-${nextIdRef.current++}`
    setTrimRegions(prev => [...prev, {
      id,
      startMs: Math.round(span.start),
      endMs: Math.round(span.end),
    }])
    setSelectedRegionId(id)
    setSelectedRegionType('trim')
  }, [])

  const handleAddSpeed = useCallback((span) => {
    const id = `speed-${nextIdRef.current++}`
    setSpeedRegions(prev => [...prev, {
      id,
      startMs: Math.round(span.start),
      endMs: Math.round(span.end),
      speed: 2,
    }])
    setSelectedRegionId(id)
    setSelectedRegionType('speed')
  }, [])

  const handleZoomSpanChange = useCallback((id, span) => {
    setZoomRegions(prev => prev.map(r => r.id === id ? { ...r, startMs: Math.round(span.start), endMs: Math.round(span.end) } : r))
  }, [])

  const handleTrimSpanChange = useCallback((id, span) => {
    setTrimRegions(prev => prev.map(r => r.id === id ? { ...r, startMs: Math.round(span.start), endMs: Math.round(span.end) } : r))
  }, [])

  const handleSpeedSpanChange = useCallback((id, span) => {
    setSpeedRegions(prev => prev.map(r => r.id === id ? { ...r, startMs: Math.round(span.start), endMs: Math.round(span.end) } : r))
  }, [])

  const handleDeleteRegion = useCallback((id, type) => {
    if (type === 'zoom') setZoomRegions(prev => prev.filter(r => r.id !== id))
    else if (type === 'trim') setTrimRegions(prev => prev.filter(r => r.id !== id))
    else if (type === 'speed') setSpeedRegions(prev => prev.filter(r => r.id !== id))
    if (selectedRegionId === id) {
      setSelectedRegionId(null)
      setSelectedRegionType(null)
    }
  }, [selectedRegionId])

  const handleZoomDepthChange = useCallback((id, depth) => {
    setZoomRegions(prev => prev.map(r => r.id === id ? { ...r, depth } : r))
  }, [])

  const handleZoomFocusChange = useCallback((id, focus) => {
    setZoomRegions(prev => prev.map(r => r.id === id ? { ...r, focus } : r))
  }, [])

  const handleSpeedChange = useCallback((id, speed) => {
    setSpeedRegions(prev => prev.map(r => r.id === id ? { ...r, speed } : r))
  }, [])

  const handleSelectRegion = useCallback((id, type) => {
    setSelectedRegionId(id)
    setSelectedRegionType(type)
  }, [])

  const selectedZoom = selectedRegionType === 'zoom' ? zoomRegions.find(r => r.id === selectedRegionId) : null
  const selectedTrim = selectedRegionType === 'trim' ? trimRegions.find(r => r.id === selectedRegionId) : null
  const selectedSpeed = selectedRegionType === 'speed' ? speedRegions.find(r => r.id === selectedRegionId) : null

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlayPause()
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRegionId && selectedRegionType) {
        e.preventDefault()
        handleDeleteRegion(selectedRegionId, selectedRegionType)
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handleSeek(Math.max(0, (videoRef.current?.currentTime ?? 0) - (e.shiftKey ? 5 : 1)))
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        const dur = videoRef.current?.duration ?? 0
        handleSeek(Math.min(dur, (videoRef.current?.currentTime ?? 0) + (e.shiftKey ? 5 : 1)))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [togglePlayPause, handleDeleteRegion, handleSeek, selectedRegionId, selectedRegionType, videoRef])

  const handleExport = useCallback(async () => {
    setShowExport(true)
    setIsExporting(true)
    setExportError(null)
    setExportProgress({ phase: 'preparing', percent: 5 })

    const video = videoRef.current
    if (!video) {
      setExportError('No video loaded')
      setIsExporting(false)
      return
    }

    const wasPlaying = !video.paused
    video.pause()

    let onVisibilityChange = null
    let audioCtx = null
    try {
      const ZOOM_SCALES_MAP = { 1: 1.25, 2: 1.5, 3: 1.8, 4: 2.2, 5: 3.5, 6: 5.0 }
      const qp = QUALITY_PRESETS[exportQuality] || QUALITY_PRESETS.high
      const FPS = qp.fps
      const vw = video.videoWidth || 1280
      const vh = video.videoHeight || 720
      const naturalAspect = vw / vh
      const forcedAR = aspectRatio !== 'auto' ? aspectRatio : null
      const outAspect = forcedAR ?? naturalAspect
      const OUT_W = Math.min(vw, qp.maxW)
      const OUT_H = Math.round(OUT_W / outAspect)

      // Build trim keep-segments
      const sortedTrims = [...trimRegions].sort((a, b) => a.startMs - b.startMs)
      const keepSegments = []
      let prev = 0
      for (const t of sortedTrims) {
        if (prev < t.startMs / 1000) keepSegments.push([prev, t.startMs / 1000])
        prev = t.endMs / 1000
      }
      if (prev < duration) keepSegments.push([prev, duration])
      const segments = keepSegments.length > 0 ? keepSegments : [[0, duration]]

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm'

      // Compute padded video draw rect (letterboxed at natural ratio)
      const pad = (padding / 100) * Math.min(OUT_W, OUT_H) * 0.45
      let drawW = OUT_W - pad * 2
      let drawH = drawW / naturalAspect
      if (drawH > OUT_H - pad * 2) { drawH = OUT_H - pad * 2; drawW = drawH * naturalAspect }
      const drawX = (OUT_W - drawW) / 2
      const drawY = (OUT_H - drawH) / 2

      // Preload background image
      let bgImg = null
      let bgSrc = background
      const urlMatch = bgSrc && bgSrc.match(/^url\((.+)\)$/)
      if (urlMatch) bgSrc = urlMatch[1]
      const isImgBg = bgSrc && (bgSrc.startsWith('data:') || bgSrc.startsWith('http') || bgSrc.startsWith('/'))
      if (isImgBg) {
        bgImg = await new Promise((resolve) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          img.src = bgSrc
        })
      }

      // Main-thread HTMLCanvasElement — reliable captureStream + compositing
      const offCanvas = document.createElement('canvas')
      offCanvas.width = OUT_W
      offCanvas.height = OUT_H
      const ctx = offCanvas.getContext('2d')
      const canvasStream = offCanvas.captureStream(FPS)

      // Extract original video audio and mix into the recording stream
      try {
        audioCtx = new AudioContext()
        const src = audioCtx.createMediaElementSource(video)
        const dest = audioCtx.createMediaStreamDestination()
        src.connect(dest)
        // Do NOT connect to audioCtx.destination — keeps audio silent to user during export
        dest.stream.getAudioTracks().forEach(t => canvasStream.addTrack(t))
      } catch {
        // Video has no audio or AudioContext unavailable — proceed with video only
      }

      const stream = canvasStream
      const chunks = []
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: qp.bitrate })
      recorder.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data) }
      recorder.start(100)

      const drawBg = () => {
        if (bgImg) {
          ctx.drawImage(bgImg, 0, 0, OUT_W, OUT_H)
          return
        }
        const bg = background
        const isGrad = bg && (bg.startsWith('linear-gradient') || bg.startsWith('radial-gradient'))
        if (isGrad) {
          try {
            const stops = bg.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g) || []
            let grad
            if (bg.startsWith('linear-gradient')) {
              grad = ctx.createLinearGradient(0, 0, OUT_W, OUT_H)
            } else {
              grad = ctx.createRadialGradient(OUT_W / 2, OUT_H / 2, 0, OUT_W / 2, OUT_H / 2, Math.max(OUT_W, OUT_H) * 0.7)
            }
            stops.forEach((c, i) => grad.addColorStop(i / Math.max(stops.length - 1, 1), c))
            ctx.fillStyle = grad
          } catch { ctx.fillStyle = '#1a1a2e' }
        } else {
          ctx.fillStyle = bg || '#1a1a2e'
        }
        ctx.fillRect(0, 0, OUT_W, OUT_H)
      }

      const seekTo = (t) => new Promise((resolve) => {
        const onSeeked = () => { video.removeEventListener('seeked', onSeeked); resolve() }
        const timeout = setTimeout(() => { video.removeEventListener('seeked', onSeeked); resolve() }, 1000)
        video.addEventListener('seeked', () => { clearTimeout(timeout); onSeeked() }, { once: true })
        video.currentTime = t
      })

      const totalDuration = segments.reduce((acc, [s, e]) => acc + (e - s), 0)
      let animScale = 1, animFX = 0.5, animFY = 0.5

      // Warn if user hides the tab (RAF stops, recording freezes)
      onVisibilityChange = () => {
        if (document.hidden) toast.warning('Keep this tab active during export!', { id: 'export-tab-warn' })
      }
      document.addEventListener('visibilitychange', onVisibilityChange)

      setExportProgress({ phase: 'encoding', percent: 10 })

      const drawCompositeFrame = () => {
        const timeMs = video.currentTime * 1000
        const activeZoom = zoomRegions.find(r => timeMs >= r.startMs && timeMs <= r.endMs) ?? null
        const targetScale = activeZoom ? (ZOOM_SCALES_MAP[activeZoom.depth] ?? 1.5) : 1
        const targetFX = activeZoom ? activeZoom.focus.cx : 0.5
        const targetFY = activeZoom ? activeZoom.focus.cy : 0.5
        animScale += (targetScale - animScale) * 0.15
        animFX += (targetFX - animFX) * 0.15
        animFY += (targetFY - animFY) * 0.15

        ctx.clearRect(0, 0, OUT_W, OUT_H)
        drawBg()

        ctx.save()
        if (shadowIntensity > 0) {
          ctx.shadowColor = `rgba(0,0,0,${Math.min(shadowIntensity * 0.85, 0.85)})`
          ctx.shadowBlur = shadowIntensity * 50
          ctx.shadowOffsetY = shadowIntensity * 10
          ctx.beginPath(); ctx.roundRect(drawX, drawY, drawW, drawH, borderRadius)
          ctx.fillStyle = 'rgba(0,0,0,0.01)'; ctx.fill()
          ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
        }
        ctx.beginPath(); ctx.roundRect(drawX, drawY, drawW, drawH, borderRadius); ctx.clip()
        if (animScale > 1.001) {
          const px = drawX + drawW * animFX, py = drawY + drawH * animFY
          ctx.translate(px, py); ctx.scale(animScale, animScale); ctx.translate(-px, -py)
        }
        ctx.drawImage(video, drawX, drawY, drawW, drawH)
        ctx.restore()
      }

      // Real-time playback recording — play each segment, composite via RAF
      // Speed regions are honoured via video.playbackRate per segment
      let segIdx = 0
      for (const [segStart, segEnd] of segments) {
        if (cancelExportRef.current) break

        // Compute dominant speed for this segment (use first overlapping speed region)
        const segMidMs = ((segStart + segEnd) / 2) * 1000
        const activeSpeed = speedRegions.find(r => segMidMs >= r.startMs && segMidMs <= r.endMs)
        const playbackRate = activeSpeed ? activeSpeed.speed : 1

        const priorDuration = segments.slice(0, segIdx).reduce((a, [s, e]) => a + (e - s), 0)
        segIdx++

        await seekTo(segStart)
        if (cancelExportRef.current) break

        await new Promise((resolve, reject) => {
          let rafId

          const onTimeUpdate = () => {
            if (cancelExportRef.current) {
              video.pause()
              video.removeEventListener('timeupdate', onTimeUpdate)
              cancelAnimationFrame(rafId)
              resolve()
              return
            }
            const elapsed = video.currentTime - segStart
            const overallElapsed = priorDuration + elapsed
            const pct = 10 + Math.round((overallElapsed / totalDuration) * 85)
            setExportProgress({ phase: 'encoding', percent: Math.min(95, pct) })

            if (video.currentTime >= segEnd - 0.05) {
              video.pause()
              video.playbackRate = 1
              video.removeEventListener('timeupdate', onTimeUpdate)
              cancelAnimationFrame(rafId)
              drawCompositeFrame()
              resolve()
            }
          }

          const rafLoop = () => {
            if (video.paused || video.ended) return
            drawCompositeFrame()
            rafId = requestAnimationFrame(rafLoop)
          }

          const onVideoError = (e) => { cancelAnimationFrame(rafId); reject(e) }

          video.addEventListener('timeupdate', onTimeUpdate)
          video.addEventListener('error', onVideoError, { once: true })

          video.playbackRate = playbackRate
          video.play().then(() => {
            rafId = requestAnimationFrame(rafLoop)
          }).catch(reject)
        })
      }

      document.removeEventListener('visibilitychange', onVisibilityChange)

      if (cancelExportRef.current) {
        cancelExportRef.current = false
        recorder.stop()
        setExportError('Export cancelled')
        setIsExporting(false)
        return
      }

      setExportProgress({ phase: 'finalizing', percent: 96 })

      recorder.stop()
      await new Promise(r => { recorder.onstop = r })

      // Fix WebM duration metadata (MediaRecorder omits it)
      const rawBlob = new Blob(chunks, { type: mimeType })
      const { default: fixWebmDuration } = await import('fix-webm-duration')
      const totalDurationMs = segments.reduce((acc, [s, e]) => acc + (e - s) * 1000, 0)
      const fixedBlob = await fixWebmDuration(rawBlob, totalDurationMs, { logger: false })

      setExportProgress({ phase: 'finalizing', percent: 98 })

      // Remux WebM → MP4 via ffmpeg -c copy (no re-encode, instant)
      // Core served from same-origin public/ffmpeg/ so COOP/COEP headers apply
      try {
        const { FFmpeg } = await import('@ffmpeg/ffmpeg')
        const { fetchFile, toBlobURL } = await import('@ffmpeg/util')
        const base = window.location.origin
        const coreURL = await toBlobURL(`${base}/ffmpeg/ffmpeg-core.js`, 'text/javascript')
        const wasmURL = await toBlobURL(`${base}/ffmpeg/ffmpeg-core.wasm`, 'application/wasm')
        const ff = new FFmpeg()
        await ff.load({ coreURL, wasmURL })
        await ff.writeFile('input.webm', await fetchFile(fixedBlob))
        const ret = await ff.exec(['-i', 'input.webm', '-c', 'copy', 'output.mp4'])
        if (ret === 0) {
          const data = await ff.readFile('output.mp4')
          const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' })
          const url = URL.createObjectURL(mp4Blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `vibe-screendemo-${Date.now()}.mp4`
          a.click()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        } else {
          throw new Error(`ffmpeg exited with code ${ret}`)
        }
      } catch (ffErr) {
        console.warn('MP4 remux failed, falling back to WebM:', ffErr)
        const url = URL.createObjectURL(fixedBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `vibe-screendemo-${Date.now()}.webm`
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }

      setExportProgress({ phase: 'done', percent: 100 })
      toast.success('Video exported!')
      setTimeout(() => setShowExport(false), 2500)
    } catch (err) {
      if (onVisibilityChange) document.removeEventListener('visibilitychange', onVisibilityChange)
      console.error('Export failed:', err)
      setExportError(err?.message || 'Export failed')
      toast.error('Export failed: ' + (err?.message || 'Unknown error'))
    } finally {
      cancelExportRef.current = false
      video.playbackRate = 1
      if (audioCtx) audioCtx.close().catch(() => {})
      setIsExporting(false)
      if (video) { video.currentTime = 0; if (wasPlaying) video.play().catch(() => {}) }
    }
  }, [videoRef, trimRegions, speedRegions, zoomRegions, duration, background, padding, borderRadius, shadowIntensity, aspectRatio, exportQuality])

  return (
    <div className="flex flex-col h-screen bg-[#080809] text-slate-200 overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top-left floating back button (non-preview) */}
      {!isPreview && (
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 z-50 w-8 h-8 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm border border-white/[0.08] text-slate-400 hover:text-white hover:bg-black/70 transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}

      {/* Preview mode exit button */}
      {isPreview && (
        <button
          onClick={() => setIsPreview(false)}
          className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-xl border border-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold transition-all duration-200 cursor-pointer hover:bg-black/80"
        >
          <Shrink className="w-3.5 h-3.5" />
          Exit Preview
        </button>
      )}

      {/* Main layout */}
      <div className={isPreview ? 'flex-1 flex min-h-0' : 'flex-1 flex min-h-0 p-3 gap-3'}>
        {/* Left: Video + Timeline */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Video Preview */}
          <div className={isPreview ? 'relative flex-1 min-h-0 overflow-hidden flex items-center justify-center' : 'relative flex-1 min-h-0 rounded-2xl border border-white/[0.06] bg-black/30 overflow-hidden flex items-center justify-center'}>
            <VideoPreview
              videoRef={videoRef}
              videoUrl={videoUrl}
              background={background}
              padding={padding}
              borderRadius={borderRadius}
              shadowIntensity={shadowIntensity}
              zoomRegions={zoomRegions}
              trimRegions={trimRegions}
              currentTime={currentTime}
              isPlaying={isPlaying}
              isExporting={isExporting}
              aspectRatio={aspectRatio}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handlePlayStateChange}
              onPause={handlePlayStateChange}
              onZoomFocusChange={handleZoomFocusChange}
              selectedZoomId={selectedRegionType === 'zoom' ? selectedRegionId : null}
              onSelectZoom={(id) => handleSelectRegion(id, 'zoom')}
            />
            {/* Floating controls in preview area bottom */}
            {!isPreview && (
              <div className="absolute bottom-3 left-3 z-40 flex items-center gap-2">
                <PlayButton
                  isPlaying={isPlaying}
                  onTogglePlayPause={togglePlayPause}
                />
                <button
                  onClick={() => setIsPreview(true)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm text-slate-300 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer"
                  title="Preview"
                >
                  <Expand className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {/* Floating playback controls in preview mode */}
            {isPreview && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-40">
                <FullPlaybackControls
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  onTogglePlayPause={togglePlayPause}
                  onSeek={handleSeek}
                />
              </div>
            )}
          </div>

          {/* Compact Seek Bar */}
          {!isPreview && (
            <div className="flex-shrink-0">
              <PlaybackControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                onTogglePlayPause={togglePlayPause}
                onSeek={handleSeek}
              />
            </div>
          )}

          {/* Timeline */}
          {!isPreview && (
          <div className="flex-shrink-0 h-52 rounded-2xl border border-white/[0.06] bg-[#0b0b0d] overflow-hidden">
            <Timeline
              duration={duration}
              currentTime={currentTime}
              onSeek={handleSeek}
              zoomRegions={zoomRegions}
              trimRegions={trimRegions}
              speedRegions={speedRegions}
              selectedRegionId={selectedRegionId}
              selectedRegionType={selectedRegionType}
              onSelectRegion={handleSelectRegion}
              onAddZoom={handleAddZoom}
              onAddTrim={handleAddTrim}
              onAddSpeed={handleAddSpeed}
              onZoomSpanChange={handleZoomSpanChange}
              onTrimSpanChange={handleTrimSpanChange}
              onSpeedSpanChange={handleSpeedSpanChange}
              onDeleteRegion={handleDeleteRegion}
            />
          </div>
          )}
        </div>

        {/* Right: Settings Panel */}
        {!isPreview && (
        <div className="w-[280px] flex-shrink-0">
          <SettingsPanel
            background={background}
            onBackgroundChange={setBackground}
            padding={padding}
            onPaddingChange={setPadding}
            borderRadius={borderRadius}
            onBorderRadiusChange={setBorderRadius}
            shadowIntensity={shadowIntensity}
            onShadowChange={setShadowIntensity}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            selectedZoom={selectedZoom}
            onZoomDepthChange={(depth) => selectedZoom && handleZoomDepthChange(selectedZoom.id, depth)}
            onZoomDelete={() => selectedZoom && handleDeleteRegion(selectedZoom.id, 'zoom')}
            selectedTrim={selectedTrim}
            onTrimDelete={() => selectedTrim && handleDeleteRegion(selectedTrim.id, 'trim')}
            selectedSpeed={selectedSpeed}
            onSpeedChange={(speed) => selectedSpeed && handleSpeedChange(selectedSpeed.id, speed)}
            onSpeedDelete={() => selectedSpeed && handleDeleteRegion(selectedSpeed.id, 'speed')}
            onExport={handleExport}
            exportQuality={exportQuality}
            onExportQualityChange={setExportQuality}
            qualityPresets={QUALITY_PRESETS}
          />
        </div>
        )}
      </div>

      <Toaster theme="dark" position="bottom-right" />

      <ExportDialog
        isOpen={showExport}
        onClose={() => !isExporting && setShowExport(false)}
        progress={exportProgress}
        isExporting={isExporting}
        error={exportError}
        onCancel={() => { cancelExportRef.current = true }}
      />
    </div>
  )
}
