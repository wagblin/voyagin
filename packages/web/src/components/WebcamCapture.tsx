import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createCapturedPhotoFile, isCameraCaptureSupported } from '@/lib/webcamCapture'

interface WebcamCaptureProps {
  onCapture: (file: File) => void
}

export function WebcamCapture({ onCapture }: WebcamCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  useEffect(() => {
    return () => stopStream()
  }, [])

  useEffect(() => {
    if (isStreaming && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      void videoRef.current.play()
    }
  }, [isStreaming])

  async function handleStart() {
    setCaptureError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      setIsStreaming(true)
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'Impossible d\'accéder à la caméra.')
    }
  }

  function handleCancel() {
    stopStream()
    setIsStreaming(false)
  }

  function handleCapture() {
    const video = videoRef.current
    if (!video) {
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    context?.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(createCapturedPhotoFile(blob))
        }
      },
      'image/jpeg',
      0.92,
    )
    stopStream()
    setIsStreaming(false)
  }

  if (!isCameraCaptureSupported()) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      {!isStreaming && (
        <Button type="button" variant="outline" onClick={() => void handleStart()}>
          Prendre une photo
        </Button>
      )}
      {captureError && <p className="text-sm text-destructive">{captureError}</p>}
      {isStreaming && (
        <div className="flex flex-col gap-2">
          <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg" />
          <div className="flex gap-2">
            <Button type="button" onClick={handleCapture}>
              Capturer
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
