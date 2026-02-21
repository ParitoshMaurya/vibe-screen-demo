import { useState, useRef, useCallback, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import VideoPreview from './VideoPreview'
import Timeline from './Timeline'
import SettingsPanel from './SettingsPanel'
import ExportDialog from './ExportDialog'
import PlaybackControls from './PlaybackControls'
import { ArrowLeft, Video, Download } from 'lucide-react'

const GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  'linear-gradient(135deg, #141e30, #243b55)',
  'linear-gradient(135deg, #200122, #6f0000)',
  'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  'linear-gradient(135deg, #1d2b64, #f8cdda)',
  'linear-gradient(135deg, #11998e, #38ef7d)',
  'linear-gradient(135deg, #fc4a1a, #f7b733)',
  'linear-gradient(135deg, #8e2de2, #4a00e0)',
  'linear-gradient(135deg, #f953c6, #b91d73)',
  'linear-gradient(135deg, #43cea2, #185a9d)',
  'linear-gradient(135deg, #f7971e, #ffd200)',
  '#1a1a1a',
  '#0d1117',
  '#0a0a0a',
  '#1e1b4b',
  '#14532d',
  '#450a0a',
]

export default function VideoEditor({ videoData, onBack }) {
  const { url: videoUrl } = videoData

  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [background, setBackground] = useState(GRADIENTS[0])
  const [padding, setPadding] = useState(40)
  const [borderRadius, setBorderRadius] = useState(12)
  const [shadowIntensity, setShadowIntensity] = useState(0.5)

  const [zoomRegions, setZoomRegions] = useState([])
  const [trimRegions, setTrimRegions] = useState([])
  const [speedRegions, setSpeedRegions] = useState([])
  const [selectedRegionId, setSelectedRegionId] = useState(null)
  const [selectedRegionType, setSelectedRegionType] = useState(null)

  const [showExport, setShowExport] = useState(false)
  const [exportProgress, setExportProgress] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState(null)

  const nextIdRef = useRef(1)

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

    try {
      // --- Phase 1: Canvas-capture approach for background compositing ---
      setExportProgress({ phase: 'preparing', percent: 10 })

      const ZOOM_SCALES_MAP = { 1: 1.25, 2: 1.5, 3: 1.8, 4: 2.2, 5: 3.5, 6: 5.0 }
      const FPS = 30
      const vw = video.videoWidth || 1280
      const vh = video.videoHeight || 720
      const aspect = vw / vh
      const OUT_W = Math.min(vw, 1920)
      const OUT_H = Math.round(OUT_W / aspect)

      // Build sorted trim keep-segments
      const sortedTrims = [...trimRegions].sort((a, b) => a.startMs - b.startMs)
      const keepSegments = []
      let prev = 0
      for (const t of sortedTrims) {
        if (prev < t.startMs / 1000) keepSegments.push([prev, t.startMs / 1000])
        prev = t.endMs / 1000
      }
      if (prev < duration) keepSegments.push([prev, duration])
      const segments = keepSegments.length > 0 ? keepSegments : [[0, duration]]

      // Preload background image if needed
      let bgImg = null
      const isImgBg = background && (background.startsWith('data:') || background.startsWith('http') || background.startsWith('/'))
      if (isImgBg) {
        bgImg = await new Promise((resolve) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          img.src = background
        })
      }

      // Offscreen canvas for compositing
      const offCanvas = document.createElement('canvas')
      offCanvas.width = OUT_W
      offCanvas.height = OUT_H
      const ctx = offCanvas.getContext('2d')

      const stream = offCanvas.captureStream(FPS)

      // Capture audio from video element if available
      let audioTrack = null
      try {
        if (video.captureStream) {
          const vs = video.captureStream()
          const at = vs.getAudioTracks()[0]
          if (at) { audioTrack = at; stream.addTrack(at) }
        }
      } catch { /* no audio */ }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'

      const chunks = []
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
      recorder.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data) }

      recorder.start(100)

      const pad = (padding / 100) * Math.min(OUT_W, OUT_H) * 0.45
      let drawW = OUT_W - pad * 2
      let drawH = drawW / aspect
      if (drawH > OUT_H - pad * 2) { drawH = OUT_H - pad * 2; drawW = drawH * aspect }
      const drawX = (OUT_W - drawW) / 2
      const drawY = (OUT_H - drawH) / 2

      const totalFrames = segments.reduce((acc, [s, e]) => acc + Math.round((e - s) * FPS), 0)
      let framesRendered = 0
      let animScale = 1, animFX = 0.5, animFY = 0.5

      const drawBg = () => {
        if (bgImg) {
          ctx.drawImage(bgImg, 0, 0, OUT_W, OUT_H)
        } else {
          const isGrad = background && (background.startsWith('linear-gradient') || background.startsWith('radial-gradient'))
          if (isGrad) {
            try {
              const stops = background.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g) || []
              let grad
              if (background.startsWith('linear-gradient')) {
                grad = ctx.createLinearGradient(0, 0, OUT_W, OUT_H)
              } else {
                grad = ctx.createRadialGradient(OUT_W/2, OUT_H/2, 0, OUT_W/2, OUT_H/2, Math.max(OUT_W, OUT_H)*0.7)
              }
              stops.forEach((c, i) => grad.addColorStop(i / Math.max(stops.length - 1, 1), c))
              ctx.fillStyle = grad
            } catch { ctx.fillStyle = '#1a1a2e' }
          } else {
            ctx.fillStyle = background || '#1a1a2e'
          }
          ctx.fillRect(0, 0, OUT_W, OUT_H)
        }
      }

      for (const [segStart, segEnd] of segments) {
        video.currentTime = segStart
        await new Promise(r => { video.onseeked = r })

        const segFrames = Math.round((segEnd - segStart) * FPS)
        for (let f = 0; f < segFrames; f++) {
          const t = segStart + f / FPS
          video.currentTime = t
          await new Promise(r => { video.onseeked = r })

          const timeMs = t * 1000
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
          if (animScale !== 1) {
            const px = drawX + drawW * animFX, py = drawY + drawH * animFY
            ctx.translate(px, py); ctx.scale(animScale, animScale); ctx.translate(-px, -py)
          }
          ctx.drawImage(video, drawX, drawY, drawW, drawH)
          ctx.restore()

          framesRendered++
          const pct = 10 + Math.round((framesRendered / totalFrames) * 75)
          setExportProgress({ phase: 'encoding', percent: pct })

          // Throttle to allow canvas stream to capture frames
          await new Promise(r => setTimeout(r, 1000 / FPS))
        }
      }

      recorder.stop()
      if (audioTrack) audioTrack.stop()

      await new Promise(r => recorder.onstop = r)
      setExportProgress({ phase: 'finalizing', percent: 90 })

      const webmBlob = new Blob(chunks, { type: mimeType })

      // --- Phase 2: Re-encode to MP4 with ffmpeg.wasm ---
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { fetchFile, toBlobURL } = await import('@ffmpeg/util')
      const ffmpeg = new FFmpeg()
      ffmpeg.on('progress', ({ progress }) => {
        setExportProgress({ phase: 'finalizing', percent: 90 + Math.round(progress * 9) })
      })
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      await ffmpeg.writeFile('composed.webm', await fetchFile(webmBlob))
      await ffmpeg.exec(['-i', 'composed.webm', '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-movflags', '+faststart', 'output.mp4'])

      const data = await ffmpeg.readFile('output.mp4')
      const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' })
      const url = URL.createObjectURL(mp4Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vibe-screendemo-${Date.now()}.mp4`
      a.click()
      URL.revokeObjectURL(url)

      setExportProgress({ phase: 'done', percent: 100 })
      toast.success('Video exported!')
      setTimeout(() => setShowExport(false), 2000)
    } catch (err) {
      console.error('Export failed:', err)
      const msg = err?.message || 'Export failed'
      setExportError(msg)
      toast.error('Export failed: ' + msg)
    } finally {
      setIsExporting(false)
      // Restore video position
      if (video) video.currentTime = 0
    }
  }, [videoRef, videoUrl, videoData, trimRegions, zoomRegions, duration, background, padding, borderRadius, shadowIntensity])

  return (
    <div className="flex flex-col h-screen bg-[#080809] text-slate-200 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top Bar */}
      <div className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#080809]/95 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#34B27B] flex items-center justify-center shadow-md shadow-[#34B27B]/30">
              <Video className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">Vibe ScreenDemo</span>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#34B27B] hover:bg-[#2d9e6c] text-white text-xs font-semibold transition-all shadow-lg shadow-[#34B27B]/20 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          Export MP4
        </button>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex min-h-0 p-3 gap-3">
        {/* Left: Video + Timeline */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Video Preview */}
          <div className="flex-1 min-h-0 rounded-2xl border border-white/[0.06] bg-black/20 overflow-hidden flex items-center justify-center">
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
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handlePlayStateChange}
              onPause={handlePlayStateChange}
              onZoomFocusChange={handleZoomFocusChange}
              selectedZoomId={selectedRegionType === 'zoom' ? selectedRegionId : null}
              onSelectZoom={(id) => handleSelectRegion(id, 'zoom')}
            />
          </div>

          {/* Playback Controls */}
          <div className="flex-shrink-0">
            <PlaybackControls
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onTogglePlayPause={togglePlayPause}
              onSeek={handleSeek}
            />
          </div>

          {/* Timeline */}
          <div className="flex-shrink-0 h-52 rounded-2xl border border-white/[0.06] bg-[#0c0c0e] overflow-hidden">
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
        </div>

        {/* Right: Settings Panel */}
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
            selectedZoom={selectedZoom}
            onZoomDepthChange={(depth) => selectedZoom && handleZoomDepthChange(selectedZoom.id, depth)}
            onZoomDelete={() => selectedZoom && handleDeleteRegion(selectedZoom.id, 'zoom')}
            selectedTrim={selectedTrim}
            onTrimDelete={() => selectedTrim && handleDeleteRegion(selectedTrim.id, 'trim')}
            selectedSpeed={selectedSpeed}
            onSpeedChange={(speed) => selectedSpeed && handleSpeedChange(selectedSpeed.id, speed)}
            onSpeedDelete={() => selectedSpeed && handleDeleteRegion(selectedSpeed.id, 'speed')}
            onExport={handleExport}
          />
        </div>
      </div>

      <Toaster theme="dark" position="bottom-right" />

      <ExportDialog
        isOpen={showExport}
        onClose={() => !isExporting && setShowExport(false)}
        progress={exportProgress}
        isExporting={isExporting}
        error={exportError}
        onCancel={() => setShowExport(false)}
      />
    </div>
  )
}
