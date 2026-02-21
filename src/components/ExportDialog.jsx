import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ExportDialog({ isOpen, onClose, progress, isExporting, error, onCancel }) {
  if (!isOpen) return null
  const percent = progress?.percent ?? 0
  const phase = progress?.phase ?? 'preparing'
  const isDone = phase === 'done'
  const phaseLabels = {
    preparing: 'Preparing export...',
    loading: 'Loading FFmpeg engine...',
    encoding: 'Encoding video...',
    finalizing: 'Finalizing...',
    done: 'Export complete!',
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!isExporting ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-[#111113] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            {isDone ? <CheckCircle className="w-5 h-5 text-[#34B27B]" />
              : error ? <AlertCircle className="w-5 h-5 text-red-400" />
              : <Loader2 className="w-5 h-5 text-[#34B27B] animate-spin" />}
            <span className="font-semibold text-white text-sm">
              {error ? 'Export Failed' : isDone ? 'Export Complete' : 'Exporting Video'}
            </span>
          </div>
          {!isExporting && (
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="px-6 py-6 space-y-4">
          {error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400">{phaseLabels[phase] || 'Processing...'}</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Progress</span>
                  <span>{percent}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#34B27B] rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              {isDone && (
                <p className="text-sm text-[#34B27B] font-medium">Your video has been downloaded!</p>
              )}
            </>
          )}
        </div>
        <div className="px-6 pb-5 flex gap-2">
          {isExporting && !isDone && (
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm transition-all"
            >
              Cancel
            </button>
          )}
          {(!isExporting || isDone || error) && (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#34B27B] text-white font-medium text-sm hover:bg-[#2d9e6c] transition-all"
            >
              {isDone ? 'Done' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
