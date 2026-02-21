import { cn } from '@/lib/utils'

export function Switch({ checked, onChange, label, className }) {
  return (
    <label className={cn('flex items-center gap-2.5 cursor-pointer select-none group', className)}>
      {label && <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{label}</span>}
      <div
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative w-9 h-5 rounded-full transition-all duration-200 cursor-pointer',
          checked ? 'bg-[#34B27B]' : 'bg-white/10'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200',
            checked ? 'left-[18px]' : 'left-0.5'
          )}
        />
      </div>
    </label>
  )
}
