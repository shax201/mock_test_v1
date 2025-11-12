'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import StudentHeader from '@/components/student/StudentHeader'
import styles from './WritingTest.module.css'

interface WritingTestData {
  test: {
    id: string
    title: string
    totalTimeMinutes: number
    readingTestId: string
    readingTest?: {
      id: string
      title: string
    }
  }
  passages: Array<{
    id: string
    title: string
    order: number
    contents: Array<{
      id: string
      text: string
      order: number
    }>
    questions: Array<{
      id: string
      questionNumber: number
      type: 'TASK_1' | 'TASK_2'
      questionText: string
      points: number
      readingPassageId?: string | null
      readingPassage?: {
        id: string
        title: string
        order: number
      } | null
    }>
  }>
  passageConfigs: Array<{
    part: number
    total: number
    start: number
  }>
}

export default function StudentWritingTestPage() {
  const params = useParams()
  const router = useRouter()
  const [testData, setTestData] = useState<WritingTestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState(60 * 60) // 60 minutes in seconds
  const [testStarted, setTestStarted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTask, setCurrentTask] = useState(1) // 1 or 2
  const [passagePanelWidth, setPassagePanelWidth] = useState(50) // Percentage
  const [isResizing, setIsResizing] = useState(false)
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [submittedSessionId, setSubmittedSessionId] = useState<string | null>(null)
  const [readingTestId, setReadingTestId] = useState<string | null>(null)
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [showContrastPanel, setShowContrastPanel] = useState(false)
  const [showTextSizePanel, setShowTextSizePanel] = useState(false)
  const [showInstructionsPanel, setShowInstructionsPanel] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [showFullscreenModal, setShowFullscreenModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [contrastTheme, setContrastTheme] = useState<'black-on-white' | 'white-on-black' | 'yellow-on-black'>('black-on-white')
  const [textSize, setTextSize] = useState<'regular' | 'large' | 'extra-large'>('regular')
  
  const passagePanelRef = useRef<HTMLDivElement>(null)
  const questionsPanelRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (params.id) {
      fetchTestData()
    }
  }, [params.id])

  // Fetch writing test data from API
  const fetchTestData = async () => {
    try {
      const response = await fetch(`/api/student/writing-tests/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setTestData(data)
        // Initialize timer with test duration
        setTimeRemaining((data.test?.totalTimeMinutes || 60) * 60)
      } else {
        setError(data.error || 'Failed to load test data')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Timer countdown effect
  useEffect(() => {
    if (testStarted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)

      return () => clearInterval(timer)
    } else if (testStarted && timeRemaining <= 0) {
      // Auto-submit when time runs out
      handleSubmit()
    }
  }, [testStarted, timeRemaining])

  // Resizer functionality - Handle panel resizing like reading test
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (resizerRef.current && e.target === resizerRef.current) {
        setIsResizing(true)
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !passagePanelRef.current || !questionsPanelRef.current) return

      const container = passagePanelRef.current.parentElement
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const newPassageWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
      
      // Limit between 20% and 80%
      const clampedWidth = Math.max(20, Math.min(80, newPassageWidth))
      setPassagePanelWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // Handle answer changes for writing tasks
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }))
  }

  // Format time display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get word count for a given answer
  const getWordCount = (text: string): number => {
    return text.split(/\s+/).filter(Boolean).length
  }

  // Switch between tasks
  const switchToTask = (taskNumber: number) => {
    setCurrentTask(taskNumber)
  }

  // Handle modal close and navigate to results page with question-wise view
  const handleModalClose = () => {
    setShowEvaluationModal(false)
    // Navigate to results page to view submitted test with question-wise review
    // Use the reading test ID if available, otherwise use writing test ID
    const resultsTestId = readingTestId || params.id
    setIsRedirecting(true)
    setTimeout(() => {
      router.push(`/student/results/${resultsTestId}?tab=question-wise`)
    }, 500)
  }

  // Start the test
  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
    } catch (error) {
      console.error('Error requesting fullscreen:', error)
    }
  }

  const startLoading = () => {
    setIsLoading(true)
    setLoadingProgress(0)
    
    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsLoading(false)
            setTestStarted(true)
          }, 500)
          return 100
        }
        return prev + 2 // Increment by 2% each time
      })
    }, 100) // Update every 100ms
  }

  const handleFullscreenYes = async () => {
    await requestFullscreen()
    setShowFullscreenModal(false)
    startLoading()
  }

  const handleFullscreenNo = () => {
    setShowFullscreenModal(false)
    startLoading()
  }

  const handleStartTest = () => {
    setShowInstructions(false)
    setShowFullscreenModal(true)
  }

  const startTest = () => {
    if (!isLoading) {
      startLoading()
    }
  }

  // Exit fullscreen mode
  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error)
    }
  }

  // Submit writing test answers
  const handleSubmit = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    // Exit fullscreen mode
    await exitFullscreen()

    try {
      // Step 1: Prepare submission data
      // Collect all answers and test metadata for submission
      const submissionData = {
        answers: answers,
        timeSpent: testData?.test?.totalTimeMinutes
          ? testData.test.totalTimeMinutes * 60 - timeRemaining
          : 0
      }

      // Step 2: Submit to backend API
      // Save writing test responses to database
      const response = await fetch(`/api/student/writing-tests/${params.id}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })

      const data = await response.json()

      // Step 3: Handle submission result
      if (response.ok) {
        console.log('✅ Writing test results saved successfully:', data)
        // Store session ID and reading test ID for navigation to results
        if (data.session?.id) {
          setSubmittedSessionId(data.session.id)
        }
        if (data.readingTestId) {
          setReadingTestId(data.readingTestId)
        }
        // Show evaluation modal instead of redirecting immediately
        setShowEvaluationModal(true)
      } else {
        // Step 4: Handle submission failure
        console.error('❌ Failed to save writing test results:', data.error || data.message)
        alert(`Failed to submit: ${data.error || data.message || 'Unknown error'}`)
      }
    } catch (error) {
      // Step 5: Handle network or unexpected errors
      console.error('❌ Error submitting writing test:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to submit writing test. Error: ${errorMessage}`)
    } finally {
      // Step 6: Reset submitting state
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading IELTS Writing Test...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading test</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!testData) {
    return null
  }

  // Get tasks from passages (assuming Task 1 is first passage, Task 2 is second)
  const task1 = testData.passages.find((p) => p.order === 1)
  const task2 = testData.passages.find((p) => p.order === 2)
  const task1Question = task1?.questions[0]
  const task2Question = task2?.questions[0]

  return (
    <>
      {/* Instructions Modal */}
      {showInstructions && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              IELTS Writing Test Instructions
            </h2>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px'
              }}>
                General Instructions
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative', color: '#4b5563', lineHeight: '1.6' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  You have <strong>{testData.test?.totalTimeMinutes || 60} minutes</strong> to complete the Writing test.
                </li>
                <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative', color: '#4b5563', lineHeight: '1.6' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  The test consists of <strong>2 writing tasks</strong> that you must complete within the time limit.
                </li>
                <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative', color: '#4b5563', lineHeight: '1.6' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  You can navigate between tasks using the task buttons at the bottom of the screen.
                </li>
                <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative', color: '#4b5563', lineHeight: '1.6' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  Your answers are saved automatically as you type.
                </li>
                <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative', color: '#4b5563', lineHeight: '1.6' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  Do not refresh the page during the test as this may cause you to lose your progress.
                </li>
                <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative', color: '#4b5563', lineHeight: '1.6' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  The timer will begin as soon as you start the test.
                </li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px'
              }}>
                Task Requirements
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative', color: '#4b5563', lineHeight: '1.6' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  <strong>Task 1:</strong> Write at least <strong>150 words</strong> (20 minutes recommended). This task requires you to describe, summarize, or explain information from a graph, chart, table, or diagram.
                </li>
                <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative', color: '#4b5563', lineHeight: '1.6' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  <strong>Task 2:</strong> Write at least <strong>250 words</strong> (40 minutes recommended). This task requires you to write an essay in response to a point of view, argument, or problem.
                </li>
                <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative', color: '#4b5563', lineHeight: '1.6' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  Task 2 carries more weight (2/3) than Task 1 (1/3) in the overall band score.
                </li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px'
              }}>
                Writing Tips
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative', color: '#4b5563', lineHeight: '1.6' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  Plan your writing before you start - spend a few minutes organizing your ideas.
                </li>
                <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative', color: '#4b5563', lineHeight: '1.6' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  Pay attention to word count requirements - Task 1 needs at least 150 words, Task 2 needs at least 250 words.
                </li>
                <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative', color: '#4b5563', lineHeight: '1.6' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  Use appropriate academic vocabulary and formal language.
                </li>
                <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative', color: '#4b5563', lineHeight: '1.6' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  Check your grammar, spelling, and punctuation before submitting.
                </li>
                <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative', color: '#4b5563', lineHeight: '1.6' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  Manage your time wisely - allocate more time for Task 2 as it carries more weight.
                </li>
              </ul>
            </div>

            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{
                margin: 0,
                color: '#1e40af',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                <strong>Important:</strong> Make sure you have a stable internet connection and a quiet environment before starting the test. The timer will begin as soon as you click "Start Test".
              </p>
            </div>

            <button
              onClick={handleStartTest}
              style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                padding: '14px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Start Test
            </button>
          </div>
        </div>
      )}

      {/* Redirecting Loading Screen */}
      {isRedirecting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#2d2d2d',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p style={{
            color: 'white',
            fontSize: '18px',
            textAlign: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
          }}>
            Redirecting to results...
          </p>
        </div>
      )}
      
      {!showInstructions && (
        <div className={`${styles.mainContainer} contrast-${contrastTheme} text-size-${textSize}`}>
      {/* Header - Matching reading test style */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>{testData.test.title}</h2>
        </div>
        <div className={styles.headerRight}>
          {testStarted && (
            <>
              <button
                className={styles.headerMenuBtn}
                onClick={() => setShowOptionsModal(true)}
                title="Menu"
              >
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
              </button>
              <div className={styles.timerContainer}>
                <span>Time Remaining:</span>
                <span className={styles.timerDisplay}>{formatTime(timeRemaining)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {showFullscreenModal && !testStarted && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(to bottom, #1a1a1a, #2d2d2d)',
              padding: '20px 24px'
            }}>
              <h2 style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: 0,
                textAlign: 'left',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
              }}>Alert!</h2>
            </div>
            <div style={{
              background: '#d0d8e0',
              padding: '24px',
              textAlign: 'left'
            }}>
              <p style={{
                color: '#000',
                fontSize: '16px',
                margin: '0 0 24px 0',
                lineHeight: '1.5',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
              }}>
                Would you like to attempt this test in fullscreen mode?
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '20px'
              }}>
                <button 
                  onClick={handleFullscreenYes}
                  style={{
                    background: 'linear-gradient(to bottom, #e8e8e8, #d0d0d0)',
                    border: '1px solid #000',
                    borderRadius: '6px',
                    padding: '8px 20px',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#000',
                    cursor: 'pointer',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #f0f0f0, #d8d8d8)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #e8e8e8, #d0d0d0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #d8d8d8, #c0c0c0)'
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #f0f0f0, #d8d8d8)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  Yes
                </button>
                <button 
                  onClick={handleFullscreenNo}
                  style={{
                    background: 'linear-gradient(to bottom, #e8e8e8, #d0d0d0)',
                    border: '1px solid #000',
                    borderRadius: '6px',
                    padding: '8px 20px',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#000',
                    cursor: 'pointer',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #f0f0f0, #d8d8d8)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #e8e8e8, #d0d0d0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #d8d8d8, #c0c0c0)'
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #f0f0f0, #d8d8d8)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Screen */}
      {!testStarted && !showFullscreenModal && isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#2d2d2d',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <p style={{
            color: 'white',
            fontSize: '18px',
            marginBottom: '30px',
            textAlign: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
          }}>
            Please wait while we are loading the questions. This may take a while.
          </p>
          <div style={{
            width: '400px',
            maxWidth: '90%',
            height: '20px',
            backgroundColor: '#1a1a1a',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '15px'
          }}>
            <div style={{
              width: `${loadingProgress}%`,
              height: '100%',
              backgroundColor: '#4CAF50',
              transition: 'width 0.1s ease',
              borderRadius: '10px'
            }}></div>
          </div>
          <p style={{
            color: 'white',
            fontSize: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
          }}>
            {loadingProgress}%
          </p>
        </div>
      )}

      {testStarted && (
        <>
          {/* Main Container with Left/Right Panels */}
          <div className={styles.mainContainer}>
            <div className={styles.panelsContainer}>
              {/* Left Panel - Passage/Instructions */}
              <div 
                ref={passagePanelRef} 
                id="passage-panel" 
                className={styles.passagePanel}
                style={{ width: `${passagePanelWidth}%` }}
              >
                {/* Task 1 Content */}
                {task1 && (
                  <div className={`${styles.taskSection} ${currentTask === 1 ? '' : styles.hidden}`}>
                    <div className={styles.writingPassage}>
                      <h4 className={styles.textCenter}>{task1.title}</h4>
                      {task1.contents.map((content) => (
                        <div key={content.id} className={styles.passageContent}>
                          <p>{content.text}</p>
                        </div>
                      ))}
                      {task1Question?.readingPassage && (
                        <div className={styles.relatedPassage}>
                          <p className={styles.relatedPassageText}>
                            <strong>Related Reading Passage:</strong> {task1Question.readingPassage.title}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Task 2 Content */}
                {task2 && (
                  <div className={`${styles.taskSection} ${currentTask === 2 ? '' : styles.hidden}`}>
                    <div className={styles.writingPassage}>
                      <h4 className={styles.textCenter}>{task2.title}</h4>
                      {task2.contents.map((content) => (
                        <div key={content.id} className={styles.passageContent}>
                          <p>{content.text}</p>
                        </div>
                      ))}
                      {task2Question?.readingPassage && (
                        <div className={styles.relatedPassage}>
                          <p className={styles.relatedPassageText}>
                            <strong>Related Reading Passage:</strong> {task2Question.readingPassage.title}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Resizer */}
              <div ref={resizerRef} className={styles.resizer}></div>

              {/* Right Panel - Writing Area */}
              <div 
                ref={questionsPanelRef} 
                id="questions-panel" 
                className={styles.questionsPanel}
                style={{ width: `${100 - passagePanelWidth}%` }}
              >
                {/* Task 1 Writing Area */}
                {task1 && task1Question && (
                  <div className={`${styles.taskSection} ${currentTask === 1 ? '' : styles.hidden}`}>
                    <h2 className={styles.taskHeader}>Task 1</h2>
                    <div className={styles.taskQuestion}>
                      {task1Question.questionText}
                    </div>
                    <div className={styles.textareaContainer}>
                      <textarea
                        value={answers[task1Question.id] || ''}
                        onChange={(e) => handleAnswerChange(task1Question.id, e.target.value)}
                        className={styles.writingTextarea}
                        style={{ minHeight: '400px' }}
                        placeholder="Write your answer here (at least 150 words)..."
                      />
                      <div className={styles.wordCount}>
                        Word count: {getWordCount(answers[task1Question.id] || '')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Task 2 Writing Area */}
                {task2 && task2Question && (
                  <div className={`${styles.taskSection} ${currentTask === 2 ? '' : styles.hidden}`}>
                    <h2 className={styles.taskHeader}>Task 2</h2>
                    <div className={styles.taskQuestion}>
                      {task2Question.questionText}
                    </div>
                    <div className={styles.textareaContainer}>
                      <textarea
                        value={answers[task2Question.id] || ''}
                        onChange={(e) => handleAnswerChange(task2Question.id, e.target.value)}
                        className={styles.writingTextarea}
                        style={{ minHeight: '500px' }}
                        placeholder="Write your answer here (at least 250 words)..."
                      />
                      <div className={styles.wordCount}>
                        Word count: {getWordCount(answers[task2Question.id] || '')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Navigation - Matching reading test style */}
          <nav className={styles.navRow} aria-label="Tasks">
            <div className={styles.footerTaskWrapper}>
              {task1 && (
                <button
                  className={`${styles.footerTaskButton} ${currentTask === 1 ? styles.selected : ''}`}
                  onClick={() => switchToTask(1)}
                >
                  Task 1
                </button>
              )}
              {task2 && (
                <button
                  className={`${styles.footerTaskButton} ${currentTask === 2 ? styles.selected : ''}`}
                  onClick={() => switchToTask(2)}
                >
                  Task 2
                </button>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={styles.footerSubmitButton}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </nav>
        </>
      )}

      {/* Test Evaluation Modal */}
      {showEvaluationModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {/* Gradient Header */}
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Test Evaluation</h2>
            </div>
            
            {/* Modal Body */}
            <div className={styles.modalBody}>
              <p className={styles.modalMessage}>
                Your test has been successfully submitted. The evaluation will be processed by the system.
              </p>
            </div>
            
            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <button
                onClick={handleModalClose}
                className={styles.evaluationButton}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Options Modal */}
      {showOptionsModal && (
        <div 
          className={styles.optionsModalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOptionsModal(false)
            }
          }}
        >
          <div className={styles.optionsModal}>
            <h2 className={styles.optionsModalTitle}>Options</h2>
            {!showContrastPanel && !showTextSizePanel && !showInstructionsPanel ? (
              <div className={styles.optionsMenuList}>
                <div 
                  className={styles.optionsMenuItem}
                  onClick={() => setShowContrastPanel(true)}
                >
                  <div className={styles.optionsMenuItemLeft}>
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 2 A 10 10 0 0 1 12 22 Z" fill="currentColor"/>
                    </svg>
                    <span>Contrast</span>
                  </div>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </div>
                <div className={styles.optionsMenuDivider}></div>
                <div 
                  className={styles.optionsMenuItem}
                  onClick={() => setShowTextSizePanel(true)}
                >
                  <div className={styles.optionsMenuItemLeft}>
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                      <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
                    </svg>
                    <span>Text size</span>
                  </div>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </div>
                <div className={styles.optionsMenuDivider}></div>
                <div 
                  className={styles.optionsMenuItem}
                  onClick={() => setShowInstructionsPanel(true)}
                >
                  <div className={styles.optionsMenuItemLeft}>
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="currentColor"/>
                      <path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Test Instructions</span>
                  </div>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            ) : showContrastPanel ? (
              <div className={styles.contrastPanel}>
                <div className={styles.contrastPanelHeader}>
                  <button 
                    className={styles.contrastBackButton}
                    onClick={() => setShowContrastPanel(false)}
                  >
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                  </button>
                  <h3 className={styles.contrastPanelTitle}>Contrast</h3>
                </div>
                <div className={styles.contrastOptionsList}>
                  <div 
                    className={styles.contrastOption}
                    onClick={() => setContrastTheme('black-on-white')}
                  >
                    <div className={styles.contrastCheckmarkContainer}>
                      {contrastTheme === 'black-on-white' && (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={styles.contrastCheckmark}>
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                    <span>Black on white</span>
                  </div>
                  <div className={styles.contrastOptionDivider}></div>
                  <div 
                    className={styles.contrastOption}
                    onClick={() => setContrastTheme('white-on-black')}
                  >
                    <div className={styles.contrastCheckmarkContainer}>
                      {contrastTheme === 'white-on-black' && (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={styles.contrastCheckmark}>
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                    <span>White on black</span>
                  </div>
                  <div className={styles.contrastOptionDivider}></div>
                  <div 
                    className={styles.contrastOption}
                    onClick={() => setContrastTheme('yellow-on-black')}
                  >
                    <div className={styles.contrastCheckmarkContainer}>
                      {contrastTheme === 'yellow-on-black' && (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={styles.contrastCheckmark}>
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                    <span>Yellow on black</span>
                  </div>
                </div>
              </div>
            ) : showTextSizePanel ? (
              <div className={styles.contrastPanel}>
                <div className={styles.contrastPanelHeader}>
                  <button 
                    className={styles.contrastBackButton}
                    onClick={() => setShowTextSizePanel(false)}
                  >
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                  </button>
                  <h3 className={styles.contrastPanelTitle}>Text size</h3>
                </div>
                <div className={styles.contrastOptionsList}>
                  <div 
                    className={styles.contrastOption}
                    onClick={() => setTextSize('regular')}
                  >
                    <div className={styles.contrastCheckmarkContainer}>
                      {textSize === 'regular' && (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={styles.contrastCheckmark}>
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                    <span>Regular</span>
                  </div>
                  <div className={styles.contrastOptionDivider}></div>
                  <div 
                    className={styles.contrastOption}
                    onClick={() => setTextSize('large')}
                  >
                    <div className={styles.contrastCheckmarkContainer}>
                      {textSize === 'large' && (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={styles.contrastCheckmark}>
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                    <span>Large</span>
                  </div>
                  <div className={styles.contrastOptionDivider}></div>
                  <div 
                    className={styles.contrastOption}
                    onClick={() => setTextSize('extra-large')}
                  >
                    <div className={styles.contrastCheckmarkContainer}>
                      {textSize === 'extra-large' && (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={styles.contrastCheckmark}>
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                    <span>Extra Large</span>
                  </div>
                </div>
              </div>
            ) : showInstructionsPanel ? (
              <div className={styles.contrastPanel}>
                <div className={styles.contrastPanelHeader}>
                  <button 
                    className={styles.contrastBackButton}
                    onClick={() => setShowInstructionsPanel(false)}
                  >
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                  </button>
                  <h3 className={styles.contrastPanelTitle}>Test Instructions</h3>
                </div>
                <div className={styles.instructionsContent}>
                  <div className={styles.instructionsSection}>
                    <h4 className={styles.instructionsSectionTitle}>General Instructions</h4>
                    <ul className={styles.instructionsList}>
                      <li>You will have {testData.test.totalTimeMinutes} minutes to complete this test.</li>
                      <li>The test consists of 2 writing tasks.</li>
                      <li>Complete both tasks within the time limit.</li>
                      <li>You can navigate between tasks using the task buttons at the bottom.</li>
                      <li>Your answers will be saved when you submit the test.</li>
                    </ul>
                  </div>
                  <div className={styles.instructionsSection}>
                    <h4 className={styles.instructionsSectionTitle}>Task Requirements</h4>
                    <ul className={styles.instructionsList}>
                      <li><strong>Task 1:</strong> Write at least 150 words (20 minutes recommended). This task requires you to describe, summarize, or explain information from a graph, chart, or diagram.</li>
                      <li><strong>Task 2:</strong> Write at least 250 words (40 minutes recommended). This task requires you to write an essay in response to a point of view, argument, or problem.</li>
                    </ul>
                  </div>
                  <div className={styles.instructionsSection}>
                    <h4 className={styles.instructionsSectionTitle}>Tips</h4>
                    <ul className={styles.instructionsList}>
                      <li>Plan your writing before you start - spend a few minutes organizing your ideas.</li>
                      <li>Pay attention to word count requirements - Task 1 needs at least 150 words, Task 2 needs at least 250 words.</li>
                      <li>Use appropriate academic vocabulary and formal language.</li>
                      <li>Check your grammar, spelling, and punctuation before submitting.</li>
                      <li>Manage your time wisely - allocate more time for Task 2 as it carries more weight.</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
        </div>
      )}
    </>
  )
}

