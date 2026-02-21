import { useState, useRef, useCallback, useMemo } from 'react'
import { ZoomIn, Scissors, Gauge, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatTime(s) {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = (s % 60).toFixed(1)
  return `${m}:${sec.padStart(4, '0')}`
}

const REGION_COLORS = {
  zoom: { bg: 'bg-[#34B27B]/25', border: 'border-[#34B27B]/60', text: 'text-[#34B27B]', selected: 'ring-1 ring-[#34B27B]' },
  trim: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', selected: 'ring-1 ring-red-500' },
  speed: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400', selected: 'ring-1 ring-amber-500' },
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
        'absolute top-1 bottom-1 rounded-md border flex items-center overflow-hidden cursor-grab active:cursor-grabbing select-none transition-shadow',
        colors.bg, colors.border,
        isSelected && colors.selected
      )}
      style={{ left: `${startPct * 100}%`, width: `${(endPct - startPct) * 100}%`, minWidth: 24 }}
      onClick={(e) => { e.stopPropagation(); onSelect(region.id, type) }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-l-md z-10"
        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'left') }}
      />
      <span className={cn('text-[10px] font-medium px-2 truncate pointer-events-none', colors.text)}>
        {type === 'speed' ? `${region.speed}×` : type === 'zoom' ? `${['1.25','1.5','1.8','2.2','3.5','5'][region.depth-1]}×` : 'Trim'}
      </span>
      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r-md z-10"
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
  const [activeMode, setActiveMode] = useState('zoom')

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
    const count = 8
    return Array.from({ length: count + 1 }, (_, i) => ({
      pct: i / count,
      time: (i / count) * duration,
    }))
  }, [duration])

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
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 flex-shrink-0">
        <span className="text-[10px] text-slate-500 mr-1">Add:</span>
        {[
          { id: 'zoom', label: 'Zoom', BtnIcon: ZoomIn, color: 'hover:text-[#34B27B] hover:bg-[#34B27B]/10', activeColor: 'text-[#34B27B] bg-[#34B27B]/10' },
          { id: 'trim', label: 'Trim', BtnIcon: Scissors, color: 'hover:text-red-400 hover:bg-red-500/10', activeColor: 'text-red-400 bg-red-500/10' },
          { id: 'speed', label: 'Speed', BtnIcon: Gauge, color: 'hover:text-amber-400 hover:bg-amber-500/10', activeColor: 'text-amber-400 bg-amber-500/10' },
        ].map(({ id, label, BtnIcon, color, activeColor }) => (
          <button
            key={id}
            onClick={() => setActiveMode(id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all text-slate-400',
              activeMode === id ? activeColor : color
            )}
          >
            <BtnIcon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
        <div className="flex-1" />
        {selectedRegionId && (
          <button
            onClick={() => onDeleteRegion(selectedRegionId, selectedRegionType)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        )}
        <span className="text-[10px] text-slate-600 ml-2">Click track to add region</span>
      </div>

      {/* Time axis */}
      <div className="relative h-5 flex-shrink-0 border-b border-white/5 px-16">
        {markers.map(({ pct, time }) => (
          <div
            key={pct}
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${pct * 100}%` }}
          >
            <div className="w-px h-2 bg-white/10 mt-1" />
            <span className="text-[9px] text-slate-600 tabular-nums mt-0.5">{formatTime(time)}</span>
          </div>
        ))}
      </div>

      {/* Track rows */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {rows.map(({ id, label, IconComp, regions, onSpanChange, color }) => (
          <div key={id} className="flex items-stretch border-b border-white/[0.04] h-10">
            {/* Row label */}
            <div className="w-16 flex-shrink-0 flex items-center gap-1.5 px-2 border-r border-white/5">
              <IconComp className={cn('w-3 h-3', color)} />
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
            {/* Track area */}
            <div
              ref={id === activeMode ? trackRef : null}
              data-timeline-track
              className={cn(
                'relative flex-1 cursor-crosshair',
                id === activeMode && 'hover:bg-white/[0.02]'
              )}
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
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-px bg-[#34B27B]/80 pointer-events-none z-20"
                style={{ left: `${playheadPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Playhead scrubber */}
      <div className="flex-shrink-0 px-16 py-1.5 border-t border-white/5">
        <div className="relative h-4 flex items-center">
          <div className="absolute left-0 right-0 h-px bg-white/10" />
          <div
            className="absolute top-0 bottom-0 w-3 h-3 bg-[#34B27B] rounded-full cursor-ew-resize shadow-md border-2 border-[#09090b] -mt-0.5"
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
      </div>
    </div>
  )
}
