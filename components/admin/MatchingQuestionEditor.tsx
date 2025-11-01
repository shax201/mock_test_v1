'use client'

import { useState, useEffect } from 'react'

interface MatchingItem {
  id: string
  label: string
  content: string
}

interface MatchingData {
  leftItems: MatchingItem[]
  rightItems: MatchingItem[]
}

interface MatchingQuestionEditorProps {
  data: MatchingData
  onChange: (data: MatchingData) => void
}

export default function MatchingQuestionEditor({ data, onChange }: MatchingQuestionEditorProps) {
  const [leftItems, setLeftItems] = useState<MatchingItem[]>(data.leftItems || [])
  const [rightItems, setRightItems] = useState<MatchingItem[]>(data.rightItems || [])

  useEffect(() => {
    onChange({ leftItems, rightItems })
  }, [leftItems, rightItems, onChange])

  const addLeftItem = () => {
    const newItem: MatchingItem = {
      id: `left-${Date.now()}`,
      label: `${leftItems.length + 1}`,
      content: ''
    }
    setLeftItems([...leftItems, newItem])
  }

  const addRightItem = () => {
    const newItem: MatchingItem = {
      id: `right-${Date.now()}`,
      label: String.fromCharCode(65 + rightItems.length),
      content: ''
    }
    setRightItems([...rightItems, newItem])
  }

  const updateLeftItem = (id: string, content: string) => {
    setLeftItems(leftItems.map(item => 
      item.id === id ? { ...item, content } : item
    ))
  }

  const updateRightItem = (id: string, content: string) => {
    setRightItems(rightItems.map(item => 
      item.id === id ? { ...item, content } : item
    ))
  }

  const removeLeftItem = (id: string) => {
    setLeftItems(leftItems.filter(item => item.id !== id))
  }

  const removeRightItem = (id: string) => {
    setRightItems(rightItems.filter(item => item.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Column A (Left Items)</h4>
            <button
              type="button"
              onClick={addLeftItem}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Item
            </button>
          </div>
          
          <div className="space-y-3">
            {leftItems.map((item, index) => (
              <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={item.content}
                  onChange={(e) => updateLeftItem(item.id, e.target.value)}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={`Item ${index + 1} content`}
                />
                <button
                  type="button"
                  onClick={() => removeLeftItem(item.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Column B (Right Items)</h4>
            <button
              type="button"
              onClick={addRightItem}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Item
            </button>
          </div>
          
          <div className="space-y-3">
            {rightItems.map((item, index) => (
              <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <input
                  type="text"
                  value={item.content}
                  onChange={(e) => updateRightItem(item.id, e.target.value)}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder={`Item ${String.fromCharCode(65 + index)} content`}
                />
                <button
                  type="button"
                  onClick={() => removeRightItem(item.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      {leftItems.length > 0 && rightItems.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3">Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-blue-800 mb-2">Column A</h5>
              <div className="space-y-2">
                {leftItems.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm text-blue-700">{item.content || `Item ${index + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="font-medium text-blue-800 mb-2">Column B</h5>
              <div className="space-y-2">
                {rightItems.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-sm text-blue-700">{item.content || `Item ${String.fromCharCode(65 + index)}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
