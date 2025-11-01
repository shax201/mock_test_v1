'use client'

import { useState, useEffect } from 'react'

interface MatchingItem {
  id: string
  label: string
  content: string
}

interface MatchingQuestionProps {
  question: string
  leftItems: MatchingItem[]
  rightItems: MatchingItem[]
  onAnswerChange: (answers: Record<string, string>) => void
  initialAnswers?: Record<string, string>
  disabled?: boolean
  instructions?: string
}

export default function MatchingQuestion({ 
  question, 
  leftItems, 
  rightItems, 
  onAnswerChange, 
  initialAnswers = {},
  disabled = false,
  instructions = "Match the items on the left with the items on the right."
}: MatchingQuestionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers)

  useEffect(() => {
    setAnswers(initialAnswers)
  }, [initialAnswers])

  const handleMatchChange = (leftItemId: string, rightItemId: string) => {
    const newAnswers = { ...answers, [leftItemId]: rightItemId }
    setAnswers(newAnswers)
    onAnswerChange(newAnswers)
  }

  const getAvailableRightItems = (leftItemId: string) => {
    const currentAnswer = answers[leftItemId]
    return rightItems.filter(item => 
      item.id === currentAnswer || !Object.values(answers).includes(item.id)
    )
  }

  return (
    <div className="space-y-6">
      <div className="prose max-w-none">
        <p className="text-gray-900 mb-4">{question}</p>
        {instructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 font-medium">
              {instructions}
            </p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 mb-4">Column A</h4>
          {leftItems.map((item, index) => (
            <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <span className="text-gray-900">{item.content}</span>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 mb-4">Column B</h4>
          {rightItems.map((item, index) => (
            <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-medium">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="text-gray-900">{item.content}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Matching Interface */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Your Matches</h4>
        {leftItems.map((leftItem, index) => (
          <div key={leftItem.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </span>
            <span className="text-gray-900 flex-1">{leftItem.content}</span>
            <span className="text-gray-500">→</span>
            <select
              value={answers[leftItem.id] || ''}
              onChange={(e) => handleMatchChange(leftItem.id, e.target.value)}
              disabled={disabled}
              className="flex-shrink-0 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select match...</option>
              {getAvailableRightItems(leftItem.id).map((rightItem, rightIndex) => (
                <option key={rightItem.id} value={rightItem.id}>
                  {String.fromCharCode(65 + rightIndex)} - {rightItem.content}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Progress:</strong> {Object.keys(answers).filter(key => answers[key]).length} of {leftItems.length} matches completed.
        </p>
      </div>
    </div>
  )
}

// Helper function to validate answers
export function validateMatchingAnswers(
  userAnswers: Record<string, string>,
  correctAnswers: Record<string, string>
): { score: number; total: number; feedback: Record<string, { correct: boolean; message: string }> } {
  let score = 0
  const total = Object.keys(correctAnswers).length
  const feedback: Record<string, { correct: boolean; message: string }> = {}

  Object.keys(correctAnswers).forEach(leftItemId => {
    const userAnswer = userAnswers[leftItemId]
    const correctAnswer = correctAnswers[leftItemId]
    const isCorrect = userAnswer === correctAnswer

    if (isCorrect) {
      score++
    }

    feedback[leftItemId] = {
      correct: isCorrect,
      message: isCorrect 
        ? 'Correct match!' 
        : `Incorrect. The correct match is: ${correctAnswer}`
    }
  })

  return { score, total, feedback }
}
