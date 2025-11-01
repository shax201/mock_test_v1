'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FullscreenGuard from '@/components/test/FullscreenGuard'
import Timer from '@/components/test/Timer'

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

export default function WritingPage({ params }: { params: Promise<{ token: string }> }) {
  const [module, setModule] = useState<Module | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [answers, setAnswers] = useState<{
    task1: string
    task2: string
  }>({
    task1: '',
    task2: ''
  })
  const [timeRemaining, setTimeRemaining] = useState(60 * 60) // 60 minutes in seconds
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [testStarted, setTestStarted] = useState(false)
  const [currentTask, setCurrentTask] = useState(1)
  const router = useRouter()

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const resolvedParams = await params;
        
        // First check if the module is already completed
        const modulesResponse = await fetch(`/api/student/test-modules?token=${encodeURIComponent(resolvedParams.token)}`)
        if (modulesResponse.ok) {
          const modulesData = await modulesResponse.json()
          const writingModule = modulesData.modules.find((m: any) => m.type === 'WRITING')
          
          if (writingModule && writingModule.isCompleted) {
            // Module is already completed, redirect to results
            router.push(`/test/${resolvedParams.token}/results`)
            return
          }
        }
        
        const response = await fetch(`/api/student/test-data?token=${encodeURIComponent(resolvedParams.token)}&module=WRITING`)
        const data = await response.json()

        if (response.ok) {
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

  const handleAnswerChange = (task: 'task1' | 'task2', value: string) => {
    setAnswers(prev => ({
      ...prev,
      [task]: value
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
      const response = await fetch(`/api/student/submissions/writing/autosave`, {
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

  const handleSubmit = async () => {
    if (submitted) return
    
    setSubmitted(true)
    
    try {
      const resolvedParams = await params;
      const response = await fetch(`/api/student/submissions/writing/submit`, {
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

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
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
              <span className="text-sm text-gray-600">IELTS Writing Test</span>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">IELTS Writing Test</h2>
                <div className="text-left space-y-4 mb-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-bold text-purple-900 mb-2">Test Instructions</h3>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• You will have {module?.duration || 60} minutes to complete this test</li>
                      <li>• Complete both writing tasks</li>
                      <li>• Task 1: Write at least 150 words (20 minutes recommended)</li>
                      <li>• Task 2: Write at least 250 words (40 minutes recommended)</li>
                      <li>• Your answers will be auto-saved as you progress</li>
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
                  Start Writing Test
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Test Content */
          <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Task Navigation */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentTask(1)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentTask === 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Task 1
                  </button>
                  <button
                    onClick={() => setCurrentTask(2)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentTask === 2
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Task 2
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  {currentTask === 1 ? 'Task 1: 150+ words' : 'Task 2: 250+ words'}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Task Instructions */}
              <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
                <div className="bg-purple-50 border-b border-purple-200 p-4">
                  <h3 className="font-bold text-purple-900 mb-2">
                    Writing Task {currentTask}
                  </h3>
                  <p className="text-sm text-purple-800">
                    {currentTask === 1 
                      ? 'Write at least 150 words. You should spend about 20 minutes on this task.'
                      : 'Write at least 250 words. You should spend about 40 minutes on this task.'
                    }
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-bold text-gray-900 mb-4">
                      {currentTask === 1 ? 'Task 1 Instructions' : 'Task 2 Instructions'}
                    </h4>
                    
                    {currentTask === 1 ? (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-700">
                          <strong>Sample Task 1:</strong> The chart below shows the percentage of households with internet access in different countries from 2000 to 2010. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h5 className="font-medium text-blue-900 mb-2">Task 1 Requirements:</h5>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Write at least 150 words</li>
                            <li>• Summarize the main features</li>
                            <li>• Make comparisons where relevant</li>
                            <li>• Use formal academic language</li>
                            <li>• Organize your response clearly</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-700">
                          <strong>Sample Task 2:</strong> Some people believe that technology has made our lives more complicated, while others think it has made life easier. Discuss both views and give your own opinion.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h5 className="font-medium text-blue-900 mb-2">Task 2 Requirements:</h5>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Write at least 250 words</li>
                            <li>• Discuss both views</li>
                            <li>• Give your own opinion</li>
                            <li>• Use formal academic language</li>
                            <li>• Organize your ideas with clear paragraphs</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel - Writing Area */}
              <div className="w-1/2 bg-white flex flex-col">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      Writing Task {currentTask}
                    </h3>
                    <div className="text-sm text-gray-600">
                      Word count: {getWordCount(answers[currentTask === 1 ? 'task1' : 'task2'])}
                      {currentTask === 1 ? ' / 150+' : ' / 250+'}
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6">
                  <textarea
                    value={answers[currentTask === 1 ? 'task1' : 'task2']}
                    onChange={(e) => handleAnswerChange(currentTask === 1 ? 'task1' : 'task2', e.target.value)}
                    disabled={submitted || !testStarted}
                    className="w-full h-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={`Start writing your response for Task ${currentTask}...`}
                    style={{ minHeight: '400px' }}
                  />
                </div>

                {/* Writing Tips */}
                <div className="bg-yellow-50 border-t border-yellow-200 p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Writing Tips:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Use formal academic language</li>
                    <li>• Organize your ideas with clear paragraphs</li>
                    <li>• Check your spelling and grammar</li>
                    <li>• Make sure you meet the word count requirement</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FullscreenGuard>
  )
}
