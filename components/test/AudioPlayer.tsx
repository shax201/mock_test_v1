'use client'

import { useEffect, useRef } from 'react'
import AudioPlayer from 'react-h5-audio-player'
import 'react-h5-audio-player/lib/styles.css'

interface AudioPlayerProps {
  src: string
  demo?: boolean
  onEnded?: () => void
  autoPlay?: boolean
}

export default function TestAudioPlayer({ src, demo = false, onEnded, autoPlay = false }: AudioPlayerProps) {
  const playerRef = useRef<any>(null)

  useEffect(() => {
    // Custom CSS to disable seek bar and pause button
    const style = document.createElement('style')
    style.textContent = `
      .rhap_progress-container {
        pointer-events: none !important;
      }
      .rhap_progress-bar {
        pointer-events: none !important;
      }
      .rhap_progress-indicator {
        pointer-events: none !important;
      }
      .rhap_play-pause-button {
        display: none !important;
      }
      .rhap_volume-button {
        display: none !important;
      }
      .rhap_volume-container {
        display: none !important;
      }
      .rhap_time {
        display: none !important;
      }
      .rhap_controls-section {
        justify-content: center !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const customControls = [
    'play',
    // Removed 'pause' to prevent pausing
    'volume',
    'progress'
  ]

  if (demo) {
    // For demo, allow normal controls
    return (
      <div className="max-w-md mx-auto">
        <AudioPlayer
          ref={playerRef}
          src={src}
          autoPlay={false}
          onEnded={onEnded}
          layout="horizontal"
          showJumpControls={false}
          customProgressBarSection={[]}
          customAdditionalControls={[]}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <AudioPlayer
        ref={playerRef}
        src={src}
        autoPlay={autoPlay}
        onEnded={onEnded}
        layout="horizontal"
        showJumpControls={false}
        customProgressBarSection={[]}
        customAdditionalControls={[]}
        style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          padding: '16px'
        }}
      />
    </div>
  )
}
