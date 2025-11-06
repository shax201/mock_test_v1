'use client'

import { useState, useEffect, useRef } from 'react'

interface Question {
  id: string
  question: string
  type: string
  part: number
  options?: string[]
  studentAnswer: string
  correctAnswer: string
  isCorrect: boolean | null
  explanation?: string
  moduleType: 'reading' | 'listening' | 'writing'
  wordCount?: number
}

interface QuestionWiseResultsProps {
  testId: string
  questions: Question[]
  totalQuestions: number
}

export default function QuestionWiseResults({ testId, questions, totalQuestions }: QuestionWiseResultsProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [filterType, setFilterType] = useState<'all' | 'reading' | 'listening' | 'writing'>('all')
  const [isBookmarked, setIsBookmarked] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Filter questions based on type
  const filteredQuestions = questions.filter(q => 
    filterType === 'all' || q.moduleType === filterType
  )

  // Set initial question
  useEffect(() => {
    if (filteredQuestions.length > 0 && !selectedQuestion) {
      setSelectedQuestion(filteredQuestions[0])
      setCurrentQuestionIndex(0)
    }
  }, [filteredQuestions, selectedQuestion])

  // Handle question selection
  const handleQuestionSelect = (question: Question, index: number) => {
    setSelectedQuestion(question)
    setCurrentQuestionIndex(index)
  }

  // Navigate to previous question
  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1
      setCurrentQuestionIndex(newIndex)
      setSelectedQuestion(filteredQuestions[newIndex])
    }
  }

  // Navigate to next question
  const goToNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      const newIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(newIndex)
      setSelectedQuestion(filteredQuestions[newIndex])
    }
  }

  // Scroll to question in navigation
  const scrollToQuestion = (index: number) => {
    if (scrollContainerRef.current) {
      const questionElement = scrollContainerRef.current.children[index] as HTMLElement
      if (questionElement) {
        questionElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'center'
        })
      }
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentQuestionIndex, filteredQuestions.length])

  if (!selectedQuestion) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">No Questions Available</h3>
        <p className="text-gray-600">Question details are not available for this test.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Check answers with explanation for all {totalQuestions} questions
        </h2>
        <div className="flex items-center space-x-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Questions</option>
            <option value="reading">Reading Questions</option>
            <option value="listening">Listening Questions</option>
            <option value="writing">Writing Questions</option>
          </select>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="space-y-4">
        {/* Question Numbers */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2" ref={scrollContainerRef}>
          {filteredQuestions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => {
                handleQuestionSelect(question, index)
                scrollToQuestion(index)
              }}
              className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                selectedQuestion?.id === question.id
                  ? 'bg-gray-800 text-white border-gray-800'
                  : question.isCorrect === true
                  ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                  : question.isCorrect === false
                  ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {filteredQuestions.length}
            </span>
          </div>

          <button
            onClick={goToNext}
            disabled={currentQuestionIndex === filteredQuestions.length - 1}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        {/* Question Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-2xl font-bold text-gray-900">
              Question {currentQuestionIndex + 1}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-2 rounded-full transition-colors ${
                  isBookmarked 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'text-gray-400 hover:text-yellow-500'
                }`}
              >
                <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Question Tags */}
        <div className="flex items-center space-x-3 mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedQuestion.moduleType === 'reading' 
              ? 'bg-blue-100 text-blue-800' 
              : selectedQuestion.moduleType === 'listening'
              ? 'bg-green-100 text-green-800'
              : 'bg-purple-100 text-purple-800'
          }`}>
            {selectedQuestion.moduleType.charAt(0).toUpperCase() + selectedQuestion.moduleType.slice(1)}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Part {selectedQuestion.part}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            {selectedQuestion.type}
          </span>
          {selectedQuestion.isCorrect !== null && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedQuestion.isCorrect 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {selectedQuestion.isCorrect ? 'Correct' : 'Incorrect'}
            </span>
          )}
          {selectedQuestion.isCorrect === null && selectedQuestion.moduleType === 'writing' && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              Pending Evaluation
            </span>
          )}
          {selectedQuestion.wordCount !== undefined && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              {selectedQuestion.wordCount} words
            </span>
          )}
        </div>

        {/* Question Content */}
        <div className="space-y-6">
          {/* Question Text */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Question:</h4>
            <p className="text-gray-800 leading-relaxed">{selectedQuestion.question}</p>
          </div>

          {/* Options (if available) */}
          {selectedQuestion.options && selectedQuestion.options.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Options:</h4>
              <div className="space-y-2">
                {selectedQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-gray-800">{option}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answer Comparison */}
          {selectedQuestion.moduleType === 'writing' ? (
            /* Writing Answer Display - Full text response */
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Your Answer:</h4>
                  {selectedQuestion.wordCount !== undefined && (
                    <span className="text-sm text-gray-600">
                      Word Count: {selectedQuestion.wordCount}
                    </span>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-white border border-gray-200 min-h-[200px]">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {selectedQuestion.studentAnswer || 'No answer provided'}
                  </p>
                </div>
              </div>
              {selectedQuestion.correctAnswer && selectedQuestion.correctAnswer !== 'Evaluation pending' && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Evaluation:</h4>
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-gray-800">{selectedQuestion.correctAnswer}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Reading/Listening Answer Display - Side by side comparison */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Answer:</h4>
                <div className={`p-4 rounded-lg ${
                  selectedQuestion.isCorrect === true
                    ? 'bg-green-100 text-green-800' 
                    : selectedQuestion.isCorrect === false
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="font-medium">
                    {selectedQuestion.studentAnswer || 'No answer provided'}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Correct Answer:</h4>
                <div className="p-4 rounded-lg bg-green-100 text-green-800">
                  <p className="font-medium">{selectedQuestion.correctAnswer}</p>
                </div>
              </div>
            </div>
          )}

          {/* Explanation */}
          {selectedQuestion.explanation && (
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-4">Explanation:</h4>
              <p className="text-blue-800 leading-relaxed">{selectedQuestion.explanation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="text-center text-sm text-gray-500">
        <p>Use ← → arrow keys to navigate between questions</p>
      </div>
    </div>
  )
}
