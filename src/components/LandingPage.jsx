import { useRef, useCallback, useState, useEffect } from 'react'
import {
  Monitor, Upload, Zap, Layers, Scissors, Clock, Download, Video, Circle,
  Play, ArrowRight, Check, X, Shield, Gauge, Palette, MousePointerClick,
  Github, ChevronDown, Sparkles, Globe, Lock, Heart
} from 'lucide-react'
import { useScreenRecorder } from '@/hooks/useScreenRecorder'
import { cn } from '@/lib/utils'

const FEATURES = [
  {
    icon: Monitor,
    title: 'Screen Recording',
    desc: 'Capture any window, tab, or your entire screen. One click to start, one click to stop.',
    color: '#34B27B',
  },
  {
    icon: Palette,
    title: 'Beautiful Backgrounds',
    desc: 'Gorgeous gradients, solid colors, or custom images. Make every frame look intentional.',
    color: '#818CF8',
  },
  {
    icon: MousePointerClick,
    title: 'Cinematic Zoom',
    desc: 'Add smooth zoom regions that guide viewers to the action. Like Screen Studio — but free.',
    color: '#F59E0B',
  },
  {
    icon: Gauge,
    title: 'Speed Control',
    desc: 'Speed up boring parts, slow down key moments. Per-segment speed control for pacing.',
    color: '#EC4899',
  },
  {
    icon: Scissors,
    title: 'Trim & Cut',
    desc: 'Remove dead air, mistakes, or irrelevant sections. Non-destructive editing.',
    color: '#06B6D4',
  },
  {
    icon: Download,
    title: 'Export to MP4',
    desc: 'Full quality export with ffmpeg. Download a polished video ready to share anywhere.',
    color: '#F97316',
  },
]

const COMPARISON = [
  { feature: 'Screen Recording', us: true, them: true },
  { feature: 'Beautiful Backgrounds', us: true, them: true },
  { feature: 'Zoom Animations', us: true, them: true },
  { feature: 'Trim & Cut', us: true, them: true },
  { feature: 'Speed Control', us: true, them: true },
  { feature: 'MP4 Export', us: true, them: true },
  { feature: 'Works in Browser', us: true, them: false },
  { feature: 'No Install Required', us: true, them: false },
  { feature: 'Data Stays Local', us: true, them: false },
  { feature: 'Open Source', us: true, them: false },
  { feature: 'Price', us: 'Free', them: '$89' },
]

function useInView(ref, options = {}) {
  const [isInView, setIsInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsInView(true); observer.disconnect() } },
      { threshold: 0.15, ...options }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref, options])
  return isInView
}

function Section({ children, className, id }) {
  const ref = useRef(null)
  const isInView = useInView(ref)
  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        'transition-all duration-700',
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </section>
  )
}

