'use client'

import { useState } from 'react'
import { applyIELTSRounding } from '@/lib/scoring/band-calculator'

interface BandMarks {
  taskAchievement: number
  coherenceCohesion: number
  lexicalResource: number
  grammarAccuracy: number
}

interface BandMarkingFormProps {
  marks: BandMarks
  onMarksChange: (marks: BandMarks) => void
  onFeedbackAdd: (text: string, comment: string, range: [number, number]) => void
  onSubmit: () => void
  saving: boolean
}

export default function BandMarkingForm({
  marks,
  onMarksChange,
  onFeedbackAdd,
  onSubmit,
  saving
}: BandMarkingFormProps) {
  const [newFeedback, setNewFeedback] = useState({
    text: '',
    comment: ''
  })

  const bandOptions = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]

  const handleMarkChange = (criteria: keyof BandMarks, value: number) => {
    onMarksChange({
      ...marks,
      [criteria]: value
    })
  }

  const calculateOverallBand = () => {
    const average = (marks.taskAchievement + marks.coherenceCohesion + marks.lexicalResource + marks.grammarAccuracy) / 4
    return applyIELTSRounding(average)
  }

  const handleAddFeedback = () => {
    if (newFeedback.text.trim() && newFeedback.comment.trim()) {
      onFeedbackAdd(
        newFeedback.text,
        newFeedback.comment,
        [0, newFeedback.text.length] // Simplified range
      )
      setNewFeedback({ text: '', comment: '' })
    }
  }

  const criteria = [
    {
      key: 'taskAchievement' as keyof BandMarks,
      name: 'Task Achievement',
      description: 'How well the task is completed and requirements are met'
    },
    {
      key: 'coherenceCohesion' as keyof BandMarks,
      name: 'Coherence & Cohesion',
      description: 'Organization and linking of ideas'
    },
    {
      key: 'lexicalResource' as keyof BandMarks,
      name: 'Lexical Resource',
      description: 'Vocabulary range and accuracy'
    },
    {
      key: 'grammarAccuracy' as keyof BandMarks,
      name: 'Grammar Range & Accuracy',
      description: 'Grammatical structures and accuracy'
    }
  ]

  return (
    <div className="bg-white shadow rounded-lg p-6 sticky top-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Band Marking</h2>
      
      {/* Criteria Selection */}
      <div className="space-y-6">
        {criteria.map((criterion) => (
          <div key={criterion.key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {criterion.name}
            </label>
            <p className="text-xs text-gray-500 mb-3">{criterion.description}</p>
            <select
              value={marks[criterion.key]}
              onChange={(e) => handleMarkChange(criterion.key, parseFloat(e.target.value))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
            >
              {bandOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Overall Band */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-900">Overall Band:</span>
          <span className="text-2xl font-bold text-green-800">
            {calculateOverallBand()}
          </span>
        </div>
        <p className="text-xs text-green-700 mt-1">
          Average: {((marks.taskAchievement + marks.coherenceCohesion + marks.lexicalResource + marks.grammarAccuracy) / 4).toFixed(2)}
        </p>
      </div>

      {/* Feedback Section */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Add Feedback</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Text to comment on
            </label>
            <input
              type="text"
              value={newFeedback.text}
              onChange={(e) => setNewFeedback(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Select text from the writing..."
              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Your comment
            </label>
            <textarea
              rows={3}
              value={newFeedback.comment}
              onChange={(e) => setNewFeedback(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Provide specific feedback..."
              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <button
            onClick={handleAddFeedback}
            disabled={!newFeedback.text.trim() || !newFeedback.comment.trim()}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Feedback
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-8">
        <button
          onClick={onSubmit}
          disabled={saving || calculateOverallBand() === 0}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Submit Marks & Feedback'}
        </button>
      </div>

      {/* Band Descriptions */}
      <div className="mt-6 text-xs text-gray-500">
        <h4 className="font-medium mb-2">Band Descriptions:</h4>
        <ul className="space-y-1">
          <li>9: Expert user</li>
          <li>8: Very good user</li>
          <li>7: Good user</li>
          <li>6: Competent user</li>
          <li>5: Modest user</li>
          <li>4: Limited user</li>
        </ul>
      </div>
    </div>
  )
}
