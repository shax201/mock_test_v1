'use client'

import { useState, useEffect, useRef } from 'react'

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

interface FillInTheBlankQuestionProps {
  data: FillInTheBlankData
  onAnswerChange: (answers: Record<string, string>) => void
  initialAnswers?: Record<string, string>
  disabled?: boolean
}

export default function FillInTheBlankQuestion({ 
  data, 
  onAnswerChange, 
  initialAnswers = {},
  disabled = false 
}: FillInTheBlankQuestionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers)

  const handleInputChange = (blankId: string, value: string) => {
    const newAnswers = { ...answers, [blankId]: value }
    setAnswers(newAnswers)
    onAnswerChange(newAnswers)
  }

  // Render content with proper input fields
  const renderContentWithInputs = () => {
    if (!data.content) return null

    let content = data.content
    
    // Replace blank placeholders with React input components
    data.blanks.forEach((blank, index) => {
      const blankPlaceholder = new RegExp(
        `<span class="blank-field" data-blank-id="${blank.id}"[^>]*>\\[BLANK\\]</span>`,
        'g'
      )
      
      // Create a unique placeholder that we'll replace with actual input
      const inputPlaceholder = `__INPUT_${blank.id}__`
      content = content.replace(blankPlaceholder, inputPlaceholder)
    })

    // Split content and render with inputs
    const parts = content.split(/__INPUT_\w+__/)
    const inputIds = content.match(/__INPUT_(\w+)__/g) || []
    
    return (
      <div className="prose max-w-none">
        {parts.map((part, index) => (
          <span key={index}>
            <span dangerouslySetInnerHTML={{ __html: part }} />
            {index < inputIds.length && (
              <InputField
                blankId={data.blanks[index].id}
                value={answers[data.blanks[index].id] || ''}
                onChange={(value) => handleInputChange(data.blanks[index].id, value)}
                disabled={disabled}
                placeholder={`Answer ${index + 1}`}
              />
            )}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.instructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium">
            {data.instructions}
          </p>
        </div>
      )}
      
      {renderContentWithInputs()}
      
      {data.blanks.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> Fill in all {data.blanks.length} blank field{data.blanks.length > 1 ? 's' : ''} above.
          </p>
        </div>
      )}
    </div>
  )
}

// Individual input field component
function InputField({ 
  blankId, 
  value, 
  onChange, 
  disabled, 
  placeholder 
}: {
  blankId: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
  placeholder: string
}) {
  return (
    <input
      type="text"
      data-blank-id={blankId}
      className="inline-block border-2 border-dashed border-gray-400 bg-gray-50 px-3 py-2 rounded text-center min-w-24 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-500"
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      style={{
        margin: '0 4px',
        verticalAlign: 'middle',
        fontFamily: 'inherit',
        fontSize: 'inherit'
      }}
    />
  )
}

// Helper function to validate answers
export function validateFillInTheBlankAnswers(
  data: FillInTheBlankData, 
  answers: Record<string, string>
): { score: number; total: number; feedback: Record<string, { correct: boolean; message: string }> } {
  let score = 0
  const total = data.blanks.length
  const feedback: Record<string, { correct: boolean; message: string }> = {}

  data.blanks.forEach(blank => {
    const userAnswer = answers[blank.id]?.trim() || ''
    const correctAnswer = blank.correctAnswer.trim()
    const alternatives = blank.alternatives || []
    
    let isCorrect = false
    let message = ''

    if (blank.caseSensitive) {
      isCorrect = userAnswer === correctAnswer || 
        alternatives.some(alt => userAnswer === alt.trim())
    } else {
      isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase() ||
        alternatives.some(alt => userAnswer.toLowerCase() === alt.trim().toLowerCase())
    }

    if (isCorrect) {
      score++
      message = 'Correct!'
    } else {
      message = `Incorrect. Expected: ${correctAnswer}${alternatives.length > 0 ? ` (or: ${alternatives.join(', ')})` : ''}`
    }

    feedback[blank.id] = { correct: isCorrect, message }
  })

  return { score, total, feedback }
}
