import { useState, useRef, useCallback, useMemo } from 'react'
import { ZoomIn, Scissors, Gauge, Plus, Trash2, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatTime(s) {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = (s % 60).toFixed(1)
  return `${m}:${sec.padStart(4, '0')}`
}

const REGION_COLORS = {
  zoom: { bg: 'bg-[#34B27B]/20', border: 'border-[#34B27B]/50', text: 'text-[#34B27B]', selected: 'ring-2 ring-[#34B27B]/80 shadow-[0_0_8px_rgba(52,178,123,0.25)]' },
  trim: { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-400', selected: 'ring-2 ring-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.2)]' },
  speed: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-400', selected: 'ring-2 ring-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.2)]' },
}

function TimelineRegion({ region, type, duration, isSelected, onSelect, onSpanChange }) {
  const dragRef = useRef(null)
  const startPct = (region.startMs / 1000) / duration
  const endPct = (region.endMs / 1000) / duration
  const colors = REGION_COLORS[type]

  const handleMouseDown = useCallback((e, mode) => {
    e.stopPropagation()
    onSelect(region.id, type)
    const startX = e.clientX
    const startStart = region.startMs
    const startEnd = region.endMs
    const trackEl = e.currentTarget.closest('[data-timeline-track]')

    const onMove = (me) => {
      if (!trackEl) return
      const rect = trackEl.getBoundingClientRect()
      const dx = me.clientX - startX
      const dMs = (dx / rect.width) * duration * 1000

      if (mode === 'move') {
        const newStart = Math.max(0, Math.min(startStart + dMs, duration * 1000 - (startEnd - startStart)))
        const newEnd = newStart + (startEnd - startStart)
        onSpanChange(region.id, { start: newStart, end: newEnd })
      } else if (mode === 'left') {
        const newStart = Math.max(0, Math.min(startStart + dMs, startEnd - 100))
        onSpanChange(region.id, { start: newStart, end: startEnd })
      } else if (mode === 'right') {
        const newEnd = Math.min(duration * 1000, Math.max(startEnd + dMs, startStart + 100))
        onSpanChange(region.id, { start: startStart, end: newEnd })
      }
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    dragRef.current = { onMove, onUp }
  }, [region, type, duration, onSelect, onSpanChange])

  return (
    <div
      className={cn(
        'absolute top-1 bottom-1 rounded-md border flex items-center overflow-hidden cursor-grab active:cursor-grabbing select-none transition-all duration-150 hover:brightness-125',
        colors.bg, colors.border,
        isSelected ? colors.selected : 'hover:ring-1 hover:ring-white/10'
      )}
      style={{ left: `${startPct * 100}%`, width: `${(endPct - startPct) * 100}%`, minWidth: 24 }}
      onClick={(e) => { e.stopPropagation(); onSelect(region.id, type) }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/15 rounded-l-lg z-10 transition-colors"
        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'left') }}
      />
      <span className={cn('text-[10px] font-semibold px-2.5 truncate pointer-events-none tracking-wide', colors.text)}>
        {type === 'speed' ? `${region.speed}×` : type === 'zoom' ? `${['1.25','1.5','1.8','2.2','3.5','5'][region.depth-1]}×` : 'Cut'}
      </span>
      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/15 rounded-r-lg z-10 transition-colors"
        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'right') }}
      />
    </div>
  )
}

