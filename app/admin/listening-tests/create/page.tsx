'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ReadingTest {
  id: string
  title: string
}

export default function CreateListeningTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [readingTests, setReadingTests] = useState<ReadingTest[]>([])
  const [selectedReadingTestId, setSelectedReadingTestId] = useState<string>('')
  const [loadingReadingTests, setLoadingReadingTests] = useState(true)

  useEffect(() => {
    const fetchReadingTests = async () => {
      try {
        const response = await fetch('/api/admin/reading-tests')
        const data = await response.json()
        if (response.ok) {
          setReadingTests(data.readingTests || [])
        }
      } catch (error) {
        console.error('Error fetching reading tests:', error)
      } finally {
        setLoadingReadingTests(false)
      }
    }
    fetchReadingTests()
  }, [])

  const loadFromJson = async () => {
    if (!confirm('Are you sure you want to load data from listening-test-data.json? This will create a new listening test with all parts and questions.')) {
      return
    }

    setLoading(true)
    setMessage(null)
    
    try {
      console.log('🔄 Starting JSON load...')
      
      const response = await fetch('/api/admin/listening-tests/load-from-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          readingTestId: selectedReadingTestId || null
        })
      })

      console.log('📡 Response status:', response.status)

      const responseText = await response.text()
      console.log('📡 Response body:', responseText)

      if (!response.ok) {
        const errorData = JSON.parse(responseText).error || responseText
        throw new Error(`API returned ${response.status}: ${errorData}`)
      }

      const result = JSON.parse(responseText)
      console.log('✅ JSON data loaded successfully:', result)

      setMessage({
        type: 'success',
        text: `Listening test "${result.listeningTest?.title || 'Untitled'}" created successfully! Redirecting...`
      })

      setTimeout(() => {
        router.push('/admin/listening-tests')
      }, 2000)
    } catch (error) {
      console.error('❌ Error loading JSON:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setMessage({
        type: 'error',
        text: `Failed to load JSON data: ${errorMessage}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Create Listening Test
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Create a new IELTS listening test with parts and questions. You can load from the JSON file.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <div className="flex space-x-3">
            <Link
              href="/admin/listening-tests"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Listening Tests
            </Link>
            <button
              onClick={loadFromJson}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading from JSON...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Load from JSON
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setMessage(null)}
                className={`inline-flex rounded-md p-1.5 ${
                  message.type === 'success'
                    ? 'text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600'
                    : 'text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600'
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reading Test Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Associate with Reading Test (Optional)</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="reading-test-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Reading Test
            </label>
            <select
              id="reading-test-select"
              value={selectedReadingTestId}
              onChange={(e) => setSelectedReadingTestId(e.target.value)}
              disabled={loadingReadingTests}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">None (Standalone Listening Test)</option>
              {readingTests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500">
              Optionally associate this listening test with a reading test. This allows linking tests together in the student portal.
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">How to Create a Listening Test</h3>
        <p className="text-sm text-blue-800 mb-4">
          Currently, you can create a listening test by loading data from the JSON file. The system will automatically:
        </p>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Parse all 4 parts with their questions</li>
          <li>Create fill-in-the-blank questions (Part 1 & 4)</li>
          <li>Create single choice questions (Part 2 & 3)</li>
          <li>Create matching questions (Part 2 & 3)</li>
          <li>Store correct answers for all questions</li>
        </ul>
      </div>
    </div>
  )
}

