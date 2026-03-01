import { Play, Pause/*, SkipBack, SkipForward*/ } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatTime(s) {
  if (!isFinite(s) || isNaN(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function PlaybackControls({ isPlaying, currentTime, duration, onTogglePlayPause, onSeek }) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0d0d0f] border border-white/5">
      {/* <button
        onClick={() => onSeek(Math.max(0, currentTime - 5))}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
      >
        <SkipBack className="w-3.5 h-3.5" />
      </button> */}

      <button
        onClick={onTogglePlayPause}
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0',
          isPlaying
            ? 'bg-white/10 text-white hover:bg-white/20'
            : 'bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10'
        )}
      >
        {isPlaying
          ? <Pause className="w-4 h-4 fill-current" />
          : <Play className="w-4 h-4 fill-current ml-0.5" />
        }
      </button>

      {/* <button
        onClick={() => onSeek(Math.min(duration, currentTime + 5))}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
      >
        <SkipForward className="w-3.5 h-3.5" />
      </button> */}

      <span className="text-[11px] font-medium text-slate-400 tabular-nums w-10 text-right flex-shrink-0">
        {formatTime(currentTime)}
      </span>

      <div className="flex-1 relative h-6 flex items-center group">
        <div className="absolute left-0 right-0 h-1 bg-white/10 rounded-full overflow-hidden">
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
          className="absolute w-3 h-3 bg-white rounded-full shadow-md pointer-events-none border-2 border-[#09090b] transition-none"
          style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      <span className="text-[11px] font-medium text-slate-600 tabular-nums w-10 flex-shrink-0">
        {formatTime(duration)}
      </span>
    </div>
  )
}
