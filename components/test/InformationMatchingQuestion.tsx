'use client'

import { useState, useEffect } from 'react'

interface PassageSection {
  id: string
  content: string
}

interface InformationMatchingQuestionProps {
  question: {
    id: string
    passage: {
      title: string
      sections: PassageSection[]
    }
    questions: string[]
    correctAnswers: Record<string, string>
    instructions: string
  }
  onAnswerChange: (answers: Record<string, string>) => void
  initialAnswers?: Record<string, string>
  disabled?: boolean
}

export default function InformationMatchingQuestion({
  question,
  onAnswerChange,
  initialAnswers = {},
  disabled = false
}: InformationMatchingQuestionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers)

  useEffect(() => {
    setAnswers(initialAnswers)
  }, [initialAnswers])

  const handleAnswerChange = (questionId: string, sectionId: string) => {
    const newAnswers = { ...answers, [questionId]: sectionId }
    setAnswers(newAnswers)
    onAnswerChange(newAnswers)
  }

  const getAvailableSections = (questionId: string) => {
    const currentAnswer = answers[questionId]
    return question.passage.sections.filter(section => 
      section.id === currentAnswer || !Object.values(answers).includes(section.id)
    )
  }

  const getUsedSections = () => {
    return Object.values(answers).filter(Boolean)
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 font-medium">
          {question.instructions}
        </p>
      </div>

      {/* Reading Passage */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          {question.passage.title}
        </h3>
        
        <div className="space-y-6">
          {question.passage.sections.map((section) => (
            <div key={section.id} className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                  {section.id}
                </span>
                <h4 className="text-lg font-semibold text-gray-900">
                  Section {section.id}
                </h4>
              </div>

              {/* Section Content */}
              <div className="bg-gray-50 rounded-lg p-4 ml-11">
                <p className="text-gray-900 leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">
          Questions {question.questions.length > 0 ? `1-${question.questions.length}` : ''}
        </h4>
        
        <div className="space-y-4">
          {question.questions.map((questionText, index) => {
            const questionId = (index + 1).toString()
            return (
              <div key={questionId} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-medium">
                  {questionId}
                </span>
                <span className="text-gray-900 flex-1">{questionText}</span>
                <span className="text-gray-500">→</span>
                <select
                  value={answers[questionId] || ''}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  disabled={disabled}
                  className="flex-shrink-0 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 min-w-[80px]"
                >
                  <option value="">Select...</option>
                  {getAvailableSections(questionId).map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.id}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      </div>

      {/* Answer Grid */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Answer Grid</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-medium text-gray-900">
                  Question
                </th>
                {question.passage.sections.map((section) => (
                  <th key={section.id} className="border border-gray-300 bg-gray-100 px-4 py-2 text-center font-medium text-gray-900">
                    {section.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.questions.map((_, index) => {
                const questionId = (index + 1).toString()
                return (
                  <tr key={questionId}>
                    <td className="border border-gray-300 px-4 py-2 font-medium text-gray-900">
                      {questionId}
                    </td>
                    {question.passage.sections.map((section) => (
                      <td key={section.id} className="border border-gray-300 px-4 py-2 text-center">
                        <input
                          type="radio"
                          name={`question-${questionId}`}
                          value={section.id}
                          checked={answers[questionId] === section.id}
                          onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                          disabled={disabled}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            <strong>Progress:</strong> {Object.keys(answers).filter(key => answers[key]).length} of {question.questions.length} questions answered
          </span>
          <div className="flex space-x-2">
            {question.questions.map((_, index) => {
              const questionId = (index + 1).toString()
              return (
                <div
                  key={questionId}
                  className={`w-3 h-3 rounded-full ${
                    answers[questionId] ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  title={`Question ${questionId}: ${answers[questionId] ? 'Answered' : 'Pending'}`}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to validate answers
export function validateInformationMatchingAnswers(
  userAnswers: Record<string, string>,
  correctAnswers: Record<string, string>
): { score: number; total: number; feedback: Record<string, { correct: boolean; message: string }> } {
  let score = 0
  const total = Object.keys(correctAnswers).length
  const feedback: Record<string, { correct: boolean; message: string }> = {}

  Object.keys(correctAnswers).forEach(questionId => {
    const userAnswer = userAnswers[questionId]
    const correctAnswer = correctAnswers[questionId]
    const isCorrect = userAnswer === correctAnswer

    if (isCorrect) {
      score++
    }

    feedback[questionId] = {
      correct: isCorrect,
      message: isCorrect 
        ? 'Correct section!' 
        : `Incorrect. The correct section is: ${correctAnswer}`
    }
  })

  return { score, total, feedback }
}
