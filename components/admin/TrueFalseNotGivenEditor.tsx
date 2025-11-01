'use client'

import { useState } from 'react'

interface TrueFalseNotGivenData {
  statement: string
  correctAnswer: 'TRUE' | 'FALSE' | 'NOT_GIVEN'
  explanation?: string
}

interface TrueFalseNotGivenEditorProps {
  data: TrueFalseNotGivenData
  onChange: (data: TrueFalseNotGivenData) => void
}

export default function TrueFalseNotGivenEditor({ data, onChange }: TrueFalseNotGivenEditorProps) {
  const [localData, setLocalData] = useState<TrueFalseNotGivenData>(data)

  const updateData = (updates: Partial<TrueFalseNotGivenData>) => {
    const newData = { ...localData, ...updates }
    setLocalData(newData)
    onChange(newData)
  }

  return (
    <div className="space-y-6">
      {/* Statement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Statement
        </label>
        <textarea
          rows={4}
          value={localData.statement}
          onChange={(e) => updateData({ statement: e.target.value })}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter the statement that students will evaluate as TRUE, FALSE, or NOT GIVEN"
        />
      </div>

      {/* Correct Answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Correct Answer
        </label>
        <div className="space-y-2">
          {(['TRUE', 'FALSE', 'NOT_GIVEN'] as const).map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                name="correctAnswer"
                value={option}
                checked={localData.correctAnswer === option}
                onChange={(e) => updateData({ correctAnswer: e.target.value as 'TRUE' | 'FALSE' | 'NOT_GIVEN' })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Explanation (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Explanation (Optional)
        </label>
        <textarea
          rows={3}
          value={localData.explanation || ''}
          onChange={(e) => updateData({ explanation: e.target.value })}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter an explanation for why this is the correct answer (optional)"
        />
      </div>

      {/* Preview */}
      {localData.statement && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3">Preview</h4>
          <div className="space-y-3">
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-2">Statement:</p>
              <p className="bg-white p-3 rounded border">{localData.statement}</p>
            </div>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-2">Students will choose:</p>
              <div className="flex space-x-4">
                {(['TRUE', 'FALSE', 'NOT_GIVEN'] as const).map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="radio"
                      name="preview"
                      disabled
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            {localData.explanation && (
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-2">Explanation:</p>
                <p className="bg-white p-3 rounded border text-gray-600">{localData.explanation}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}