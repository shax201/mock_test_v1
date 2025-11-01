'use client'

import { useState, useEffect } from 'react'

interface TimerProps {
  timeRemaining: number
  onTimeUp: () => void
}

export default function Timer({ timeRemaining, onTimeUp }: TimerProps) {
  const [displayTime, setDisplayTime] = useState(timeRemaining)
  const [isWarning, setIsWarning] = useState(false)

  useEffect(() => {
    setDisplayTime(timeRemaining)
    setIsWarning(timeRemaining <= 5 * 60) // Warning when 5 minutes or less
  }, [timeRemaining])

  useEffect(() => {
    if (displayTime <= 0) {
      onTimeUp()
      return
    }

    const timer = setInterval(() => {
      setDisplayTime(prev => {
        if (prev <= 1) {
          onTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [displayTime, onTimeUp])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`flex items-center space-x-1 text-sm ${
      isWarning ? 'text-red-600' : 'text-gray-500'
    }`}>
      <span className="font-mono">
        {formatTime(displayTime)} remaining
      </span>
      {isWarning && (
        <span className="text-xs font-medium animate-pulse ml-2">
          !
        </span>
      )}
    </div>
  )
}
