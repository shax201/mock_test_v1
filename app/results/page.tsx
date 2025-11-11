'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ResultData {
  candidateNumber: string
  testTitle: string
  bands: {
    listening: number
    reading: number
    writing: number
    speaking: number
    overall: number
  }
  feedback: {
    writing: Array<{
      questionId: string
      category: string
      text: string
      comment: string
      range: [number, number]
    }>
  }
  generatedAt: string
}

export default function ResultsPage() {
  const [searchType, setSearchType] = useState<'token' | 'candidate'>('token')
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<ResultData | null>(null)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch('/api/student/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: searchType,
          value: searchValue
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data.results)
      } else {
        setError(data.error || 'No results found')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!results) return

    try {
      const response = await fetch('/api/student/results/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateNumber: results.candidateNumber
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `IELTS_Results_${results.candidateNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Failed to download PDF')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">View Your Results</h1>
          <p className="mt-2 text-gray-600">Enter your access token or candidate number to view your IELTS results</p>
        </div>

        {!results ? (
          <div className="bg-white shadow rounded-lg p-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  How would you like to search?
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="searchType"
                      value="token"
                      checked={searchType === 'token'}
                      onChange={(e) => setSearchType(e.target.value as 'token' | 'candidate')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Access Token</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="searchType"
                      value="candidate"
                      checked={searchType === 'candidate'}
                      onChange={(e) => setSearchType(e.target.value as 'token' | 'candidate')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Candidate Number</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="searchValue" className="block text-sm font-medium text-gray-700 mb-2">
                  {searchType === 'token' ? 'Access Token' : 'Candidate Number'}
                </label>
                <input
                  type="text"
                  id="searchValue"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={searchType === 'token' ? 'Enter your access token' : 'Enter your candidate number'}
                  required
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'View Results'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Results Header */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">IELTS Results</h2>
                  <p className="text-gray-600">Candidate: {results.candidateNumber}</p>
                  <p className="text-gray-600">Test: {results.testTitle}</p>
                  <p className="text-gray-600">
                    Generated: {new Date(results.generatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>

            {/* Band Scores */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Band Scores</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(results.bands).map(([module, score]) => (
                  <div key={module} className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold ${
                      score >= 7 ? 'bg-green-100 text-green-800' :
                      score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {score}
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-900 capitalize">
                      {module}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Writing Feedback */}
            {results.feedback.writing.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Writing Feedback</h3>
                <div className="space-y-4">
                  {results.feedback.writing.map((feedback, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-xs text-blue-600 uppercase tracking-wide">
                          Question {feedback.questionId} · {feedback.category}
                        </p>
                        <p className="mt-2 text-sm text-blue-800">
                          <strong>Comment:</strong> {feedback.comment}
                        </p>
                        <p className="mt-2 text-sm text-gray-700">
                          <strong>Text:</strong> "{feedback.text}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setResults(null)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Search Another Result
              </button>
              <button
                onClick={() => router.push('/test')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Take Another Test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
