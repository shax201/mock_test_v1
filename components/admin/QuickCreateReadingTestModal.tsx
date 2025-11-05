'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface QuickCreateReadingTestModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

export default function QuickCreateReadingTestModal({ isOpen, onClose, onCreated }: QuickCreateReadingTestModalProps) {
  const [title, setTitle] = useState('')
  const [totalQuestions, setTotalQuestions] = useState(40)
  const [totalTimeMinutes, setTotalTimeMinutes] = useState(60)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setTotalQuestions(40)
      setTotalTimeMinutes(60)
      setSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const defaultBandScoreRanges = [
    { minScore: 39, band: 9.0 },
    { minScore: 37, band: 8.5 },
    { minScore: 35, band: 8.0 },
    { minScore: 33, band: 7.5 },
    { minScore: 30, band: 7.0 },
    { minScore: 27, band: 6.5 },
    { minScore: 23, band: 6.0 },
    { minScore: 19, band: 5.5 },
    { minScore: 15, band: 5.0 },
    { minScore: 13, band: 4.5 },
    { minScore: 10, band: 4.0 },
    { minScore: 7, band: 3.5 },
    { minScore: 4, band: 3.0 },
    { minScore: 3, band: 2.5 },
    { minScore: 1, band: 2.0 },
    { minScore: 0, band: 0.0 }
  ]

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Please enter a test title')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        totalQuestions,
        totalTimeMinutes,
        passages: [],
        bandScoreRanges: defaultBandScoreRanges
      }
      const res = await fetch('/api/admin/reading-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err.error || 'Failed to create reading test')
      }
      onClose()
      onCreated?.()
    } catch (e: any) {
      alert(e?.message || 'Failed to create reading test')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Quick Create Reading Test</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., IELTS Reading Practice Test"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Questions *</label>
              <input
                type="number"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(parseInt(e.target.value || '0'))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time (minutes) *</label>
              <input
                type="number"
                value={totalTimeMinutes}
                onChange={(e) => setTotalTimeMinutes(parseInt(e.target.value || '0'))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                min={1}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">This creates an empty test with default band ranges. You can add passages and questions later.</p>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}


