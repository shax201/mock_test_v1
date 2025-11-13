'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReadingTestComponent from '@/components/test/ReadingTestComponent'

interface TestSession {
  id: string
  testId: string
  studentId: string
  startedAt: string
  answers: Record<string, string>
  isCompleted: boolean
  completedAt?: string
  score?: number
  band?: number
}

interface TestData {
  test?: {
    title: string
    totalQuestions: number
    totalTimeMinutes: number
  }
  passages: Array<{
    id: number
    title: string
    content: Array<{
      id: string
      text: string
    }>
  }>
  questions: Record<string, any>
  correctAnswers: Record<string, string>
  passageConfigs: Array<{
    part: number
    total: number
    start: number
  }>
  bandCalculation: {
    ranges: Array<{
      minScore: number
      band: number
    }>
  }
}

export default function StudentReadingTestPage() {
  const params = useParams()
  const router = useRouter()
  const [testData, setTestData] = useState<TestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchAssignmentAndTestData()
    }
  }, [params.id])

  const fetchAssignmentAndTestData = async () => {
    try {
      // First, fetch assignment details to get readingTestId
      const assignmentResponse = await fetch(`/api/student/assignments/${params.id}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (!assignmentResponse.ok) {
        const errorData = await assignmentResponse.json()
        setError(errorData.error || 'Failed to load assignment')
        setLoading(false)
        return
      }

      const assignment = await assignmentResponse.json()

      // Check if assignment is accessible
      const now = new Date()
      const validFrom = assignment.validFrom ? new Date(assignment.validFrom) : null
      const validUntil = assignment.validUntil ? new Date(assignment.validUntil) : null

      if (validUntil && validUntil < now) {
        setError('This assignment has expired')
        setLoading(false)
        return
      }

      if (validFrom && validFrom > now) {
        setError('This assignment is not yet available')
        setLoading(false)
        return
      }

      // Check if already completed
      const assignmentsListResponse = await fetch('/api/student/assignments')
      if (assignmentsListResponse.ok) {
        const assignmentsData = await assignmentsListResponse.json()
        const assignmentStatus = assignmentsData.assignments?.find((a: any) => a.id === params.id)
        if (assignmentStatus?.status === 'COMPLETED') {
          router.push(`/student/results/${assignment.id}`)
          return
        }
      }

      // Fetch reading test data using readingTestId
      const readingTestResponse = await fetch(`/api/student/reading-tests/${assignment.readingTestId}`)
      
      if (!readingTestResponse.ok) {
        const errorData = await readingTestResponse.json()
        setError(errorData.error || 'Failed to load reading test')
        setLoading(false)
        return
      }

      const readingTestData = await readingTestResponse.json()
      setTestData(readingTestData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching assignment and test data:', error)
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const handleStartTest = () => {
    setShowInstructions(false)
  }

  const handleTestCompletion = async (results: any) => {
    // Set submitting state to prevent multiple submissions
    setIsSubmitting(true)

    try {
      // Step 1: Extract answers from details array
      // Convert the results details array into a flat answers object
      const answers: Record<string, string> = {}
      if (results.details && Array.isArray(results.details)) {
        results.details.forEach((detail: any) => {
          if (detail.qNum !== undefined) {
            answers[detail.qNum.toString()] = detail.userAnswer || ''
          }
        })
      }

      // Step 2: Get reading test ID from assignment
      const assignmentResponse = await fetch(`/api/student/assignments/${params.id}`)
      if (!assignmentResponse.ok) {
        throw new Error('Failed to fetch assignment')
      }
      const assignment = await assignmentResponse.json()
      const readingTestId = assignment.readingTestId

      if (!readingTestId) {
        throw new Error('Reading test ID not found in assignment')
      }

      // Step 3: Submit reading test results to backend
      // This saves the test session and marks it as completed
      const response = await fetch(`/api/student/reading-tests/${readingTestId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: results.score || 0,
          band: results.band || 0,
          answers: answers,
        }),
      })

      const data = await response.json()

      // Step 3: Handle submission result
      if (response.ok) {
        console.log('✅ Reading test results saved successfully:', data)

        // Get session ID from response for more accurate navigation
        const sessionId = data.session?.id || params.id

        // Step 4: Check for associated listening test first
        try {
          const listeningTestResponse = await fetch(
            `/api/student/listening-tests/by-reading-test/${readingTestId}`
          )

          if (listeningTestResponse.ok) {
            const listeningTestData = await listeningTestResponse.json()
            const listeningTestId = listeningTestData.listeningTest?.id

            if (listeningTestId) {
              // Step 5: Navigate to listening test page
              console.log('🎧 Navigating to listening test:', listeningTestId)
              setIsRedirecting(true)
              setTimeout(() => {
                router.push(`/student/listening-tests/${listeningTestId}`)
              }, 500)
              return // Exit early on successful navigation
            }
          }

          // Step 6: If no listening test, check for writing test
          const writingTestResponse = await fetch(
            `/api/student/writing-tests/by-reading-test/${readingTestId}`
          )

          if (writingTestResponse.ok) {
            const writingTestData = await writingTestResponse.json()
            const writingTestId = writingTestData.writingTest?.id

            if (writingTestId) {
              // Step 7: Navigate to writing test page
              console.log('📝 Navigating to writing test:', writingTestId)
              setIsRedirecting(true)
              setTimeout(() => {
                router.push(`/student/writing-tests/${writingTestId}`)
              }, 500)
              return // Exit early on successful navigation
            }
          }

          // Step 8: No listening or writing test found, redirect to results
          console.log('ℹ️ No listening or writing test found, redirecting to results')
          setIsRedirecting(true)
          setTimeout(() => {
            router.push(`/student/results/${sessionId}`)
          }, 500)
        } catch (error) {
          // Error fetching tests, but reading test was submitted successfully
          console.error('❌ Error fetching associated tests:', error)
          // Still redirect to results page using session ID if available
          setIsRedirecting(true)
          setTimeout(() => {
            router.push(`/student/results/${sessionId}`)
          }, 500)
        }
      } else {
        // Step 6: Handle submission failure
        // Reading test submission failed, show error to user
        console.error('❌ Failed to save reading test results:', data.error || data.message)
        alert(
          `Test completed! Score: ${results.score}/${results.details.length}, Band: ${results.band}\nWarning: ${data.error || data.message || 'Failed to save results to database.'}`
        )
      }
    } catch (error) {
      // Step 7: Handle network or unexpected errors
      // Catch any errors during the submission process
      console.error('❌ Error saving test results:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(
        `Test completed! Score: ${results.score}/${results.details.length}, Band: ${results.band}\nWarning: Failed to save results to database. Error: ${errorMessage}`
      )
    } finally {
      // Step 8: Reset submitting state
      // Allow user to retry if needed
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading IELTS Reading Test...</p>
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

  return (
    <>
      {/* Instructions Modal */}
      {showInstructions && testData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#12355b',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              IELTS Reading Test Instructions
            </h2>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f6feb',
                marginBottom: '12px'
              }}>
                General Instructions
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{
                  marginBottom: '10px',
                  paddingLeft: '20px',
                  position: 'relative',
                  lineHeight: '1.6',
                  color: '#333'
                }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  You have <strong>{testData.test?.totalTimeMinutes || 60} minutes</strong> to complete the Reading test.
                </li>
                <li style={{
                  marginBottom: '10px',
                  paddingLeft: '20px',
                  position: 'relative',
                  lineHeight: '1.6',
                  color: '#333'
                }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  The test consists of <strong>{testData.passages?.length || 3} passages</strong> with <strong>{testData.test?.totalQuestions || 40} questions</strong> in total.
                </li>
                <li style={{
                  marginBottom: '10px',
                  paddingLeft: '20px',
                  position: 'relative',
                  lineHeight: '1.6',
                  color: '#333'
                }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  Read each passage carefully and answer all questions.
                </li>
                <li style={{
                  marginBottom: '10px',
                  paddingLeft: '20px',
                  position: 'relative',
                  lineHeight: '1.6',
                  color: '#333'
                }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  You can navigate between questions using the navigation arrows or the question numbers at the bottom.
                </li>
                <li style={{
                  marginBottom: '10px',
                  paddingLeft: '20px',
                  position: 'relative',
                  lineHeight: '1.6',
                  color: '#333'
                }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  Review your answers before submitting the test.
                </li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f6feb',
                marginBottom: '12px'
              }}>
                Question Types
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{
                  marginBottom: '10px',
                  paddingLeft: '20px',
                  position: 'relative',
                  lineHeight: '1.6',
                  color: '#333'
                }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  <strong>Matching Headings:</strong> Match headings to paragraphs or sections.
                </li>
                <li style={{
                  marginBottom: '10px',
                  paddingLeft: '20px',
                  position: 'relative',
                  lineHeight: '1.6',
                  color: '#333'
                }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  <strong>True/False/Not Given:</strong> Determine if statements are true, false, or not given based on the passage.
                </li>
                <li style={{
                  marginBottom: '10px',
                  paddingLeft: '20px',
                  position: 'relative',
                  lineHeight: '1.6',
                  color: '#333'
                }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  <strong>Multiple Choice:</strong> Choose the best answer from the options provided.
                </li>
                <li style={{
                  marginBottom: '10px',
                  paddingLeft: '20px',
                  position: 'relative',
                  lineHeight: '1.6',
                  color: '#333'
                }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  <strong>Summary Completion:</strong> Fill in the blanks in a summary using words from the passage.
                </li>
                <li style={{
                  marginBottom: '10px',
                  paddingLeft: '20px',
                  position: 'relative',
                  lineHeight: '1.6',
                  color: '#333'
                }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  <strong>Matching Information:</strong> Match information to paragraphs or sections.
                </li>
              </ul>
            </div>

            <div style={{
              backgroundColor: '#fff3cd',
              borderLeft: '4px solid #ffc107',
              padding: '16px',
              borderRadius: '4px',
              marginBottom: '24px'
            }}>
              <p style={{
                margin: 0,
                color: '#856404',
                lineHeight: '1.6'
              }}>
                <strong>Important:</strong> Make sure you have a stable internet connection and a quiet environment before starting the test. The timer will begin as soon as you click "Start Test".
              </p>
            </div>

            <button
              onClick={handleStartTest}
              style={{
                width: '100%',
                padding: '14px 28px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
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
            Redirecting to next test...
          </p>
        </div>
      )}
      {!showInstructions && (
        <ReadingTestComponent
          testData={testData}
          onTestComplete={handleTestCompletion}
        />
      )}
    </>
  )
}
