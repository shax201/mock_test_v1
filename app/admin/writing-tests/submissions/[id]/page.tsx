'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface PassageContent {
  id: string
  contentId: string
  text: string
  order: number
}

interface Question {
  id: string
  questionNumber: number
  type: string
  questionText: string
  points: number
  readingPassage: {
    id: string
    title: string
    order: number
  } | null
}

interface Passage {
  id: string
  title: string
  order: number
  contents: PassageContent[]
  questions: Question[]
}

interface Submission {
  id: string
  student: {
    id: string
    name: string
    email: string
  }
  test: {
    id: string
    title: string
    readingTest: {
      id: string
      title: string
    } | null
  }
  answers: any
  isCompleted: boolean
  completedAt: string | null
  score: number | null
  band: number | null
  createdAt: string
  updatedAt: string
}

export default function WritingTestSubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const submissionId = params?.id as string

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [testDetails, setTestDetails] = useState<{ passages: Passage[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [evaluationError, setEvaluationError] = useState('')
  const [evaluationSuccess, setEvaluationSuccess] = useState(false)
  const [task1Band, setTask1Band] = useState<string>('')
  const [task2Band, setTask2Band] = useState<string>('')
  const [overallBand, setOverallBand] = useState<string>('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (submissionId) {
      fetchSubmission()
    }
  }, [submissionId])

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/admin/writing-tests/submissions/${submissionId}`)
      const data = await response.json()

      if (response.ok) {
        setSubmission(data.submission)
        setTestDetails(data.testDetails)
      } else {
        setError(data.error || 'Failed to fetch submission')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getWordCount = (text: string | null | undefined): number => {
    if (!text || typeof text !== 'string') return 0
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const getAnswerForQuestion = (questionId: string): string => {
    if (!submission?.answers || typeof submission.answers !== 'object') return ''
    return submission.answers[questionId] || ''
  }

  // Get task questions
  const getTaskQuestions = () => {
    if (!testDetails) return { task1: null, task2: null }
    
    let task1: Question | null = null
    let task2: Question | null = null
    
    testDetails.passages.forEach((passage) => {
      passage.questions.forEach((question) => {
        if (question.type === 'TASK_1' && !task1) {
          task1 = question
        } else if (question.type === 'TASK_2' && !task2) {
          task2 = question
        }
      })
    })
    
    return { task1, task2 }
  }

  const handleEvaluate = async () => {
    setEvaluating(true)
    setEvaluationError('')
    setEvaluationSuccess(false)

    try {
      const body: any = {}
      
      if (overallBand) {
        body.band = parseFloat(overallBand)
      } else {
        if (task1Band) body.task1Band = parseFloat(task1Band)
        if (task2Band) body.task2Band = parseFloat(task2Band)
      }

      if (!body.band && !body.task1Band && !body.task2Band) {
        setEvaluationError('Please enter at least one band score')
        setEvaluating(false)
        return
      }

      const response = await fetch(`/api/admin/writing-tests/submissions/${submissionId}/evaluate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        setEvaluationSuccess(true)
        // Update submission state
        if (submission) {
          setSubmission({
            ...submission,
            band: data.submission.band,
            score: data.submission.score,
            updatedAt: data.submission.updatedAt
          })
        }
        // Reset form
        setTask1Band('')
        setTask2Band('')
        setOverallBand('')
        // Clear success message after 3 seconds
        setTimeout(() => setEvaluationSuccess(false), 3000)
      } else {
        setEvaluationError(data.error || 'Failed to evaluate submission')
      }
    } catch (error) {
      setEvaluationError('Network error. Please try again.')
    } finally {
        setEvaluating(false)
    }
  }

  const handleDelete = async () => {
    if (!submission) return

    if (!confirm(`Are you sure you want to delete this submission from ${submission.student.name}? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/writing-tests/submissions/${submissionId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect back to submissions list
        router.push('/admin/writing-tests/submissions')
      } else {
        alert(data.error || 'Failed to delete submission')
        setDeleting(false)
      }
    } catch (error) {
      alert('Network error. Please try again.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !submission || !testDetails) {
    return (
      <div className="space-y-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error || 'Submission not found'}</div>
            </div>
          </div>
        </div>
        <Link
          href="/admin/writing-tests/submissions"
          className="inline-flex items-center text-blue-600 hover:text-blue-900"
        >
          ← Back to Submissions
        </Link>
      </div>
    )
  }

  // Calculate total word count
  let totalWordCount = 0
  testDetails.passages.forEach((passage) => {
    passage.questions.forEach((question) => {
      const answer = getAnswerForQuestion(question.id)
      totalWordCount += getWordCount(answer)
    })
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Writing Test Submission
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Review student's writing test submission
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <Link
            href="/admin/writing-tests/submissions"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to Submissions
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Submission
              </>
            )}
          </button>
        </div>
      </div>

      {/* Student Info Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Name</label>
            <p className="mt-1 text-sm text-gray-900">{submission.student.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="mt-1 text-sm text-gray-900">{submission.student.email}</p>
          </div>
        </div>
      </div>

      {/* Test Info Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Test Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Writing Test</label>
            <p className="mt-1 text-sm text-gray-900">{submission.test.title}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Based on Reading Test</label>
            <p className="mt-1 text-sm text-gray-900">{submission.test.readingTest?.title || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Band Score</label>
            <p className="mt-1 text-sm text-gray-900">
              {submission.band !== null ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Band {submission.band.toFixed(1)}
                </span>
              ) : (
                <span className="text-gray-400">Pending</span>
              )}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Total Word Count</label>
            <p className="mt-1 text-sm text-gray-900 font-semibold">{totalWordCount} words</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Submitted At</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(submission.completedAt)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Status</label>
            <p className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Completed
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Evaluation Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Evaluate Submission</h3>
        
        {evaluationSuccess && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Evaluation saved successfully!
                </p>
              </div>
            </div>
          </div>
        )}

        {evaluationError && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{evaluationError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {(() => {
            const { task1, task2 } = getTaskQuestions()
            const hasBothTasks = task1 && task2

            if (hasBothTasks) {
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Task 1 Band Score (0-9)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="9"
                        step="0.5"
                        value={task1Band}
                        onChange={(e) => setTask1Band(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="e.g., 6.5"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Weight: 1/3 of overall score
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Task 2 Band Score (0-9)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="9"
                        step="0.5"
                        value={task2Band}
                        onChange={(e) => setTask2Band(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="e.g., 7.0"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Weight: 2/3 of overall score
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600 mb-2">Or enter overall band score directly:</p>
                    <div className="max-w-xs">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Overall Band Score (0-9)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="9"
                        step="0.5"
                        value={overallBand}
                        onChange={(e) => setOverallBand(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="e.g., 6.5"
                      />
                    </div>
                  </div>
                </>
              )
            } else {
              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Band Score (0-9)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    value={overallBand}
                    onChange={(e) => setOverallBand(e.target.value)}
                    className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., 6.5"
                  />
                </div>
              )
            }
          })()}

          <div className="flex items-center space-x-4 pt-4">
            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {evaluating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Evaluating...
                </>
              ) : (
                'Submit Evaluation'
              )}
            </button>
            {submission.band !== null && (
              <span className="text-sm text-gray-500">
                Last evaluated: {formatDate(submission.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Passages and Answers */}
      {testDetails.passages.map((passage) => (
        <div key={passage.id} className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{passage.title}</h3>
          
          {/* Passage Contents */}
          {passage.contents.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Passage Content</h4>
              <div className="space-y-2">
                {passage.contents.map((content) => (
                  <p key={content.id} className="text-sm text-gray-900">
                    {content.text}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Questions and Answers */}
          <div className="space-y-6">
            {passage.questions.map((question) => {
              const answer = getAnswerForQuestion(question.id)
              const wordCount = getWordCount(answer)

              return (
                <div key={question.id} className="border-t border-gray-200 pt-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-md font-medium text-gray-900">
                        Task {question.questionNumber} ({question.type === 'TASK_1' ? 'Task 1' : 'Task 2'})
                      </h4>
                      <span className="text-sm text-gray-500">{wordCount} words</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">{question.questionText}</p>
                    {question.readingPassage && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-medium text-blue-800 mb-1">Related Reading Passage:</p>
                        <p className="text-sm text-blue-900">{question.readingPassage.title}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student's Answer:
                    </label>
                    <div className="bg-white rounded border border-gray-300 p-4 min-h-[200px]">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {answer || <span className="text-gray-400 italic">No answer provided</span>}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

