import { useState, useRef } from 'react'
import { Palette, Layers, ZoomIn, Scissors, Gauge, Download, Upload, Image, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

const GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  'linear-gradient(135deg, #141e30, #243b55)',
  'linear-gradient(135deg, #200122, #6f0000)',
  'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  'linear-gradient(135deg, #1d2b64, #f8cdda)',
  'linear-gradient(135deg, #11998e, #38ef7d)',
  'linear-gradient(135deg, #fc4a1a, #f7b733)',
  'linear-gradient(135deg, #8e2de2, #4a00e0)',
  'linear-gradient(135deg, #f953c6, #b91d73)',
  'linear-gradient(135deg, #43cea2, #185a9d)',
  'linear-gradient(135deg, #f7971e, #ffd200)',
]

const SOLID_COLORS = [
  '#09090b', '#0d1117', '#1a1a1a', '#0a0a0a',
  '#1e1b4b', '#14532d', '#450a0a', '#1c1917',
  '#0c4a6e', '#365314', '#3b0764', '#4a044e',
]

const ZOOM_DEPTHS = [
  { depth: 1, label: '1.25×' },
  { depth: 2, label: '1.5×' },
  { depth: 3, label: '1.8×' },
  { depth: 4, label: '2.2×' },
  { depth: 5, label: '3.5×' },
  { depth: 6, label: '5×' },
]

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]

function Section({ title, SectionIcon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          {SectionIcon && <SectionIcon className="w-3.5 h-3.5 text-slate-500" />}
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

export default function SettingsPanel({
  background, onBackgroundChange,
  padding, onPaddingChange,
  borderRadius, onBorderRadiusChange,
  shadowIntensity, onShadowChange,
  selectedZoom, onZoomDepthChange, onZoomDelete,
  selectedTrim, onTrimDelete,
  selectedSpeed, onSpeedChange, onSpeedDelete,
  onExport,
}) {
  const [bgTab, setBgTab] = useState('gradient')
  const fileInputRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      onBackgroundChange(ev.target.result)
      setBgTab('custom')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="h-full flex flex-col bg-[#0d0d0f] border border-white/5 rounded-2xl overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* Background */}
        <Section title="Background" SectionIcon={Palette}>
          <div className="flex gap-1 mb-3 bg-white/5 p-0.5 rounded-lg">
            {['gradient', 'solid', 'custom'].map(tab => (
              <button
                key={tab}
                onClick={() => setBgTab(tab)}
                className={cn(
                  'flex-1 py-1 text-[10px] font-medium rounded-md transition-all capitalize',
                  bgTab === tab ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {bgTab === 'gradient' && (
            <div className="grid grid-cols-6 gap-1.5">
              {GRADIENTS.map((g, i) => (
                <button
                  key={i}
                  onClick={() => onBackgroundChange(g)}
                  className={cn(
                    'aspect-square rounded-lg border-2 transition-all',
                    background === g ? 'border-[#34B27B] scale-110' : 'border-transparent hover:border-white/30'
                  )}
                  style={{ background: g }}
                />
              ))}
            </div>
          )}

          {bgTab === 'solid' && (
            <div className="grid grid-cols-6 gap-1.5">
              {SOLID_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onBackgroundChange(c)}
                  className={cn(
                    'aspect-square rounded-lg border-2 transition-all',
                    background === c ? 'border-[#34B27B] scale-110' : 'border-transparent hover:border-white/30'
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          )}

          {bgTab === 'custom' && (
            <div className="space-y-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/20 hover:border-white/40 text-slate-400 hover:text-white text-xs transition-all"
              >
                <Upload className="w-4 h-4" />
                Upload image background
              </button>
              {background?.startsWith('data:') && (
                <div
                  className="w-full h-16 rounded-lg border border-[#34B27B]/40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${background})` }}
                />
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          )}
        </Section>

        {/* Appearance */}
        <Section title="Appearance" SectionIcon={Layers}>
          <div className="space-y-4">
            <Slider
              label="Padding"
              value={padding}
              min={0}
              max={100}
              step={1}
              onChange={onPaddingChange}
              showValue
              formatValue={v => `${v}px`}
            />
            <Slider
              label="Corner Radius"
              value={borderRadius}
              min={0}
              max={40}
              step={1}
              onChange={onBorderRadiusChange}
              showValue
              formatValue={v => `${v}px`}
            />
            <Slider
              label="Shadow"
              value={shadowIntensity}
              min={0}
              max={1}
              step={0.01}
              onChange={onShadowChange}
              showValue
              formatValue={v => `${Math.round(v * 100)}%`}
            />
          </div>
        </Section>

        {/* Zoom Region Settings */}
        {selectedZoom && (
          <Section title="Zoom Region" SectionIcon={ZoomIn} defaultOpen>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-400 mb-2 block">Zoom Level</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {ZOOM_DEPTHS.map(({ depth, label }) => (
                    <button
                      key={depth}
                      onClick={() => onZoomDepthChange(depth)}
                      className={cn(
                        'py-1.5 rounded-lg text-xs font-medium border transition-all',
                        selectedZoom.depth === depth
                          ? 'bg-[#34B27B]/15 border-[#34B27B]/50 text-[#34B27B]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-500">Click on the video preview to set the zoom focus point.</p>
              <Button variant="danger" size="sm" onClick={onZoomDelete} className="w-full gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                Delete Zoom Region
              </Button>
            </div>
          </Section>
        )}

        {/* Trim Region Settings */}
        {selectedTrim && (
          <Section title="Trim Region" SectionIcon={Scissors} defaultOpen>
            <div className="space-y-3">
              <p className="text-xs text-slate-400">This segment will be removed from the exported video.</p>
              <Button variant="danger" size="sm" onClick={onTrimDelete} className="w-full gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                Delete Trim Region
              </Button>
            </div>
          </Section>
        )}

        {/* Speed Region Settings */}
        {selectedSpeed && (
          <Section title="Speed Region" SectionIcon={Gauge} defaultOpen>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-400 mb-2 block">Playback Speed</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {SPEED_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => onSpeedChange(s)}
                      className={cn(
                        'py-1.5 rounded-lg text-xs font-medium border transition-all',
                        selectedSpeed.speed === s
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                      )}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={onSpeedDelete} className="w-full gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                Delete Speed Region
              </Button>
            </div>
          </Section>
        )}
      </div>

      {/* Export button */}
      <div className="flex-shrink-0 p-4 border-t border-white/5">
        <Button variant="primary" size="lg" onClick={onExport} className="w-full gap-2">
          <Download className="w-4 h-4" />
          Export MP4
        </Button>
      </div>
    </div>
  )
}
