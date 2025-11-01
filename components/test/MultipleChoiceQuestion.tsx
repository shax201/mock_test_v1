'use client'

import { useState, useEffect } from 'react'

interface MultipleChoiceQuestionProps {
  question: string
  options: string[]
  onAnswerChange: (answer: string) => void
  initialAnswer?: string
  disabled?: boolean
  allowMultiple?: boolean
}

export default function MultipleChoiceQuestion({ 
  question, 
  options, 
  onAnswerChange, 
  initialAnswer = '', 
  disabled = false,
  allowMultiple = false
}: MultipleChoiceQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState(initialAnswer)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
    initialAnswer ? initialAnswer.split(',') : []
  )

  useEffect(() => {
    if (allowMultiple) {
      setSelectedAnswers(initialAnswer ? initialAnswer.split(',') : [])
    } else {
      setSelectedAnswer(initialAnswer)
    }
  }, [initialAnswer, allowMultiple])

  const handleSingleAnswerChange = (answer: string) => {
    setSelectedAnswer(answer)
    onAnswerChange(answer)
  }

  const handleMultipleAnswerChange = (option: string) => {
    const newAnswers = selectedAnswers.includes(option)
      ? selectedAnswers.filter(a => a !== option)
      : [...selectedAnswers, option]
    
    setSelectedAnswers(newAnswers)
    onAnswerChange(newAnswers.join(','))
  }

  if (allowMultiple) {
    return (
      <div className="space-y-4">
        <div className="prose max-w-none">
          <p className="text-gray-900 mb-4">{question}</p>
          <p className="text-sm text-gray-600 mb-4">
            <strong>Note:</strong> You may select multiple answers.
          </p>
        </div>
        
        <div className="space-y-3">
          {options.map((option, index) => (
            <label key={index} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                value={option}
                checked={selectedAnswers.includes(option)}
                onChange={(e) => handleMultipleAnswerChange(e.target.value)}
                disabled={disabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="prose max-w-none">
        <p className="text-gray-900 mb-4">{question}</p>
      </div>
      
      <div className="space-y-3">
        {options.map((option, index) => (
          <label key={index} className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="multiple-choice-answer"
              value={option}
              checked={selectedAnswer === option}
              onChange={(e) => handleSingleAnswerChange(e.target.value)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-3 text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// Helper function to validate answers
export function validateMultipleChoiceAnswer(
  userAnswer: string, 
  correctAnswer: string | string[],
  allowMultiple: boolean = false
): { correct: boolean; message: string } {
  if (allowMultiple) {
    const userAnswers = userAnswer.split(',').sort()
    const correctAnswers = Array.isArray(correctAnswer) 
      ? correctAnswer.sort() 
      : [correctAnswer]
    
    const isCorrect = userAnswers.length === correctAnswers.length &&
      userAnswers.every((answer, index) => answer === correctAnswers[index])
    
    return {
      correct: isCorrect,
      message: isCorrect 
        ? 'Correct!' 
        : `Incorrect. The correct answer(s) is/are: ${Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer}`
    }
  } else {
    const isCorrect = userAnswer === correctAnswer
    
    return {
      correct: isCorrect,
      message: isCorrect 
        ? 'Correct!' 
        : `Incorrect. The correct answer is: ${correctAnswer}`
    }
  }
}
