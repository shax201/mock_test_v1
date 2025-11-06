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
                router.push(`/student/writing-tests/${writingTestId}`)
                return // Exit early on successful navigation
              }
            }
          } catch (writingTestError) {
            console.error('❌ Error fetching writing test:', writingTestError)
          }

          // Step 7: No writing test found, redirect to results page
          console.log('ℹ️ No writing test found, redirecting to results')
          router.push(`/student/results/${readingTestId}`)
        } else {
          // No reading test associated, just show completion message
          alert(
            `Listening test completed! Score: ${results.score}/40, Band: ${((raw: number) => {
              if (raw >= 39) return 9
              if (raw >= 37) return 8.5
              if (raw >= 35) return 8
              if (raw >= 32) return 7.5
              if (raw >= 30) return 7
              if (raw >= 26) return 6.5
              if (raw >= 23) return 6
              if (raw >= 18) return 5.5
              if (raw >= 16) return 5
              if (raw >= 13) return 4.5
              if (raw >= 10) return 4
              if (raw >= 8) return 3.5
              return 0
            })(results.score)}\nResults have been saved successfully.`
          )
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
    <ListeningTestComponent
      data={data}
      onSubmit={handleTestCompletion}
    />
  )
}


