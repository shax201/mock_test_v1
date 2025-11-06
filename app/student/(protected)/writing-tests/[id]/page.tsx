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
    // Use the writing test ID or session ID for results
    const resultsTestId = submittedSessionId || params.id
    router.push(`/student/results/${resultsTestId}?tab=question-wise`)
  }

  // Start the test
  const startTest = () => {
    setTestStarted(true)
  }

  // Submit writing test answers
  const handleSubmit = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

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
        // Store session ID for navigation to results
        if (data.session?.id) {
          setSubmittedSessionId(data.session.id)
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
    <div className={styles.mainContainer}>
      {/* Header - Matching reading test style */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>{testData.test.title}</h2>
        </div>
        <div className={styles.headerRight}>
          {testStarted && (
            <div className={styles.timerContainer}>
              <span>Time Remaining:</span>
              <span className={styles.timerDisplay}>{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
      </div>

      {!testStarted ? (
        /* Start Screen */
        <div className={styles.startScreen}>
          <div className={styles.startCard}>
            <h1 className={styles.startTitle}>{testData.test.title}</h1>
            <div className="text-left space-y-4 mb-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-purple-900 mb-2">Test Instructions</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• You will have {testData.test.totalTimeMinutes} minutes to complete this test</li>
                  <li>• Complete both writing tasks</li>
                  <li>• Task 1: Write at least 150 words (20 minutes recommended)</li>
                  <li>• Task 2: Write at least 250 words (40 minutes recommended)</li>
                  <li>• Your answers will be saved when you submit</li>
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
            <button onClick={startTest} className={styles.startButton}>
              Start Test
            </button>
          </div>
        </div>
      ) : (
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
    </div>
  )
}

