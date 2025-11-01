'use client'

import { useState, useEffect } from 'react'

interface TrueFalseQuestionProps {
  question: string
  onAnswerChange: (answer: string) => void
  initialAnswer?: string
  disabled?: boolean
  includeNotGiven?: boolean
}

export default function TrueFalseQuestion({ 
  question, 
  onAnswerChange, 
  initialAnswer = '', 
  disabled = false,
  includeNotGiven = false 
}: TrueFalseQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState(initialAnswer)

  useEffect(() => {
    setSelectedAnswer(initialAnswer)
  }, [initialAnswer])

  const handleAnswerChange = (answer: string) => {
    setSelectedAnswer(answer)
    onAnswerChange(answer)
  }

  const options = includeNotGiven 
    ? [
        { value: 'TRUE', label: 'True' },
        { value: 'FALSE', label: 'False' },
        { value: 'NOT_GIVEN', label: 'Not Given' }
      ]
    : [
        { value: 'TRUE', label: 'True' },
        { value: 'FALSE', label: 'False' }
      ]

  return (
    <div className="space-y-4">
      <div className="prose max-w-none">
        <p className="text-gray-900 mb-4">{question}</p>
      </div>
      
      <div className="space-y-3">
        {options.map((option) => (
          <label key={option.value} className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="true-false-answer"
              value={option.value}
              checked={selectedAnswer === option.value}
              onChange={(e) => handleAnswerChange(e.target.value)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-3 text-gray-700 font-medium">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// Helper function to validate answers
export function validateTrueFalseAnswer(
  userAnswer: string, 
  correctAnswer: string
): { correct: boolean; message: string } {
  const isCorrect = userAnswer === correctAnswer
  
  return {
    correct: isCorrect,
    message: isCorrect 
      ? 'Correct!' 
      : `Incorrect. The correct answer is: ${correctAnswer}`
  }
}