export default function Timeline({
  duration,
  currentTime,
  onSeek,
  zoomRegions,
  trimRegions,
  speedRegions,
  selectedRegionId,
  selectedRegionType,
  onSelectRegion,
  onAddZoom,
  onAddTrim,
  onAddSpeed,
  onZoomSpanChange,
  onTrimSpanChange,
  onSpeedSpanChange,
  onDeleteRegion,
}) {
  const trackRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const [activeMode, setActiveMode] = useState('zoom')
  const [timelineZoom, setTimelineZoom] = useState(1)

  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleTrackClick = useCallback((e) => {
    if (!trackRef.current || duration <= 0) return
    const rect = trackRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const clickMs = pct * duration * 1000
    const regionDurationMs = Math.min(duration * 1000 * 0.2, 3000)
    const startMs = Math.max(0, clickMs - regionDurationMs / 2)
    const endMs = Math.min(duration * 1000, startMs + regionDurationMs)

    if (activeMode === 'zoom') onAddZoom({ start: startMs, end: endMs })
    else if (activeMode === 'trim') onAddTrim({ start: startMs, end: endMs })
    else if (activeMode === 'speed') onAddSpeed({ start: startMs, end: endMs })
  }, [duration, activeMode, onAddZoom, onAddTrim, onAddSpeed])

  const handlePlayheadDrag = useCallback((e) => {
    if (!trackRef.current || duration <= 0) return
    e.stopPropagation()
    const onMove = (me) => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect) return
      const pct = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width))
      onSeek(pct * duration)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [duration, onSeek])

  const markers = useMemo(() => {
    if (duration <= 0) return []
    const count = Math.max(4, Math.round(8 * timelineZoom))
    return Array.from({ length: count + 1 }, (_, i) => ({
      pct: i / count,
      time: (i / count) * duration,
    }))
  }, [duration, timelineZoom])

  const handleZoomIn = useCallback(() => {
    setTimelineZoom(prev => Math.min(prev * 1.5, 6))
  }, [])

  const handleZoomOut = useCallback(() => {
    setTimelineZoom(prev => Math.max(prev / 1.5, 1))
  }, [])

  const rows = [
    { id: 'zoom', label: 'Zoom', IconComp: ZoomIn, regions: zoomRegions, onSpanChange: onZoomSpanChange, color: 'text-[#34B27B]' },
    { id: 'trim', label: 'Trim', IconComp: Scissors, regions: trimRegions, onSpanChange: onTrimSpanChange, color: 'text-red-400' },
    { id: 'speed', label: 'Speed', IconComp: Gauge, regions: speedRegions, onSpanChange: onSpeedSpanChange, color: 'text-amber-400' },
  ]

  if (duration <= 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
        Load a video to see the timeline
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full select-none">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-0.5 bg-white/[0.04] p-0.5 rounded-lg">
          {[
            { id: 'zoom', label: 'Zoom', BtnIcon: ZoomIn, activeBg: 'bg-[#34B27B]/15', activeText: 'text-[#34B27B]', activeBorder: 'border-[#34B27B]/30' },
            { id: 'trim', label: 'Trim', BtnIcon: Scissors, activeBg: 'bg-red-500/15', activeText: 'text-red-400', activeBorder: 'border-red-500/30' },
            { id: 'speed', label: 'Speed', BtnIcon: Gauge, activeBg: 'bg-amber-500/15', activeText: 'text-amber-400', activeBorder: 'border-amber-500/30' },
          ].map(({ id, label, BtnIcon, activeBg, activeText, activeBorder }) => (
            <button
              key={id}
              onClick={() => setActiveMode(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 cursor-pointer border',
                activeMode === id
                  ? `${activeBg} ${activeText} ${activeBorder}`
                  : 'text-slate-500 hover:text-slate-300 border-transparent'
              )}
            >
              <BtnIcon className="w-3.5 h-3.5" strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-slate-600 hidden sm:inline">Click on track to add</span>
        <div className="flex-1" />
        {selectedRegionId && (
          <button
            onClick={() => onDeleteRegion(selectedRegionId, selectedRegionType)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-red-400 hover:bg-red-500/10 transition-all cursor-pointer border border-transparent hover:border-red-500/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
        <div className="w-px h-4 bg-white/[0.06]" />
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleZoomOut}
            disabled={timelineZoom <= 1}
            className={cn(
              'w-6 h-6 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer',
              timelineZoom <= 1 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
            )}
            title="Zoom out timeline"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-[9px] text-slate-500 tabular-nums w-7 text-center font-medium">{timelineZoom.toFixed(1)}×</span>
          <button
            onClick={handleZoomIn}
            disabled={timelineZoom >= 6}
            className={cn(
              'w-6 h-6 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer',
              timelineZoom >= 6 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
            )}
            title="Zoom in timeline"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Scrollable time axis + track rows (synced scroll) */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar" ref={scrollContainerRef}>
        {/* Time axis */}
        <div className="relative h-5 flex-shrink-0 border-b border-white/[0.06] bg-white/[0.01]" style={{ marginLeft: 56 }}>
          <div className="relative h-full" style={{ width: `${timelineZoom * 100}%` }}>
            {markers.map(({ pct, time }) => (
              <div
                key={pct}
                className="absolute top-0 bottom-0 flex flex-col items-center"
                style={{ left: `${pct * 100}%` }}
              >
                <div className="w-px h-2 bg-white/[0.08] mt-0.5" />
                <span className="text-[9px] text-slate-500 tabular-nums mt-0.5 font-medium">{formatTime(time)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Track rows */}
        {rows.map(({ id, label, IconComp, regions, onSpanChange, color }) => (
          <div key={id} className={cn(
            'flex items-stretch border-b border-white/[0.04] h-9 transition-colors duration-150',
            id === activeMode ? 'bg-white/[0.015]' : 'hover:bg-white/[0.008]'
          )}>
            {/* Row label — sticky left */}
            <div className="w-14 flex-shrink-0 flex items-center gap-1 px-2 pl-1 border-r border-white/[0.06] sticky left-0 z-10 bg-[#0b0b0d]">
              <IconComp className={cn('w-3 h-3 flex-shrink-0', color)} strokeWidth={2} />
              <span className={cn('text-[10px] font-medium', id === activeMode ? 'text-slate-300' : 'text-slate-500')}>{label}</span>
            </div>
            {/* Track area */}
            <div
              ref={id === activeMode ? trackRef : null}
              data-timeline-track
              className={cn(
                'relative flex-1',
                id === activeMode ? 'cursor-crosshair' : 'cursor-default'
              )}
              style={{ minWidth: `${timelineZoom * 100}%` }}
              onClick={id === activeMode ? handleTrackClick : undefined}
            >
              {(regions || []).map((region) => (
                <TimelineRegion
                  key={region.id}
                  region={region}
                  type={id}
                  duration={duration}
                  isSelected={selectedRegionId === region.id}
                  onSelect={onSelectRegion}
                  onSpanChange={onSpanChange}
                  onDelete={onDeleteRegion}
                />
              ))}
              {/* Playhead line — draggable, expands on hover */}
              <div
                className="absolute top-0 bottom-0 z-20 group/playhead cursor-ew-resize flex items-center justify-center"
                style={{ left: `${playheadPct}%`, transform: 'translateX(-50%)', width: 12 }}
                onMouseDown={handlePlayheadDrag}
              >
                <div className="w-px group-hover/playhead:w-[3px] h-full bg-white/70 group-hover/playhead:bg-white transition-all duration-150 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Playhead scrubber — commented out for now */}
      {/* <div className="flex-shrink-0 border-t border-white/[0.06] bg-white/[0.01]" style={{ paddingLeft: 56 }}>
        <div className="relative h-6 flex items-center px-0">
          <div className="absolute left-0 right-0 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-[#34B27B]/50 rounded-full transition-none" style={{ width: `${playheadPct}%` }} />
          </div>
          <div
            className="absolute w-3.5 h-3.5 bg-[#34B27B] rounded-full cursor-ew-resize shadow-lg shadow-[#34B27B]/30 border-2 border-[#0c0c0e] z-20 hover:scale-125 transition-transform"
            style={{ left: `${playheadPct}%`, transform: 'translateX(-50%)' }}
            onMouseDown={handlePlayheadDrag}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            step={0.01}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
          />
        </div>
      </div> */}
    </div>
  )
}
