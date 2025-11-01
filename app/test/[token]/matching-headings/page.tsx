'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FullscreenGuard from '@/components/test/FullscreenGuard'
import Timer from '@/components/test/Timer'
import MatchingHeadingsQuestion from '@/components/test/MatchingHeadingsQuestion'

interface Question {
  id: string
  type: 'MATCHING_HEADINGS'
  passage: {
    title: string
    sections: Array<{
      id: string
      number: number
      content: string
      hasHeading?: boolean
      heading?: string
    }>
  }
  headings: string[]
  correctAnswers: Record<string, string>
  instructions: string
  part: 1 | 2 | 3
  points: number
}

interface Module {
  id: string
  type: string
  duration: number
  instructions: string
}

interface Assignment {
  id: string
  candidateNumber: string
  studentName: string
  mockTitle: string
}

export default function MatchingHeadingsPage({ params }: { params: Promise<{ token: string }> }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [module, setModule] = useState<Module | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({})
  const [timeRemaining, setTimeRemaining] = useState(60 * 60) // 60 minutes in seconds
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [testStarted, setTestStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const resolvedParams = await params;
        
        // First check if the module is already completed
        const modulesResponse = await fetch(`/api/student/test-modules?token=${encodeURIComponent(resolvedParams.token)}`)
        if (modulesResponse.ok) {
        const modulesData = await modulesResponse.json()
        // matching headings rides on READING module type for storage
        const matchingModule = modulesData.modules.find((m: Record<string, any>) => m.type === 'READING')
          
          if (matchingModule && matchingModule.isCompleted) {
            // Module is already completed, redirect to results
            router.push(`/test/${resolvedParams.token}/results`)
            return
          }
        }
        
        const response = await fetch(`/api/student/test-data?token=${encodeURIComponent(resolvedParams.token)}&module=MATCHING_HEADINGS`)
        const data = await response.json()

        if (response.ok) {
          setQuestions(data.questions || [])
          setModule(data.module)
          setAssignment(data.assignment)
          setTimeRemaining(data.module.duration * 60) // Convert minutes to seconds
        } else {
          setError(data.error || 'Failed to load test data')
        }
      } catch (error) {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchTestData()
  }, [params, router])

  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  const handleAnswerChange = (questionId: string, answer: Record<string, string>) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
    
    // Auto-save after each answer change
    if (testStarted) {
      autoSave()
    }
  }

  // Auto-save functionality
  const autoSave = async () => {
    if (submitted || !testStarted) return
    
    setAutoSaveStatus('saving')
    try {
      const resolvedParams = await params;
      const response = await fetch(`/api/student/submissions/reading/autosave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resolvedParams.token,
          answers,
          timeSpent: module?.duration ? (module.duration * 60) - timeRemaining : 0
        })
      })

      if (response.ok) {
        setAutoSaveStatus('saved')
      } else {
        setAutoSaveStatus('error')
      }
    } catch (error) {
      setAutoSaveStatus('error')
    }
  }

  // Start test function
  const startTest = () => {
    setTestStarted(true)
  }

  const handleSubmit = async () => {
    if (submitted) return
    
    setSubmitted(true)
    
    try {
      const resolvedParams = await params;
      const response = await fetch(`/api/student/submissions/reading/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resolvedParams.token,
          answers,
          timeSpent: module?.duration ? (module.duration * 60) - timeRemaining : 0
        })
      })

      if (response.ok) {
        router.push(`/test/${resolvedParams.token}/results`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit answers')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  const getCurrentQuestion = () => {
    return questions[currentQuestion] || null
  }

  const getTotalQuestions = () => {
    return questions.length
  }

  const goToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/test')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Test Entry
          </button>
        </div>
      </div>
    )
  }

  return (
    <FullscreenGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">IELTS Matching Headings Test</span>
              <span className="text-sm text-gray-500">Candidate - {assignment?.candidateNumber}</span>
              {testStarted && (
                <Timer 
                  timeRemaining={timeRemaining}
                  onTimeUp={() => handleSubmit()}
                />
              )}
              {testStarted && (
                <div className="text-sm text-gray-500">
                  {autoSaveStatus === 'saved' && '✓ Saved'}
                  {autoSaveStatus === 'saving' && 'Saving...'}
                  {autoSaveStatus === 'error' && '⚠ Save Error'}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!testStarted ? (
                <button
                  onClick={startTest}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Start Test
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitted}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitted ? 'Submitting...' : 'Submit Test'}
                </button>
              )}
            </div>
          </div>
        </div>

        {!testStarted ? (
          /* Test Start Screen */
          <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">IELTS Matching Headings Test</h2>
                <div className="text-left space-y-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-bold text-blue-900 mb-2">Test Instructions</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• You will have {module?.duration || 60} minutes to complete this test</li>
                      <li>• Read the passage carefully and match the headings to the correct sections</li>
                      <li>• Drag headings from the right panel to the gaps in the text</li>
                      <li>• You can move headings between gaps or back to the headings panel</li>
                      <li>• Your answers will be auto-saved as you progress</li>
                      <li>• Once you start, the timer will begin counting down</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-bold text-yellow-900 mb-2">Important Notes</h3>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Do not refresh the page during the test</li>
                      <li>• Ensure you have a stable internet connection</li>
                      <li>• The test will auto-submit when time runs out</li>
                      <li>• You can resize the panels by dragging the divider between them</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={startTest}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Start Matching Headings Test
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Test Content */
          <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Question Navigation */}
            <div className="bg-gray-800 text-white px-6 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Question {currentQuestion + 1} of {getTotalQuestions()}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPreviousQuestion}
                    disabled={currentQuestion <= 0}
                    className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-300">
                    {currentQuestion + 1} of {getTotalQuestions()}
                  </span>
                  <button
                    onClick={goToNextQuestion}
                    disabled={currentQuestion >= questions.length - 1}
                    className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>

            {/* Question Content */}
            <div className="flex-1">
              {getCurrentQuestion() ? (
                <MatchingHeadingsQuestion
                  question={getCurrentQuestion()!}
                  onAnswerChange={(answer) => handleAnswerChange(getCurrentQuestion()!.id, answer)}
                  initialAnswers={answers[getCurrentQuestion()!.id] || {}}
                  disabled={submitted || !testStarted}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
                    <p className="text-gray-600">There are no matching headings questions for this test.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </FullscreenGuard>
  )
}
