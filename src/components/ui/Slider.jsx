import { cn } from '@/lib/utils'

export function Slider({ value, min = 0, max = 100, step = 1, onChange, className, label, showValue, formatValue }) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showValue && (
            <span className="text-xs font-medium text-slate-300 tabular-nums">
              {formatValue ? formatValue(value) : value}
            </span>
          )}
        </div>
      )}
      <div className="relative h-5 flex items-center group">
        <div className="absolute left-0 right-0 h-1 group-hover:h-1.5 bg-white/[0.08] rounded-full overflow-hidden transition-all duration-200">
          <div
            className="h-full bg-[#34B27B] rounded-full transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange?.(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-lg pointer-events-none border-2 border-[#0d0d0f] transition-transform duration-150 group-hover:scale-110"
          style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
        />
      </div>
    </div>
  )
}
