'use client'

import { useState, useEffect } from 'react'
import FillInTheBlankQuestion from './FillInTheBlankQuestion'
import TrueFalseQuestion from './TrueFalseQuestion'
import MultipleChoiceQuestion from './MultipleChoiceQuestion'
import MatchingQuestion from './MatchingQuestion'

interface Question {
  id: string
  type: 'MCQ' | 'FIB' | 'MATCHING' | 'TRUE_FALSE' | 'NOT_GIVEN'
  content: string
  options?: string[]
  fibData?: {
    content: string
    blanks: Array<{
      id: string
      position: number
      correctAnswer: string
      alternatives?: string[]
      caseSensitive: boolean
    }>
    instructions: string
  }
  matchingData?: {
    leftItems: Array<{
      id: string
      label: string
      content: string
    }>
    rightItems: Array<{
      id: string
      label: string
      content: string
    }>
  }
  instructions?: string
  correctAnswer: string | string[] | Record<string, string>
  points: number
}

interface QuestionRendererProps {
  question: Question
  questionNumber: number
  onAnswerChange: (questionId: string, answer: string | Record<string, string>) => void
  initialAnswer?: string | Record<string, string>
  disabled?: boolean
  showInstructions?: boolean
}

export default function QuestionRenderer({
  question,
  questionNumber,
  onAnswerChange,
  initialAnswer,
  disabled = false,
  showInstructions = true
}: QuestionRendererProps) {
  const [currentAnswer, setCurrentAnswer] = useState<string | Record<string, string>>(
    initialAnswer || (question.type === 'FIB' ? {} : '')
  )

  useEffect(() => {
    setCurrentAnswer(initialAnswer || (question.type === 'FIB' ? {} : ''))
  }, [initialAnswer, question.type])

  const handleAnswerChange = (answer: string | Record<string, string>) => {
    setCurrentAnswer(answer)
    onAnswerChange(question.id, answer)
  }

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'FIB':
        if (question.fibData) {
          return (
            <FillInTheBlankQuestion
              data={question.fibData}
              onAnswerChange={(fibAnswers) => {
                handleAnswerChange(fibAnswers)
              }}
              initialAnswers={typeof currentAnswer === 'object' ? currentAnswer : {}}
              disabled={disabled}
            />
          )
        } else {
          // Simple fill-in-the-blank without structured data
          return (
            <div className="space-y-4">
              <div className="prose max-w-none">
                <p className="text-gray-900 mb-4">{question.content}</p>
              </div>
              <input
                type="text"
                value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                disabled={disabled}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Your answer..."
              />
            </div>
          )
        }

      case 'TRUE_FALSE':
        return (
          <TrueFalseQuestion
            question={question.content}
            onAnswerChange={(answer) => handleAnswerChange(answer)}
            initialAnswer={typeof currentAnswer === 'string' ? currentAnswer : ''}
            disabled={disabled}
            includeNotGiven={false}
          />
        )

      case 'NOT_GIVEN':
        return (
          <TrueFalseQuestion
            question={question.content}
            onAnswerChange={(answer) => handleAnswerChange(answer)}
            initialAnswer={typeof currentAnswer === 'string' ? currentAnswer : ''}
            disabled={disabled}
            includeNotGiven={true}
          />
        )

      case 'MCQ':
        return (
          <MultipleChoiceQuestion
            question={question.content}
            options={question.options || []}
            onAnswerChange={(answer) => handleAnswerChange(answer)}
            initialAnswer={typeof currentAnswer === 'string' ? currentAnswer : ''}
            disabled={disabled}
            allowMultiple={false}
          />
        )

      case 'MATCHING':
        if (question.matchingData) {
          return (
            <MatchingQuestion
              question={question.content}
              leftItems={question.matchingData.leftItems}
              rightItems={question.matchingData.rightItems}
              onAnswerChange={(answers) => handleAnswerChange(answers)}
              initialAnswers={typeof currentAnswer === 'object' ? currentAnswer : {}}
              disabled={disabled}
              instructions={question.instructions}
            />
          )
        } else {
          return (
            <div className="space-y-4">
              <div className="prose max-w-none">
                <p className="text-gray-900 mb-4">{question.content}</p>
                <p className="text-red-600 text-sm">
                  Error: Matching question data not found.
                </p>
              </div>
            </div>
          )
        }

      default:
        return (
          <div className="space-y-4">
            <div className="prose max-w-none">
              <p className="text-gray-900 mb-4">{question.content}</p>
              <p className="text-red-600 text-sm">
                Error: Unknown question type "{question.type}".
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="border-b border-gray-200 pb-6 last:border-b-0">
      <div className="flex items-start space-x-4">
        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
          {questionNumber}
        </span>
        
        <div className="flex-1">
          {showInstructions && question.instructions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 font-medium">
                {question.instructions}
              </p>
            </div>
          )}
          
          {renderQuestionContent()}
        </div>
      </div>
    </div>
  )
}

