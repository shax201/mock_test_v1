'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface SectionContentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (content: string, contentId: string) => void
  initialContent?: string
  initialContentId?: string
  sectionLabel?: string
}

export default function SectionContentModal({
  isOpen,
  onClose,
  onSave,
  initialContent = '',
  initialContentId = '',
  sectionLabel = 'Section'
}: SectionContentModalProps) {
  const [content, setContent] = useState(initialContent)
  const [contentId, setContentId] = useState(initialContentId)

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent)
      setContentId(initialContentId)
    }
  }, [isOpen, initialContent, initialContentId])

  const handleSave = () => {
    if (!content.trim()) {
      alert('Please enter section content')
      return
    }
    if (!contentId.trim()) {
      alert('Please enter section ID (e.g., A, B, C)')
      return
    }
    onSave(content, contentId.toUpperCase())
    handleClose()
  }

  const handleClose = () => {
    setContent('')
    setContentId('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialContent ? 'Edit' : 'Create'} {sectionLabel}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Section ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section ID *
            </label>
            <input
              type="text"
              value={contentId}
              onChange={(e) => setContentId(e.target.value.toUpperCase())}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., A, B, C, D..."
              maxLength={1}
            />
            <p className="mt-1 text-xs text-gray-500">
              Single letter identifier for this section
            </p>
          </div>

          {/* Section Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Content *
            </label>
            <textarea
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter passage content for this section..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {initialContent ? 'Update Section' : 'Create Section'}
          </button>
        </div>
      </div>
    </div>
  )
}