export default function LandingPage({ onVideoReady }) {
  const fileInputRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    <div className="min-h-screen bg-[#060608] text-slate-200 overflow-x-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ═══════════ AMBIENT BACKGROUND ═══════════ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(52,178,123,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 50%, rgba(99,102,241,0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(244,63,94,0.03) 0%, transparent 60%)'
        }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-[#060608]/80 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'
      )}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-[#34B27B] flex items-center justify-center shadow-lg shadow-[#34B27B]/30">
                <Video className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <span className="text-white font-bold text-base tracking-tight">Vibe ScreenDemo</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors cursor-pointer">Features</a>
            <a href="#comparison" className="hover:text-white transition-colors cursor-pointer">Compare</a>
            <a href="#start" className="hover:text-white transition-colors cursor-pointer">Get Started</a>
          </div>
          <div className="flex items-center gap-3">
            {/* <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
              aria-label="GitHub"
            >
              <Github className="w-4.5 h-4.5" />
            </a> */}
            <button
              onClick={toggleRecording}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#34B27B] hover:bg-[#2d9e6c] text-white text-sm font-semibold transition-all shadow-lg shadow-[#34B27B]/20 cursor-pointer active:scale-95"
            >
              {recording ? 'Stop Recording' : 'Start Free'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <header className="relative z-10 pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#34B27B]/[0.08] border border-[#34B27B]/20 text-[#34B27B] text-xs font-semibold mb-10 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            100% Free · No signup · No data collection
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-100 mb-6 leading-[1.05] tracking-[-0.035em]" style={{ fontSize: 'clamp(2.5rem, 6.5vw, 5rem)' }}>
            <span className="text-white font-extrabold">Screen Studio quality.</span>
            <br />
            <span
              className="font-extrabold"
              style={{
                background: 'linear-gradient(135deg, #34B27B 0%, #5eead4 40%, #34B27B 70%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Zero dollar price tag.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up delay-200 text-slate-400 max-w-xl mx-auto mb-12 leading-relaxed text-lg">
            Record your screen, add cinematic backgrounds & zoom effects, trim the boring parts — export a polished demo video.
            All in your browser. Nothing to install.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={toggleRecording}
              className={cn(
                'group flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold transition-all duration-300 cursor-pointer active:scale-[0.97]',
                recording
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/25'
                  : 'bg-[#34B27B] hover:bg-[#2d9e6c] text-white shadow-xl shadow-[#34B27B]/25 hover:shadow-[#34B27B]/40'
              )}
            >
              {recording ? (
                <>
                  <Circle className="w-5 h-5 fill-white animate-pulse" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  Record Your Screen
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'group flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold transition-all duration-300 cursor-pointer active:scale-[0.97] border',
                isDragOver
                  ? 'bg-violet-500/10 border-violet-400/50 text-violet-300'
                  : 'bg-white/[0.04] border-white/[0.1] text-slate-300 hover:border-white/[0.2] hover:bg-white/[0.06] hover:text-white'
              )}
            >
              <Upload className="w-5 h-5" />
              {isDragOver ? 'Drop it!' : 'Upload a Video'}
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>

          {/* Trust signals */}
          <div className="animate-fade-up delay-400 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Privacy first</span>
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Works offline</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> No data leaves your browser</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="animate-fade-in delay-800 flex justify-center mt-16">
          <a href="#product-demo" className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-400 transition-colors cursor-pointer">
            <span className="text-[10px] uppercase tracking-widest font-medium">See how it works</span>
            <ChevronDown className="w-4 h-4 animate-float" />
          </a>
        </div>
      </header>

      {/* ═══════════ PRODUCT MOCKUP / DEMO ═══════════ */}
      <Section id="product-demo" className="relative z-10 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0a0a0d] shadow-2xl shadow-black/50">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 bg-[#111114] border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-500 font-mono">
                  vibe-screendemo.app
                </div>
              </div>
            </div>
            {/* Mockup content */}
            <div className="relative aspect-[16/9.5] bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center overflow-hidden">
              {/* Simulated video editor UI */}
              <div className="absolute inset-4 md:inset-8 flex flex-col gap-3">
                {/* Top bar mock */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#34B27B] flex items-center justify-center">
                      <Video className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                    <div className="w-24 h-2.5 rounded bg-white/10" />
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08]">
                      <div className="w-12 h-2 rounded bg-white/15" />
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-[#34B27B]">
                      <div className="w-14 h-2 rounded bg-white/40" />
                    </div>
                  </div>
                </div>

                {/* Main area */}
                <div className="flex-1 flex gap-3 min-h-0">
                  {/* Video preview mock */}
                  <div className="flex-1 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-center overflow-hidden relative">
                    <div className="w-[80%] h-[75%] rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-white/[0.08] shadow-2xl shadow-black/30 flex items-center justify-center">
                      <div className="text-center">
                        <Play className="w-12 h-12 mx-auto text-white/20 mb-2" />
                        <div className="w-28 h-2 rounded bg-white/10 mx-auto" />
                      </div>
                    </div>
                    {/* Zoom indicator */}
                    <div className="absolute top-3 right-3 px-2 py-1 rounded bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[9px] text-[#F59E0B] font-semibold">
                      ZOOM 2×
                    </div>
                  </div>

                  {/* Settings panel mock */}
                  <div className="hidden md:block w-48 rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 space-y-3">
                    <div className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">Settings</div>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="space-y-1.5">
                        <div className="w-16 h-1.5 rounded bg-white/10" />
                        <div className="h-5 rounded-md bg-white/[0.04] border border-white/[0.06]" />
                      </div>
                    ))}
                    {/* Color swatches */}
                    <div className="flex gap-1.5 pt-1">
                      {['#1a1a2e', '#200122', '#11998e', '#8e2de2', '#f953c6', '#43cea2'].map(c => (
                        <div key={c} className="w-5 h-5 rounded-md border border-white/10" style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timeline mock */}
                <div className="h-16 rounded-xl bg-white/[0.02] border border-white/[0.06] p-2 flex flex-col gap-1.5">
                  <div className="flex gap-1.5 flex-1">
                    {/* Zoom track */}
                    <div className="flex-1 rounded bg-white/[0.03] relative overflow-hidden">
                      <div className="absolute left-[15%] top-0.5 bottom-0.5 w-[25%] rounded bg-[#F59E0B]/20 border border-[#F59E0B]/30" />
                      <div className="absolute left-[60%] top-0.5 bottom-0.5 w-[15%] rounded bg-[#F59E0B]/20 border border-[#F59E0B]/30" />
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-1">
                    {/* Speed track */}
                    <div className="flex-1 rounded bg-white/[0.03] relative overflow-hidden">
                      <div className="absolute left-[40%] top-0.5 bottom-0.5 w-[20%] rounded bg-[#EC4899]/20 border border-[#EC4899]/30" />
                    </div>
                  </div>
                  {/* Playhead */}
                  <div className="absolute left-[35%] top-0 bottom-0 w-px bg-[#34B27B]" style={{ display: 'none' }} />
                </div>
              </div>

              {/* Gradient overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0d] to-transparent" />
            </div>
          </div>

          {/* Caption below mockup */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Full video editor running in your browser — record, zoom, trim, export. That's it.
          </p>
        </div>
      </Section>

      {/* ═══════════ FEATURES ═══════════ */}
      <Section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block text-xs font-semibold text-[#34B27B] uppercase tracking-[0.2em] mb-4">Everything you need</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
              Pro-level features.{' '}
              <span className="text-slate-500">Free forever.</span>
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-lg leading-relaxed">
              No watermarks. No time limits. No feature gates.<br className="hidden sm:block" />
              Every tool, available to everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: FIcon, title, desc, color }, i) => (
              <div
                key={title}
                className="group relative p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 cursor-pointer hover:bg-white/[0.035]"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${color}15` }}
                >
                  <FIcon className="w-5.5 h-5.5" style={{ color }} />
                </div>
                <h3 className="text-white font-bold text-base mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                {/* Subtle corner glow on hover */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl pointer-events-none"
                  style={{ background: color, opacity: 0 }}
                />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ BEFORE / AFTER ═══════════ */}
      <Section className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold text-[#F59E0B] uppercase tracking-[0.2em] mb-4">The difference</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
              Raw recording → <span style={{
                background: 'linear-gradient(135deg, #34B27B, #5eead4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Polished demo</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <X className="w-4 h-4 text-red-400" />
                Without Vibe ScreenDemo
              </div>
              <div className="aspect-video rounded-xl bg-[#111] border border-white/[0.06] flex items-center justify-center overflow-hidden">
                <div className="w-[90%] h-[85%] bg-slate-900 rounded border border-white/[0.04]">
                  <div className="h-6 bg-slate-800 border-b border-white/[0.04] flex items-center px-3">
                    <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-white/10" /><div className="w-2 h-2 rounded-full bg-white/10" /><div className="w-2 h-2 rounded-full bg-white/10" /></div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="w-full h-1.5 rounded bg-white/[0.04]" />
                    <div className="w-3/4 h-1.5 rounded bg-white/[0.04]" />
                    <div className="w-1/2 h-1.5 rounded bg-white/[0.04]" />
                  </div>
                </div>
              </div>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-start gap-2"><X className="w-4 h-4 text-red-400/60 mt-0.5 shrink-0" /> Flat, boring screen capture</li>
                <li className="flex items-start gap-2"><X className="w-4 h-4 text-red-400/60 mt-0.5 shrink-0" /> No context for what to look at</li>
                <li className="flex items-start gap-2"><X className="w-4 h-4 text-red-400/60 mt-0.5 shrink-0" /> Dead air and awkward pauses</li>
              </ul>
            </div>

            {/* After */}
            <div className="rounded-2xl border border-[#34B27B]/20 bg-[#34B27B]/[0.03] p-6 space-y-4 relative overflow-hidden">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#34B27B]">
                <Check className="w-4 h-4" />
                With Vibe ScreenDemo
              </div>
              <div className="aspect-video rounded-xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] border border-white/[0.08] flex items-center justify-center overflow-hidden shadow-xl shadow-[#0f3460]/20">
                <div className="w-[70%] h-[65%] bg-slate-900/80 rounded-lg border border-white/[0.08] shadow-2xl shadow-black/40 relative">
                  <div className="h-5 bg-slate-800/60 border-b border-white/[0.06] flex items-center px-2.5 rounded-t-lg">
                    <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#ff5f57]" /><div className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e]" /><div className="w-1.5 h-1.5 rounded-full bg-[#28c840]" /></div>
                  </div>
                  <div className="p-2.5 space-y-1.5">
                    <div className="w-full h-1.5 rounded bg-white/[0.06]" />
                    <div className="w-3/4 h-1.5 rounded bg-white/[0.06]" />
                    <div className="w-1/2 h-1.5 rounded bg-white/[0.06]" />
                  </div>
                  {/* Zoom indicator */}
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-[#F59E0B] border-2 border-[#1a1a2e]" />
                </div>
              </div>
              <ul className="text-sm text-slate-300 space-y-2">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#34B27B] mt-0.5 shrink-0" /> Beautiful gradient background</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#34B27B] mt-0.5 shrink-0" /> Zoom guides the viewer's eye</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#34B27B] mt-0.5 shrink-0" /> Trimmed, paced, professional</li>
              </ul>
              {/* Glow */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[#34B27B]/10 blur-3xl pointer-events-none" />
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════ COMPARISON TABLE ═══════════ */}
      <Section id="comparison" className="relative z-10 py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold text-[#818CF8] uppercase tracking-[0.2em] mb-4">Honest comparison</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
              Same features.{' '}
              <span className="line-through text-slate-600 decoration-red-400/60">$89</span>{' '}
              <span className="text-[#34B27B]">$0.</span>
            </h2>
            <p className="text-slate-400 max-w-md mx-auto text-lg">
              We love Screen Studio — it's an amazing product. We're just building a free alternative for those who can't afford it.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.015]">
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-white/[0.06]">
              <div className="p-4 text-sm font-semibold text-slate-400">Feature</div>
              <div className="p-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34B27B]/10 border border-[#34B27B]/20">
                  <Video className="w-3.5 h-3.5 text-[#34B27B]" />
                  <span className="text-sm font-bold text-[#34B27B]">Vibe</span>
                </div>
              </div>
              <div className="p-4 text-center text-sm font-semibold text-slate-500">Screen Studio</div>
            </div>
            {/* Rows */}
            {COMPARISON.map(({ feature, us, them }, i) => (
              <div
                key={feature}
                className={cn(
                  'grid grid-cols-3 items-center border-b border-white/[0.04] last:border-0',
                  feature === 'Price' ? 'bg-[#34B27B]/[0.03]' : i % 2 === 0 ? 'bg-white/[0.01]' : ''
                )}
              >
                <div className="px-4 py-3 text-sm text-slate-300">{feature}</div>
                <div className="px-4 py-3 text-center">
                  {us === true ? (
                    <Check className="w-5 h-5 text-[#34D399] mx-auto" />
                  ) : (
                    <span className="text-sm font-extrabold text-[#34B27B]">{us}</span>
                  )}
                </div>
                <div className="px-4 py-3 text-center">
                  {them === true ? (
                    <Check className="w-5 h-5 text-slate-600 mx-auto" />
                  ) : them === false ? (
                    <X className="w-5 h-5 text-slate-700 mx-auto" />
                  ) : (
                    <span className="text-sm font-bold text-slate-400">{them}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <Section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block text-xs font-semibold text-[#06B6D4] uppercase tracking-[0.2em] mb-4">Dead simple</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Three steps. That's it.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Record or Upload',
                desc: 'Hit record to capture your screen, or drop in an existing video file.',
                color: '#34B27B',
              },
              {
                step: '02',
                title: 'Make it Beautiful',
                desc: 'Add backgrounds, zoom effects, trim dead air, adjust speed.',
                color: '#818CF8',
              },
              {
                step: '03',
                title: 'Export & Share',
                desc: 'Download a polished MP4. Share it anywhere — Twitter, docs, Slack.',
                color: '#F59E0B',
              },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="text-center md:text-left">
                <span
                  className="inline-block text-5xl font-extrabold mb-4 leading-none"
                  style={{
                    background: `linear-gradient(135deg, ${color}, ${color}66)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {step}
                </span>
                <h3 className="text-white font-bold text-xl mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ PRIVACY BANNER ═══════════ */}
      <Section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 md:p-14 text-center relative overflow-hidden">
            <Shield className="w-10 h-10 text-[#34B27B] mx-auto mb-5" />
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
              Your videos never leave your machine.
            </h3>
            <p className="text-slate-400 max-w-lg mx-auto leading-relaxed">
              Everything runs locally in your browser using WebCodecs and FFmpeg.wasm. No uploads. No servers. No accounts. No tracking. Just you and your video.
            </p>
            {/* Glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full bg-[#34B27B]/5 blur-3xl pointer-events-none" />
          </div>
        </div>
      </Section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <Section id="start" className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
            Ready to make your <br className="hidden sm:block" />
            <span style={{
              background: 'linear-gradient(135deg, #34B27B, #5eead4, #818CF8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              demos look incredible?
            </span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto">
            No signup. No download. Just click and start recording.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={toggleRecording}
              className={cn(
                'group flex items-center gap-3 px-10 py-5 rounded-2xl text-lg font-bold transition-all duration-300 cursor-pointer active:scale-[0.97]',
                recording
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/25'
                  : 'bg-[#34B27B] hover:bg-[#2d9e6c] text-white shadow-xl shadow-[#34B27B]/25 hover:shadow-2xl hover:shadow-[#34B27B]/40'
              )}
            >
              {recording ? (
                <>
                  <Circle className="w-5 h-5 fill-white animate-pulse" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  Start Recording — It's Free
                  <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-600">
            Free forever · No credit card · No limits
          </p>
        </div>
      </Section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="relative z-10 border-t border-white/[0.04] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#34B27B] flex items-center justify-center">
              <Video className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Vibe ScreenDemo</span>
          </div>
          <p className="text-xs text-slate-600 flex items-center gap-1.5">
            Built with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> · Works best on desktop Chrome / Edge
          </p>
          {/* <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-white transition-colors cursor-pointer">
              <Github className="w-4.5 h-4.5" />
            </a>
          </div> */}
        </div>
      </footer>
    </div>
  )
}
