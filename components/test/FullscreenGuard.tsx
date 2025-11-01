'use client'

import { useCallback, useEffect, useState } from 'react'

interface FullscreenGuardProps {
  children: React.ReactNode
}

export default function FullscreenGuard({ children }: FullscreenGuardProps) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  const updateFullscreenState = useCallback(() => {
    setIsFullscreen(Boolean(document.fullscreenElement))
  }, [])

  const requestFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
    } catch (_err) {
      // Ignored: browsers may block without user gesture
    }
  }, [])

  useEffect(() => {
    updateFullscreenState()
    const onChange = () => updateFullscreenState()
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [updateFullscreenState])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        // Let the browser handle F11; just re-check state shortly after
        setTimeout(updateFullscreenState, 250)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [updateFullscreenState])

  return (
    <div className="relative">
      {children}
      {!isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-gray-200 shadow-xl rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Fullscreen Required</h2>
            <p className="mt-3 text-gray-600">
              For a distraction-free, secure testing experience, please enter fullscreen mode to continue with the test.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={requestFullscreen}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Enter Fullscreen
              </button>
              <p className="text-sm text-gray-500">
                You can press <span className="font-medium">F11</span> or use the browser's fullscreen option.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


