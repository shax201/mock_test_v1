'use client'

import { useState, useEffect } from 'react'
import AdvancedTextEditor from './AdvancedTextEditor'

interface PartContentModalProps {
  isOpen: boolean
  onClose: () => void
  partNumber: 1 | 2 | 3
  content: string
  onSave: (content: string) => void
  title?: string
}

export default function PartContentModal({
  isOpen,
  onClose,
  partNumber,
  content,
  onSave,
  title
}: PartContentModalProps) {
  const [localContent, setLocalContent] = useState(content)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    setLocalContent(content)
  }, [content])

  const handleSave = () => {
    console.log('Save button clicked')
    console.log('localContent:', localContent)
    console.log('onSave function:', onSave)
    onSave(localContent)
    onClose()
  }

  const handleClose = () => {
    setLocalContent(content) // Reset to original content
    onClose()
  }

  if (!isClient || !isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {title || `Edit Part ${partNumber} Content`}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                This content will be displayed at the top of Part {partNumber} for students.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Part {partNumber} Content
                </label>
                <AdvancedTextEditor
                  data={localContent}
                  onChange={setLocalContent}
                  placeholder={`Enter content for Part ${partNumber}...`}
                  minHeight={300}
                  maxHeight={500}
                />
              </div>
              
              {/* Content Preview */}
              {localContent && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: localContent
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/__(.*?)__/g, '<u>$1</u>')
                          .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold">$1</h1>')
                          .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold">$1</h2>')
                          .replace(/<div style="text-align: (left|center|right|justify);">(.*?)<\/div>/g, '<div style="text-align: $1;" class="my-2">$2</div>')
                          .replace(/\n/g, '<br>')
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Content
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
