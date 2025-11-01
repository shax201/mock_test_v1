'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FullscreenGuard from '@/components/test/FullscreenGuard'
import Timer from '@/components/test/Timer'
import IELTSQuestionRenderer from '@/components/test/IELTSQuestionRenderer'

interface Question {
  id: string
  type: 'NOTES_COMPLETION' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE_NOT_GIVEN' | 'TRUE_FALSE' | 'SUMMARY_COMPLETION' | 'FIB' | 'MATCHING'
  content: string
  options?: string[]
  part: 1 | 2 | 3
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
  notesCompletionData?: {
    title: string
    instructions: string
    notes: Array<{
      id: string
      content: string
      hasBlank: boolean
      blankAnswer?: string
      blankPosition?: number
    }>
  }
  summaryCompletionData?: {
    title: string
    instructions: string
    content: string
    blanks: Array<{
      id: string
      position: number
      correctAnswer: string
      alternatives?: string[]
    }>
  }
  trueFalseNotGivenData?: {
    statement: string
    correctAnswer: 'TRUE' | 'FALSE' | 'NOT_GIVEN'
    explanation?: string
  }
  instructions?: string
  correctAnswer: string | string[] | Record<string, string>
  points: number
}

interface Module {
  id: string
  type: string
  duration: number
  instructions: string
  passageContent?: {
    part1: string
    part2: string
    part3: string
  }
  readingData?: {
    part1Content: string
    part2Content: string
    part3Content: string
    part1Passage: string
    part2Passage: string
    part3Passage: string
    part1Instructions: string
    part2Instructions: string
    part3Instructions: string
  }
}

interface Assignment {
  id: string
  candidateNumber: string
  studentName: string
  mockTitle: string
}

interface PartContent {
  part1: string
  part2: string
  part3: string
}

