'use client'

import { useState, useEffect } from 'react'
import MatchingHeadingsQuestion from './MatchingHeadingsQuestion'
import InformationMatchingQuestion from './InformationMatchingQuestion'
import MultipleChoiceQuestion from './MultipleChoiceQuestion'
import FillInTheBlankQuestion from './FillInTheBlankQuestion'

interface RemedialTest {
  id: string
  title: string
  description: string
  type: string
  module: string
  difficulty: string
  duration: number
  questions: any[]
}

interface RemedialTestRendererProps {
  test: RemedialTest
  onComplete: (answers: Record<string, any>, score: number) => void
  onExit: () => void
}

export default function RemedialTestRenderer({
  test,
  onComplete,
  onExit
}: RemedialTestRendererProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeRemaining, setTimeRemaining] = useState(test.duration * 60) // Convert to seconds
  const [isCompleted, setIsCompleted] = useState(false)

  const currentQuestion = test.questions[currentQuestionIndex]

  useEffect(() => {
    if (timeRemaining <= 0 && !isCompleted) {
      handleComplete()
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, isCompleted])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    if (isCompleted) return
    
    setIsCompleted(true)
    
    // Calculate score
    let totalScore = 0
    let maxScore = 0
    
    test.questions.forEach((question, index) => {
      const questionId = question.id || index.toString()
      const userAnswer = answers[questionId]
      
      if (question.correctAnswers) {
        maxScore++
        if (userAnswer) {
          // Simple scoring - can be enhanced based on question type
          if (typeof question.correctAnswers === 'object') {
            const isCorrect = Object.entries(question.correctAnswers).every(
              ([key, value]) => userAnswer[key] === value
            )
            if (isCorrect) totalScore++
          } else if (userAnswer === question.correctAnswers) {
            totalScore++
          }
        }
      }
    })

    onComplete(answers, totalScore)
  }

  const renderQuestion = () => {
    if (!currentQuestion) return null

    const questionId = currentQuestion.id || currentQuestionIndex.toString()

    switch (test.type) {
      case 'MATCHING_HEADINGS':
        return (
          <MatchingHeadingsQuestion
            question={currentQuestion}
            onAnswerChange={(answer) => handleAnswerChange(questionId, answer)}
            initialAnswers={answers[questionId] || {}}
            disabled={isCompleted}
          />
        )
      
      case 'INFORMATION_MATCHING':
        return (
          <InformationMatchingQuestion
            question={currentQuestion}
            onAnswerChange={(answer) => handleAnswerChange(questionId, answer)}
            initialAnswers={answers[questionId] || {}}
            disabled={isCompleted}
          />
        )
      
      case 'MULTIPLE_CHOICE':
        return (
          <MultipleChoiceQuestion
            question={currentQuestion.question}
            options={currentQuestion.options}
            onAnswerChange={(answer) => handleAnswerChange(questionId, answer)}
            initialAnswer={answers[questionId] || ''}
            disabled={isCompleted}
          />
        )
      
      case 'NOTES_COMPLETION':
        return (
          <FillInTheBlankQuestion
            data={currentQuestion}
            onAnswerChange={(answer) => handleAnswerChange(questionId, answer)}
            initialAnswers={answers[questionId] || {}}
            disabled={isCompleted}
          />
        )
      
      default:
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Unsupported question type: {test.type}
            </p>
          </div>
        )
    }
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Completed!</h2>
          <p className="text-gray-600 mb-6">Your remedial test has been submitted successfully.</p>
          <button
            onClick={onExit}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* IELTS-style Header */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                      <span className="text-red-600 font-bold text-sm">IELTS</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Rem Candidate - {Math.floor(Math.random() * 1000000)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-sm text-gray-500">
                    {formatTime(timeRemaining)} remaining
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Full Height */}
          <div className="flex-1 w-full">
            {renderQuestion()}
          </div>

          {/* Bottom Navigation */}
          <div className="bg-white border-t border-gray-200">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">Part 1</span>
                    <div className="flex space-x-1">
                      {Array.from({ length: test.questions.length }, (_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                            index === currentQuestionIndex
                              ? 'bg-blue-500 text-white'
                              : answers[index.toString()] || answers[test.questions[index]?.id]
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    Part 2 0 of 4
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-mono text-gray-900">
                      {formatTime(timeRemaining)}
                    </div>
                    <button
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                      className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentQuestionIndex === test.questions.length - 1}
                      className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={onExit}
                      className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      Exit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
}
