import { Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatTime(s) {
  if (!isFinite(s) || isNaN(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function PlayButton({ isPlaying, onTogglePlayPause }) {
  return (
    <button
      onClick={onTogglePlayPause}
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 cursor-pointer active:scale-90',
        isPlaying
          ? 'bg-white/10 text-white hover:bg-white/15 backdrop-blur-sm'
          : 'bg-[#34B27B] text-white hover:bg-[#2d9e6c] shadow-lg shadow-[#34B27B]/25'
      )}
    >
      {isPlaying
        ? <Pause className="w-4 h-4 fill-current" />
        : <Play className="w-4 h-4 fill-current ml-0.5" />
      }
    </button>
  )
}

export default function PlaybackControls({ isPlaying, currentTime, duration, onTogglePlayPause, onSeek }) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#0d0d0f]/80 backdrop-blur-sm border border-white/[0.06] ml-2.5">
      <span className="text-[10px] font-semibold text-slate-300 tabular-nums w-8 text-right flex-shrink-0">
        {formatTime(currentTime)}
      </span>

      <div className="flex-1 relative h-5 flex items-center group">
        <div className="absolute left-0 right-0 h-1 group-hover:h-1.5 bg-white/[0.08] rounded-full overflow-hidden transition-all duration-200">
          <div className="h-full bg-[#34B27B] rounded-full transition-none" style={{ width: `${progress}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          step={0.01}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-md pointer-events-none border-2 border-[#0d0d0f] transition-transform duration-150 scale-0 group-hover:scale-100"
          style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      <span className="text-[10px] font-medium text-slate-500 tabular-nums w-8 flex-shrink-0">
        {formatTime(duration)}
      </span>
    </div>
  )
}

export function FullPlaybackControls({ isPlaying, currentTime, duration, onTogglePlayPause, onSeek }) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0d0d0f]/80 backdrop-blur-sm border border-white/[0.06]">
      <button
        onClick={onTogglePlayPause}
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 cursor-pointer active:scale-90',
          isPlaying
            ? 'bg-white/10 text-white hover:bg-white/15'
            : 'bg-[#34B27B] text-white hover:bg-[#2d9e6c] shadow-lg shadow-[#34B27B]/25'
        )}
      >
        {isPlaying
          ? <Pause className="w-4 h-4 fill-current" />
          : <Play className="w-4 h-4 fill-current ml-0.5" />
        }
      </button>

      <span className="text-[11px] font-semibold text-slate-300 tabular-nums w-10 text-right flex-shrink-0">
        {formatTime(currentTime)}
      </span>

      <div className="flex-1 relative h-6 flex items-center group">
        <div className="absolute left-0 right-0 h-1 group-hover:h-1.5 bg-white/[0.08] rounded-full overflow-hidden transition-all duration-200">
          <div className="h-full bg-[#34B27B] rounded-full transition-none" style={{ width: `${progress}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          step={0.01}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute w-3 h-3 bg-white rounded-full shadow-md pointer-events-none border-2 border-[#0d0d0f] transition-transform duration-150 scale-0 group-hover:scale-100"
          style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      <span className="text-[11px] font-medium text-slate-500 tabular-nums w-10 flex-shrink-0">
        {formatTime(duration)}
      </span>
    </div>
  )
}