export default function ReadingPage({ params }: { params: Promise<{ token: string }> }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [module, setModule] = useState<Module | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [partContent, setPartContent] = useState<PartContent | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | Record<string, string>>>({})
  const [timeRemaining, setTimeRemaining] = useState(60 * 60) // 60 minutes in seconds
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [testStarted, setTestStarted] = useState(false)
  const [currentPart, setCurrentPart] = useState(1)
  const [leftPanelWidth, setLeftPanelWidth] = useState(50) // Percentage
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const resolvedParams = await params;
        
        // First check if the module is already completed
        const modulesResponse = await fetch(`/api/student/test-modules?token=${encodeURIComponent(resolvedParams.token)}`)
        if (modulesResponse.ok) {
          const modulesData = await modulesResponse.json()
          const readingModule = modulesData.modules.find((m: any) => m.type === 'READING')
          
          if (readingModule && readingModule.isCompleted) {
            // Module is already completed, redirect to results
            router.push(`/test/${resolvedParams.token}/results`)
            return
          }
        }
        
        const response = await fetch(`/api/student/test-data?token=${encodeURIComponent(resolvedParams.token)}&module=READING`)
        const data = await response.json()

        if (response.ok) {
          setQuestions(data.questions || [])
          setModule(data.module)
          setAssignment(data.assignment)
          setPartContent(data.partContent)
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

  const handleAnswerChange = (questionId: string, answer: string | Record<string, string>) => {
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
    // Start the timer when test begins
  }

  // Helper functions for part navigation
  const getQuestionsForPart = (part: number) => {
    return questions.filter(q => (q.part || 1) === part)
  }

  const getTotalParts = () => {
    const parts = [...new Set(questions.map(q => q.part || 1))]
    return Math.max(...parts)
  }

  const getCurrentPassageContent = () => {
    // Prioritize readingData over legacy passageContent
    if (module?.readingData) {
      const partKey = `part${currentPart}Passage` as keyof typeof module.readingData
      return module.readingData[partKey] || ''
    }
    if (module?.passageContent) {
      const partKey = `part${currentPart}` as keyof typeof module.passageContent
      return module.passageContent[partKey] || ''
    }
    return partContent?.[`part${currentPart}` as keyof PartContent] || ''
  }

  const getCurrentPartContent = () => {
    if (module?.readingData) {
      const partKey = `part${currentPart}Content` as keyof typeof module.readingData
      return module.readingData[partKey] || ''
    }
    return ''
  }

  const getCurrentPartInstructions = () => {
    if (module?.readingData) {
      const partKey = `part${currentPart}Instructions` as keyof typeof module.readingData
      return module.readingData[partKey] || ''
    }
    return ''
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

  // Resizable panel handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    const containerWidth = window.innerWidth
    const newLeftWidth = (e.clientX / containerWidth) * 100
    
    // Constrain between 20% and 80%
    const constrainedWidth = Math.min(Math.max(newLeftWidth, 20), 80)
    setLeftPanelWidth(constrainedWidth)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

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


  console.log("getQuestionsForPart",getQuestionsForPart(1));
  return (
    <FullscreenGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">IELTS Reading Test</span>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">IELTS Reading Test</h2>
                <div className="text-left space-y-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-bold text-blue-900 mb-2">Test Instructions</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• You will have {module?.duration || 60} minutes to complete this test</li>
                      <li>• Read the passages carefully and answer all questions</li>
                      <li>• You can navigate between questions and refer back to the passages</li>
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
                    </ul>
                  </div>
                </div>
                <button
                  onClick={startTest}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Start Reading Test
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Test Content */
          <div className="h-[calc(100vh-4rem)] flex">
          {/* Left Panel - Reading Passage */}
          <div 
            className="bg-white border-r border-gray-200 flex flex-col"
            style={{ width: `${leftPanelWidth}%` }}
          >
            {/* Part Header */}
            <div className="bg-gray-800 text-white px-6 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Part {currentPart} Reading Passage
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPart(Math.max(1, currentPart - 1))}
                    disabled={currentPart <= 1}
                    className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-gray-300">
                    {currentPart} of {getTotalParts()}
                  </span>
                  <button
                    onClick={() => setCurrentPart(Math.min(getTotalParts(), currentPart + 1))}
                    disabled={currentPart >= getTotalParts()}
                    className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border-b border-blue-200 p-4">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">Instructions</h3>
                <ul className="text-sm text-gray-800 space-y-1">
                  <li>• Read the passage below carefully</li>
                  <li>• Answer the questions on the right based on the information in the passage</li>
                  <li>• You can refer back to the passage while answering questions</li>
                  <li>• Choose the best answer for each question</li>
                  <li>• This is Part {currentPart} - navigate between parts using the buttons above</li>
                </ul>
                
                {/* Part-specific instructions from reading data */}
                {getCurrentPartInstructions() && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-bold text-blue-900 mb-1">Part {currentPart} Specific Instructions</h4>
                    <p className="text-sm text-blue-800">{getCurrentPartInstructions()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reading Passage Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="font-bold text-gray-900 mb-4">Reading Passage - Part {currentPart}</h3>
              
              {/* Part-specific content from reading data */}
              {getCurrentPartContent() && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">Part {currentPart} Content</h4>
                  <div className="text-sm text-blue-800">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: getCurrentPartContent()
                          .replace(/<p>/g, '<p class="mb-2">')
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div className="prose max-w-none text-sm leading-relaxed text-gray-800">
                {getCurrentPassageContent() ? (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: getCurrentPassageContent()
                        .replace(/<p>/g, '<p class="mb-4" style="margin-bottom: 1rem;">')
                        .replace(/<p[^>]*><strong>([A-Z])\.<\/strong>/g, '<p class="mb-4" style="margin-bottom: 1rem;"><strong style="font-weight: bold; color: #111827;">$1.</strong>')
                        .replace(/<p[^>]*>([^<]*[A-Z]\.)/g, '<p class="mb-4" style="margin-bottom: 1rem;"><strong style="font-weight: bold; color: #111827;">$1</strong>')
                    }}
                  />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      No passage content available for Part {currentPart}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resizable Handle */}
          <div
            className={`w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize flex items-center justify-center transition-colors ${
              isDragging ? 'bg-gray-500' : ''
            }`}
            onMouseDown={handleMouseDown}
          >
            <div className="w-0.5 h-8 bg-gray-500 rounded-full"></div>
          </div>

          {/* Right Panel - Questions */}
          <div 
            className="bg-white flex flex-col"
            style={{ width: `${100 - leftPanelWidth}%` }}
          >
            {/* Part Header */}
            <div className="bg-gray-800 text-white px-6 py-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  Part {currentPart} - Answer Sheet
                </h2>
                <div className="text-sm">
                  <span className="text-gray-300">
                    Questions {getQuestionsForPart(currentPart).length > 0 ? `1-${getQuestionsForPart(currentPart).length}` : '1-0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Question Navigation */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setCurrentPart(Math.max(1, currentPart - 1))}
                  disabled={currentPart <= 1}
                  className="text-gray-400 text-sm hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Prev Part
                </button>
                <span className="text-sm text-gray-600">
                  Part {currentPart} of {getTotalParts()}
                </span>
                <button 
                  onClick={() => setCurrentPart(Math.min(getTotalParts(), currentPart + 1))}
                  disabled={currentPart >= getTotalParts()}
                  className="text-blue-600 text-sm hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Part →
                </button>
              </div>
            </div>

            {/* Questions */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {getQuestionsForPart(currentPart).length > 0 ? (
                  getQuestionsForPart(currentPart).map((question, index) => (
                    <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <IELTSQuestionRenderer
                        question={question}
                        questionNumber={index + 1}
                        onAnswerChange={handleAnswerChange}
                        initialAnswer={answers[question.id]}
                        disabled={submitted || !testStarted}
                        showInstructions={false}
                      />
                    </div>
                  ))
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      No questions available for Part {currentPart}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </FullscreenGuard>
  )
}