// Helper function to get question type display name
export function getQuestionTypeDisplayName(type: string): string {
  switch (type) {
    case 'MCQ':
      return 'Multiple Choice'
    case 'FIB':
      return 'Fill in the Blank'
    case 'MATCHING':
      return 'Matching'
    case 'TRUE_FALSE':
      return 'True/False'
    case 'NOT_GIVEN':
      return 'True/False/Not Given'
    default:
      return 'Unknown'
  }
}

// Helper function to validate question answers
export function validateQuestionAnswer(
  question: Question,
  userAnswer: string | Record<string, string>
): { correct: boolean; score: number; maxScore: number; feedback: string } {
  const maxScore = question.points || 1
  
  switch (question.type) {
    case 'FIB':
      if (question.fibData) {
        const fibAnswers = typeof userAnswer === 'object' ? userAnswer : {}
        const validation = validateFillInTheBlankAnswers(question.fibData, fibAnswers)
        return {
          correct: validation.score === validation.total,
          score: validation.score,
          maxScore: validation.total,
          feedback: `Score: ${validation.score}/${validation.total}`
        }
      }
      return {
        correct: userAnswer === question.correctAnswer,
        score: userAnswer === question.correctAnswer ? maxScore : 0,
        maxScore,
        feedback: userAnswer === question.correctAnswer ? 'Correct!' : 'Incorrect'
      }

    case 'TRUE_FALSE':
    case 'NOT_GIVEN':
      const tfValidation = validateTrueFalseAnswer(
        typeof userAnswer === 'string' ? userAnswer : '',
        typeof question.correctAnswer === 'string' ? question.correctAnswer : ''
      )
      return {
        correct: tfValidation.correct,
        score: tfValidation.correct ? maxScore : 0,
        maxScore,
        feedback: tfValidation.message
      }

    case 'MCQ':
      const mcqValidation = validateMultipleChoiceAnswer(
        typeof userAnswer === 'string' ? userAnswer : '',
        Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer as string],
        false
      )
      return {
        correct: mcqValidation.correct,
        score: mcqValidation.correct ? maxScore : 0,
        maxScore,
        feedback: mcqValidation.message
      }

    case 'MATCHING':
      if (question.matchingData) {
        const matchingAnswers = typeof userAnswer === 'object' && !Array.isArray(userAnswer) ? userAnswer : {}
        const correctAnswers = typeof question.correctAnswer === 'object' && !Array.isArray(question.correctAnswer) ? question.correctAnswer : {}
        const validation = validateMatchingAnswers(matchingAnswers as Record<string, string>, correctAnswers as Record<string, string>)
        return {
          correct: validation.score === validation.total,
          score: validation.score,
          maxScore: validation.total,
          feedback: `Score: ${validation.score}/${validation.total}`
        }
      }
      return {
        correct: false,
        score: 0,
        maxScore,
        feedback: 'Error: Matching data not found'
      }

    default:
      return {
        correct: false,
        score: 0,
        maxScore,
        feedback: 'Unknown question type'
      }
  }
}

// Import validation functions
import { validateFillInTheBlankAnswers } from './FillInTheBlankQuestion'
import { validateTrueFalseAnswer } from './TrueFalseQuestion'
import { validateMultipleChoiceAnswer } from './MultipleChoiceQuestion'
import { validateMatchingAnswers } from './MatchingQuestion'
