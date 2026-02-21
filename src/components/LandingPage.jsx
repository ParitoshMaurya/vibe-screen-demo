import { useRef, useCallback, useState } from 'react'
import { Monitor, Upload, Zap, Layers, Scissors, Clock, Download, Video, Circle } from 'lucide-react'
import { useScreenRecorder } from '@/hooks/useScreenRecorder'
import { cn } from '@/lib/utils'

const features = [
  { icon: Monitor, label: 'Screen Record', desc: 'Capture any window or tab' },
  { icon: Layers, label: 'Backgrounds', desc: 'Gradients, colors, images' },
  { icon: Zap, label: 'Smooth Zoom', desc: 'Cinematic zoom regions' },
  { icon: Clock, label: 'Speed Control', desc: 'Per-segment speed changes' },
  { icon: Scissors, label: 'Trim & Cut', desc: 'Remove unwanted parts' },
  { icon: Download, label: 'Export MP4', desc: 'Full quality output' },
]

export default function LandingPage({ onVideoReady }) {
  const fileInputRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleRecordingComplete = useCallback(({ url, blob, mimeType }) => {
    onVideoReady({ url, blob, mimeType, source: 'recording' })
  }, [onVideoReady])

  const { recording, toggleRecording } = useScreenRecorder({
    onRecordingComplete: handleRecordingComplete,
  })

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onVideoReady({ url, blob: file, mimeType: file.type, source: 'upload' })
    e.target.value = ''
  }, [onVideoReady])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('video/')) return
    const url = URL.createObjectURL(file)
    onVideoReady({ url, blob: file, mimeType: file.type, source: 'upload' })
  }, [onVideoReady])

  return (
    <div className="min-h-screen bg-[#080809] flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(52,178,123,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 110%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 50% 50%, rgba(52,178,123,0.03) 0%, transparent 70%)'
        }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-[#34B27B] flex items-center justify-center shadow-lg shadow-[#34B27B]/40">
              <Video className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#34B27B] border-2 border-[#080809]" />
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-tight">Vibe ScreenDemo</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-xs text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34B27B]" />
          Desktop optimized
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#34B27B]/8 border border-[#34B27B]/20 text-[#34B27B] text-xs font-medium mb-8 backdrop-blur-sm">
          <Zap className="w-3 h-3 fill-[#34B27B]" />
          Screen recorder + video editor — all in your browser
        </div>

        {/* Headline */}
        <h1 className="text-center font-bold text-white mb-5 leading-[1.08] tracking-[-0.03em]" style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)' }}>
          Record. Edit.{' '}
          <span style={{
            background: 'linear-gradient(135deg, #34B27B 0%, #5eead4 50%, #34B27B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Vibe.
          </span>
        </h1>

        <p className="text-center text-slate-400 max-w-lg mx-auto mb-12 leading-relaxed" style={{ fontSize: '1.05rem' }}>
          Capture your screen, add cinematic backgrounds, zoom into key moments,
          trim the boring parts — export a polished demo video.
        </p>

        {/* CTA Cards */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl mb-14">
          {/* Record */}
          <button
            onClick={toggleRecording}
            className={cn(
              'flex-1 group relative flex flex-col items-center gap-4 p-7 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden text-left',
              recording
                ? 'bg-red-500/8 border-red-500/35 shadow-xl shadow-red-500/10'
                : 'bg-white/[0.025] border-white/8 hover:border-[#34B27B]/35 hover:bg-[#34B27B]/4 hover:shadow-xl hover:shadow-[#34B27B]/8'
            )}
          >
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 self-start',
              recording ? 'bg-red-500/15' : 'bg-white/5 group-hover:bg-[#34B27B]/12 group-hover:scale-105'
            )}>
              {recording
                ? <Circle className="w-6 h-6 text-red-400 fill-red-400 animate-pulse" />
                : <Monitor className="w-6 h-6 text-slate-400 group-hover:text-[#34B27B] transition-colors" />
              }
            </div>
            <div>
              <div className={cn('font-semibold text-sm mb-1', recording ? 'text-red-400' : 'text-white')}>
                {recording ? 'Recording — click to stop' : 'Record Screen'}
              </div>
              <div className="text-xs text-slate-500 leading-relaxed">
                {recording ? 'Your screen is being captured' : 'Capture any window, tab, or full screen'}
              </div>
            </div>
          </button>

          {/* Upload */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex-1 group relative flex flex-col items-center gap-4 p-7 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden',
              isDragOver
                ? 'bg-violet-500/8 border-violet-400/50 shadow-xl shadow-violet-500/10'
                : 'bg-white/[0.025] border-white/8 hover:border-violet-500/35 hover:bg-violet-500/4 hover:shadow-xl hover:shadow-violet-500/8'
            )}
          >
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 self-start',
              isDragOver ? 'bg-violet-500/15 scale-105' : 'bg-white/5 group-hover:bg-violet-500/12 group-hover:scale-105'
            )}>
              <Upload className={cn('w-6 h-6 transition-colors', isDragOver ? 'text-violet-400' : 'text-slate-400 group-hover:text-violet-400')} />
            </div>
            <div>
              <div className="font-semibold text-sm text-white mb-1">Upload Video</div>
              <div className="text-xs text-slate-500 leading-relaxed">
                {isDragOver ? 'Drop it!' : 'Drop a video file or click to browse'}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
          {features.map(({ icon: FIcon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
            >
              <FIcon className="w-3.5 h-3.5 text-[#34B27B]" />
              <span className="text-xs text-slate-400 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4 text-[11px] text-slate-700">
        Vibe ScreenDemo · Works best on desktop Chrome / Edge · No data leaves your browser
      </footer>
    </div>
  )
}
