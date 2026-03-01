import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ExportDialog({ isOpen, onClose, progress, isExporting, error, onCancel }) {
  if (!isOpen) return null
  const percent = progress?.percent ?? 0
  const phase = progress?.phase ?? 'preparing'
  const isDone = phase === 'done'
  const phaseLabels = {
    preparing: 'Warming up the engines — hang tight ✦',
    encoding: 'Painting every frame with care...',
    finalizing: 'Wrapping it up like a gift 🎁',
    done: 'Your masterpiece is ready!',
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={!isExporting ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-[#111113] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDone ? 'bg-[#34B27B]/15' : error ? 'bg-red-500/15' : 'bg-[#34B27B]/10'
            }`}>
              {isDone ? <CheckCircle className="w-4.5 h-4.5 text-[#34B27B]" />
                : error ? <AlertCircle className="w-4.5 h-4.5 text-red-400" />
                : <Loader2 className="w-4.5 h-4.5 text-[#34B27B] animate-spin" />}
            </div>
            <span className="font-bold text-white text-sm tracking-tight">
              {error ? 'Export Failed' : isDone ? 'Export Complete' : 'Exporting Video'}
            </span>
          </div>
          {!isExporting && (
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="px-6 py-6 space-y-4">
          {error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400">{phaseLabels[phase] || 'Processing...'}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Progress</span>
                  <span className="text-slate-300 font-semibold tabular-nums">{percent}%</span>
                </div>
                <div className="h-2.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#34B27B] to-[#34B27B]/80 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              {isDone && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#34B27B]/10 border border-[#34B27B]/20">
                  <CheckCircle className="w-4 h-4 text-[#34B27B] flex-shrink-0" />
                  <p className="text-sm text-[#34B27B] font-medium">Your video has been downloaded!</p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="px-6 pb-5 flex gap-2.5">
          {isExporting && !isDone && (
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/15 hover:bg-white/[0.03] text-sm font-medium transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
          )}
          {(!isExporting || isDone || error) && (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#34B27B] text-white font-semibold text-sm hover:bg-[#2d9e6c] transition-all duration-200 cursor-pointer shadow-lg shadow-[#34B27B]/15 active:scale-[0.98]"
            >
              {isDone ? 'Done' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
