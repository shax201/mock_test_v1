'use client'

import { useState } from 'react'

interface SummaryBlank {
  id: string
  position: number
  correctAnswer: string
  alternatives?: string[]
}

interface SummaryCompletionData {
  title: string
  instructions: string
  content: string
  blanks: SummaryBlank[]
}

interface SummaryCompletionEditorProps {
  data: SummaryCompletionData
  onChange: (data: SummaryCompletionData) => void
}

export default function SummaryCompletionEditor({ data, onChange }: SummaryCompletionEditorProps) {
  const [localData, setLocalData] = useState<SummaryCompletionData>(data)

  const updateData = (updates: Partial<SummaryCompletionData>) => {
    const newData = { ...localData, ...updates }
    setLocalData(newData)
    onChange(newData)
  }

  const addBlank = () => {
    const newBlank: SummaryBlank = {
      id: `blank-${Date.now()}`,
      position: localData.blanks.length + 1,
      correctAnswer: '',
      alternatives: []
    }
    updateData({
      blanks: [...localData.blanks, newBlank]
    })
  }

  const updateBlank = (id: string, updates: Partial<SummaryBlank>) => {
    const updatedBlanks = localData.blanks.map(blank => 
      blank.id === id ? { ...blank, ...updates } : blank
    )
    updateData({ blanks: updatedBlanks })
  }

  const removeBlank = (id: string) => {
    updateData({
      blanks: localData.blanks.filter(blank => blank.id !== id)
    })
  }

  const addAlternative = (blankId: string) => {
    const blank = localData.blanks.find(b => b.id === blankId)
    if (blank) {
      const newAlternatives = [...(blank.alternatives || []), '']
      updateBlank(blankId, { alternatives: newAlternatives })
    }
  }

  const updateAlternative = (blankId: string, index: number, value: string) => {
    const blank = localData.blanks.find(b => b.id === blankId)
    if (blank) {
      const newAlternatives = [...(blank.alternatives || [])]
      newAlternatives[index] = value
      updateBlank(blankId, { alternatives: newAlternatives })
    }
  }

  const removeAlternative = (blankId: string, index: number) => {
    const blank = localData.blanks.find(b => b.id === blankId)
    if (blank) {
      const newAlternatives = (blank.alternatives || []).filter((_, i) => i !== index)
      updateBlank(blankId, { alternatives: newAlternatives })
    }
  }

  const renderContentWithBlanks = () => {
    let renderedContent = localData.content
    localData.blanks.forEach((blank, index) => {
      const placeholder = `[${blank.position}]`
      renderedContent = renderedContent.replace(placeholder, placeholder)
    })
    return renderedContent
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title
        </label>
        <input
          type="text"
          value={localData.title}
          onChange={(e) => updateData({ title: e.target.value })}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter the title for the summary completion task"
        />
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions
        </label>
        <textarea
          rows={3}
          value={localData.instructions}
          onChange={(e) => updateData({ instructions: e.target.value })}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter instructions for the summary completion task"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Summary Content
        </label>
        <textarea
          rows={6}
          value={localData.content}
          onChange={(e) => updateData({ content: e.target.value })}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter the summary content. Use [1], [2], [3], etc. to mark blank positions."
        />
        <p className="mt-1 text-sm text-gray-500">
          Use [1], [2], [3], etc. to mark where blanks should appear in the summary.
        </p>
      </div>

      {/* Blanks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Blanks</h3>
          <button
            type="button"
            onClick={addBlank}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Blank
          </button>
        </div>

        <div className="space-y-4">
          {localData.blanks.map((blank, index) => (
            <div key={blank.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Blank {blank.position}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeBlank(blank.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correct Answer
                  </label>
                  <input
                    type="text"
                    value={blank.correctAnswer}
                    onChange={(e) => updateBlank(blank.id, { correctAnswer: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter the correct answer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Alternative Answers (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => addAlternative(blank.id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Alternative
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(blank.alternatives || []).map((alternative, altIndex) => (
                      <div key={altIndex} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={alternative}
                          onChange={(e) => updateAlternative(blank.id, altIndex, e.target.value)}
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Alternative answer"
                        />
                        <button
                          type="button"
                          onClick={() => removeAlternative(blank.id, altIndex)}
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
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      {localData.content && localData.blanks.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3">Preview</h4>
          <div className="space-y-3">
            <div>
              <h5 className="font-medium text-blue-800 mb-2">{localData.title || 'Summary Completion'}</h5>
              <p className="text-sm text-blue-700 mb-3">{localData.instructions || 'Complete the summary below.'}</p>
            </div>
            <div className="text-sm text-blue-700 leading-relaxed">
              {renderContentWithBlanks().split(/(\[\d+\])/).map((part, index) => {
                const blankMatch = part.match(/\[(\d+)\]/)
                if (blankMatch) {
                  const blankNumber = parseInt(blankMatch[1])
                  const blank = localData.blanks.find(b => b.position === blankNumber)
                  if (blank) {
                    return (
                      <span key={index} className="inline-block mx-1">
                        <span className="inline-block w-20 h-6 border-2 border-dashed border-blue-400 rounded-md px-2 py-1 text-xs font-medium text-center bg-blue-50">
                          [BLANK]
                        </span>
                      </span>
                    )
                  }
                }
                return <span key={index}>{part}</span>
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}