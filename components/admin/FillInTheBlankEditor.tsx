'use client'

import { useState, useCallback, useEffect } from 'react'
import FillInTheBlankQuestion from '../test/FillInTheBlankQuestion'
import AdvancedTextEditor from './AdvancedTextEditor'

interface BlankField {
  id: string
  position: number
  correctAnswer: string
  alternatives?: string[]
  caseSensitive: boolean
}

interface FillInTheBlankData {
  content: string
  blanks: BlankField[]
  instructions: string
}

interface FillInTheBlankEditorProps {
  data: FillInTheBlankData
  onChange: (data: FillInTheBlankData) => void
}

export default function FillInTheBlankEditor({ data, onChange }: FillInTheBlankEditorProps) {
  const [editorData, setEditorData] = useState(data.content || '')
  const [blanks, setBlanks] = useState<BlankField[]>(data.blanks || [])
  const [instructions, setInstructions] = useState(data.instructions || '')

  // Update parent when data changes
  useEffect(() => {
    onChange({
      content: editorData,
      blanks,
      instructions
    })
  }, [editorData, blanks, instructions, onChange])

  const insertBlank = useCallback(() => {
    const newBlank: BlankField = {
      id: `blank-${Date.now()}`,
      position: editorData.length,
      correctAnswer: '',
      alternatives: [],
      caseSensitive: false
    }
    
    const blankPlaceholder = `<span class="blank-field" data-blank-id="${newBlank.id}" contenteditable="false" style="background-color: #f3f4f6; border: 2px dashed #9ca3af; padding: 2px 8px; border-radius: 4px; margin: 0 2px; display: inline-block; min-width: 60px;">[BLANK]</span>`
    
    setEditorData(prev => prev + blankPlaceholder)
    setBlanks(prev => [...prev, newBlank])
  }, [editorData])

  const updateBlank = (blankId: string, updates: Partial<BlankField>) => {
    setBlanks(prev => prev.map(blank => 
      blank.id === blankId ? { ...blank, ...updates } : blank
    ))
  }

  const removeBlank = (blankId: string) => {
    setBlanks(prev => prev.filter(blank => blank.id !== blankId))
    // Remove the blank placeholder from editor content
    setEditorData(prev => prev.replace(
      new RegExp(`<span class="blank-field" data-blank-id="${blankId}"[^>]*>\\[BLANK\\]</span>`, 'g'),
      ''
    ))
  }

  const addAlternative = (blankId: string) => {
    updateBlank(blankId, {
      alternatives: [...(blanks.find(b => b.id === blankId)?.alternatives || []), '']
    })
  }

  const updateAlternative = (blankId: string, index: number, value: string) => {
    const blank = blanks.find(b => b.id === blankId)
    if (blank) {
      const newAlternatives = [...(blank.alternatives || [])]
      newAlternatives[index] = value
      updateBlank(blankId, { alternatives: newAlternatives })
    }
  }

  const removeAlternative = (blankId: string, index: number) => {
    const blank = blanks.find(b => b.id === blankId)
    if (blank) {
      const newAlternatives = blank.alternatives?.filter((_, i) => i !== index) || []
      updateBlank(blankId, { alternatives: newAlternatives })
    }
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions
        </label>
        <textarea
          rows={2}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g., Complete the table below. Write ONE WORD AND/OR A NUMBER in each gap."
        />
      </div>

      {/* Content Editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Question Content
          </label>
          <button
            type="button"
            onClick={insertBlank}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Blank
          </button>
        </div>
        
        <div className="border border-gray-300 rounded-md">
          <AdvancedTextEditor
            data={editorData}
            onChange={(data) => setEditorData(data)}
            placeholder="Start typing your question content here..."
            minHeight={250}
            maxHeight={400}
          />
        </div>
        
        <p className="mt-1 text-sm text-gray-500">
          Use the "Add Blank" button to insert fill-in-the-blank fields in your content.
        </p>
      </div>

      {/* Blank Fields Configuration */}
      {blanks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Configure Blank Fields ({blanks.length})
          </h4>
          <div className="space-y-4">
            {blanks.map((blank, index) => (
              <div key={blank.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-900">
                    Blank Field {index + 1}
                  </h5>
                  <button
                    type="button"
                    onClick={() => removeBlank(blank.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correct Answer *
                    </label>
                    <input
                      type="text"
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={blank.correctAnswer}
                      onChange={(e) => updateBlank(blank.id, { correctAnswer: e.target.value })}
                      placeholder="Enter the correct answer"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={blank.caseSensitive}
                        onChange={(e) => updateBlank(blank.id, { caseSensitive: e.target.checked })}
                      />
                      <span className="ml-2 text-sm text-gray-700">Case sensitive</span>
                    </label>
                  </div>
                </div>

                {/* Alternative Answers */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Alternative Answers (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => addAlternative(blank.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Alternative
                    </button>
                  </div>
                  
                  {blank.alternatives?.map((alternative, altIndex) => (
                    <div key={altIndex} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={alternative}
                        onChange={(e) => updateAlternative(blank.id, altIndex, e.target.value)}
                        placeholder={`Alternative ${altIndex + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeAlternative(blank.id, altIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {editorData && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <FillInTheBlankQuestion
              data={{
                content: editorData,
                blanks,
                instructions
              }}
              onAnswerChange={(answers) => {
                console.log('Preview answers:', answers)
              }}
              initialAnswers={{}}
            />
          </div>
        </div>
      )}
    </div>
  )
}