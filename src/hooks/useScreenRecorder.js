import { useState, useRef, useCallback } from 'react'

export function useScreenRecorder({ onRecordingComplete }) {
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const micStreamRef = useRef(null)
  const audioCtxRef = useRef(null)
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
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop())
      micStreamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    setRecording(false)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      // Capture screen + tab audio (user must check "Share tab audio" in browser dialog)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 60, max: 60 },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      })

      // Also capture microphone audio and mix with display audio
      let micStream = null
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        micStreamRef.current = micStream
      } catch {
        // Mic permission denied — continue with display audio only
      }

      // Mix display audio + mic audio using AudioContext → single destination stream
      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const destination = audioCtx.createMediaStreamDestination()

      const displayAudioTracks = displayStream.getAudioTracks()
      if (displayAudioTracks.length > 0) {
        const displaySource = audioCtx.createMediaStreamSource(new MediaStream(displayAudioTracks))
        displaySource.connect(destination)
      }
      if (micStream) {
        const micSource = audioCtx.createMediaStreamSource(micStream)
        micSource.connect(destination)
      }

      // Combined stream: video from display + mixed audio
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ])

      streamRef.current = displayStream

      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording()
      })

      const mimeType = selectMimeType()
      chunksRef.current = []

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 8_000_000,
      })

      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        if (chunksRef.current.length === 0) return
        const durationMs = Date.now() - startTimeRef.current
        const rawBlob = new Blob(chunksRef.current, { type: mimeType })
        chunksRef.current = []

        // Fix WebM duration metadata so video.duration works in the editor
        try {
          const { default: fixWebmDuration } = await import('fix-webm-duration')
          const fixedBlob = await fixWebmDuration(rawBlob, durationMs, { logger: false })
          const url = URL.createObjectURL(fixedBlob)
          onRecordingComplete?.({ blob: fixedBlob, url, mimeType })
        } catch {
          const url = URL.createObjectURL(rawBlob)
          onRecordingComplete?.({ blob: rawBlob, url, mimeType })
        }
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
