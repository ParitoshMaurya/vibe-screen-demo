# Vibe ScreenDemo

**Screen Studio quality. Zero dollar price tag.**

A free, browser-based screen recorder & video editor. Record your screen, add cinematic zoom effects, beautiful backgrounds, trim & speed control — export polished demo videos. No install, no signup, 100% local processing.

🔗 **Live:** [vibe-screen-demo.vercel.app](https://vibe-screen-demo.vercel.app)

---

## Features

- **Screen Recording** — Native browser screen capture with system audio support
- **Cinematic Zoom** — Add smooth zoom-in animations on any part of the timeline
- **Trim & Cut** — Remove unwanted sections with visual timeline regions
- **Speed Control** — Slow down or speed up specific segments
- **Beautiful Backgrounds** — Curated wallpapers, gradients, solid colors, or upload your own
- **Customizable Padding, Radius & Shadow** — Fine-tune the look of your video frame
- **Aspect Ratio Presets** — 16:9, 9:16, 4:3, 1:1, and more
- **Export Quality Selector** — Low (720p), Medium (1080p), High (1080p 16Mbps), Ultra (4K 60fps)
- **MP4 Export** — Processed entirely in-browser via ffmpeg.wasm
- **Keyboard Shortcuts** — Space (play/pause), Delete (remove region), Arrow keys (seek)
- **Drag & Drop Upload** — Drop a video file or paste a URL to start editing
- **Fullscreen Preview** — Review your edits in full screen before exporting
- **Data Stays Local** — Nothing leaves your browser

## Tech Stack

- **React 19** + **Vite 7**
- **Tailwind CSS v4**
- **ffmpeg.wasm** — client-side video encoding
- **Lucide React** — icons
- **Framer Motion** — animations
- **Sonner** — toast notifications
- **Radix UI** — accessible primitives (Slider, Dialog, Tabs, etc.)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/ParitoshMaurya/vibe-screen-demo.git
cd vibe-screen-demo

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in Chrome or Edge (recommended for best compatibility).

## Build

```bash
pnpm build
pnpm preview
```

## Project Structure

```
src/
├── components/
│   ├── LandingPage.jsx      # Landing page with record/upload
│   ├── VideoEditor.jsx      # Main editor (preview + timeline + settings)
│   ├── VideoPreview.jsx     # Canvas-based real-time video rendering
│   ├── Timeline.jsx         # Zoom/trim/speed track rows
│   ├── SettingsPanel.jsx    # Background, padding, radius, shadow, quality
│   ├── PlaybackControls.jsx # Play/pause, seek bar, time display
│   ├── ExportDialog.jsx     # Export progress modal
│   └── ui/                  # Reusable UI primitives (Button, Slider, Switch)
├── hooks/
│   └── useScreenRecorder.js # Web-native getDisplayMedia recorder
├── lib/
│   ├── utils.js             # cn() utility
│   └── config.js            # Shared constants (wallpapers, etc.)
└── App.jsx                  # Routes between Landing and Editor
```

## Browser Support

Works best on **desktop Chrome / Edge**. Requires SharedArrayBuffer support (COOP/COEP headers configured in `vite.config.js`).

## License

MIT
