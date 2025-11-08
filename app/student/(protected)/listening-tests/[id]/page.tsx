'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ListeningTestComponent, { ListeningTestData } from '@/components/test/ListeningTestComponent'

export default function StudentListeningTestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [data, setData] = useState<ListeningTestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { id } = await params
        const res = await fetch(`/api/student/listening-tests/${encodeURIComponent(id)}`)
        const json = await res.json()
        if (res.ok) setData(json as ListeningTestData)
        else setError(json.error || 'Failed to load test')
      } catch (e) {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  )
  if (error) return <div className="min-h-[50vh] flex items-center justify-center text-red-600">{error}</div>
  if (!data) return null

  const handleTestCompletion = async (results: { score: number; rows: any[] }) => {
    // Set submitting state to prevent multiple submissions
    setIsSubmitting(true)

    try {
      // Step 1: Extract answers from rows array
      const answers: Record<string, string> = {}
      if (results.rows && Array.isArray(results.rows)) {
        results.rows.forEach((row: any) => {
          if (row.question !== undefined) {
            answers[row.question.toString()] = row.userAnswer || ''
          }
        })
      }

      // Step 2: Submit listening test results to backend
      const { id } = await params
      const response = await fetch(`/api/student/listening-tests/${id}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: results.score || 0,
          answers: answers,
        }),
      })

      const data = await response.json()

      // Step 3: Handle submission result
      if (response.ok) {
        console.log('✅ Listening test results saved successfully:', data)

        // Get session ID from response for more accurate navigation
        const sessionId = data.session?.id || id

        // Step 4: Get reading test ID from the response
        const readingTestId = data.readingTestId

        if (readingTestId) {
          // Step 5: Check for associated writing test
          try {
            const writingTestResponse = await fetch(
              `/api/student/writing-tests/by-reading-test/${readingTestId}`
            )

            if (writingTestResponse.ok) {
              const writingTestData = await writingTestResponse.json()
              const writingTestId = writingTestData.writingTest?.id

              if (writingTestId) {
                // Step 6: Navigate to writing test page
                console.log('📝 Navigating to writing test:', writingTestId)
                setIsRedirecting(true)
                setTimeout(() => {
                  router.push(`/student/writing-tests/${writingTestId}`)
                }, 500)
                return // Exit early on successful navigation
              }
            }
          } catch (writingTestError) {
            console.error('❌ Error fetching writing test:', writingTestError)
          }

          // Step 7: No writing test found, redirect to results page
          // Use reading test ID to show combined results
          console.log('ℹ️ No writing test found, redirecting to results')
          setIsRedirecting(true)
          setTimeout(() => {
            router.push(`/student/results/${readingTestId}`)
          }, 500)
        } else {
          // No reading test associated, redirect to listening test results using session ID
          console.log('ℹ️ No reading test associated, redirecting to results')
          setIsRedirecting(true)
          setTimeout(() => {
            router.push(`/student/results/${sessionId}`)
          }, 500)
        }
      } else {
        // Step 8: Handle submission failure
        console.error('❌ Failed to save listening test results:', data.error || data.message)
        alert(
          `Test completed! Score: ${results.score}/40\nWarning: ${data.error || data.message || 'Failed to save results to database.'}`
        )
      }
    } catch (error) {
      // Step 9: Handle network or unexpected errors
      console.error('❌ Error saving test results:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(
        `Test completed! Score: ${results.score}/40\nWarning: Failed to save results to database. Error: ${errorMessage}`
      )
    } finally {
      // Step 10: Reset submitting state
      setIsSubmitting(false)
    }
  }

  return (
    <>
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
      <ListeningTestComponent
        data={data}
        onSubmit={handleTestCompletion}
      />
    </>
  )
}


