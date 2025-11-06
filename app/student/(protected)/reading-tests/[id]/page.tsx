'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReadingTestComponent from '@/components/test/ReadingTestComponent'
import Link from 'next/link'
import StudentHeader from '@/components/student/StudentHeader'

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

  useEffect(() => {
    if (params.id) {
      fetchTestData()
    }
  }, [params.id])

  const fetchTestData = async () => {
    try {
      const response = await fetch(`/api/student/reading-tests/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setTestData(data)
      } else {
        setError(data.error || 'Failed to load test data')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
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

      // Step 2: Submit reading test results to backend
      // This saves the test session and marks it as completed
      const response = await fetch(`/api/student/reading-tests/${params.id}/results`, {
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

        // Step 4: Fetch associated writing test for navigation
        // Check if there's a writing test based on this reading test
        try {
          const writingTestResponse = await fetch(
            `/api/student/writing-tests/by-reading-test/${params.id}`
          )

          if (writingTestResponse.ok) {
            const writingTestData = await writingTestResponse.json()
            const writingTestId = writingTestData.writingTest?.id

            if (writingTestId) {
              // Step 5: Navigate to writing test page
              // Redirect to the writing test page after successful submission
              console.log('📝 Navigating to writing test:', writingTestId)
              router.push(`/student/writing-tests/${writingTestId}`)
              return // Exit early on successful navigation
            } else {
              // No writing test found, but reading test was submitted successfully
              console.log('ℹ️ No writing test found for this reading test')
              alert(
                `Reading test completed! Score: ${results.score}/${results.details.length}, Band: ${results.band}\nResults have been saved successfully.`
              )
            }
          } else {
            // Writing test fetch failed, but reading test was submitted
            console.warn('⚠️ Could not fetch writing test, but reading test was saved')
            alert(
              `Reading test completed! Score: ${results.score}/${results.details.length}, Band: ${results.band}\nResults have been saved successfully.`
            )
          }
        } catch (writingTestError) {
          // Error fetching writing test, but reading test was submitted successfully
          console.error('❌ Error fetching writing test:', writingTestError)
          alert(
            `Reading test completed! Score: ${results.score}/${results.details.length}, Band: ${results.band}\nResults have been saved successfully.`
          )
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
   
      <ReadingTestComponent
        testData={testData}
        onTestComplete={handleTestCompletion}
      />
    
  )
}
