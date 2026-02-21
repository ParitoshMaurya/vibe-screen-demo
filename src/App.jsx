import { useState, useCallback } from 'react'
import LandingPage from './components/LandingPage'
import VideoEditor from './components/VideoEditor'

export default function App() {
  const [videoData, setVideoData] = useState(null)

  const handleVideoReady = useCallback((data) => {
    setVideoData(data)
  }, [])

  const handleBack = useCallback(() => {
    if (videoData?.url) {
      URL.revokeObjectURL(videoData.url)
    }
    setVideoData(null)
  }, [videoData])

  if (videoData) {
    return <VideoEditor videoData={videoData} onBack={handleBack} />
  }

  return <LandingPage onVideoReady={handleVideoReady} />
}
