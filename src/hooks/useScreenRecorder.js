import { useState, useRef, useCallback } from 'react'

export function useScreenRecorder({ onRecordingComplete }) {
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const startTimeRef = useRef(0)

  const selectMimeType = () => {
    const preferred = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ]
    return preferred.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'
  }

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setRecording(false)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 60, max: 60 },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      streamRef.current = stream

      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording()
      })

      const mimeType = selectMimeType()
      chunksRef.current = []

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8_000_000,
      })

      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        if (chunksRef.current.length === 0) return
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        onRecordingComplete?.({ blob, url, mimeType })
        chunksRef.current = []
      }

      recorder.onerror = () => setRecording(false)

      mediaRecorderRef.current = recorder
      recorder.start(1000)
      startTimeRef.current = Date.now()
      setRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setRecording(false)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [onRecordingComplete, stopRecording])

  const toggleRecording = useCallback(() => {
    if (recording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [recording, startRecording, stopRecording])

  return { recording, toggleRecording, stopRecording }
}
