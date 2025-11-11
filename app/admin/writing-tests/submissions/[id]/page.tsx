'use client'

import { useEffect, useMemo, useState } from 'react'
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

type CriteriaKey = 'taskAchievement' | 'coherence' | 'lexical' | 'grammar'

const WRITING_CRITERIA: { key: CriteriaKey; label: string }[] = [
  { key: 'taskAchievement', label: 'Task Achievement' },
  { key: 'coherence', label: 'Coherence & Cohesion' },
  { key: 'lexical', label: 'Lexical Resource' },
  { key: 'grammar', label: 'Grammatical Range & Accuracy' }
]

const createEmptyScores = (): Record<CriteriaKey, string> =>
  WRITING_CRITERIA.reduce((acc, criterion) => {
    acc[criterion.key] = ''
    return acc
  }, {} as Record<CriteriaKey, string>)

const sanitizeScoreInput = (rawValue: string): string => {
  if (rawValue.trim() === '') {
    return ''
  }

  const parsed = parseFloat(rawValue)

  if (Number.isNaN(parsed)) {
    return ''
  }

  const clamped = Math.min(9, Math.max(0, parsed))
  const rounded = Math.round(clamped * 2) / 2

  return rounded.toFixed(1)
}

const computeBandFromScores = (scores: Record<CriteriaKey, string>): number | null => {
  const values: number[] = []

  for (const criterion of WRITING_CRITERIA) {
    const raw = scores[criterion.key]

    if (raw === '') {
      return null
    }

    const parsed = parseFloat(raw)

    if (Number.isNaN(parsed)) {
      return null
    }

    values.push(parsed)
  }

  if (!values.length) {
    return null
  }

  const average = values.reduce((total, value) => total + value, 0) / values.length

  return Math.round(average * 2) / 2
}

const formatBand = (band: number | null): string => {
  if (band === null) {
    return '--'
  }

  return band.toFixed(1)
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
  const [task1Scores, setTask1Scores] = useState<Record<CriteriaKey, string>>(() => createEmptyScores())
  const [task2Scores, setTask2Scores] = useState<Record<CriteriaKey, string>>(() => createEmptyScores())
  const [overallBandInput, setOverallBandInput] = useState<string>('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (submissionId) {
      fetchSubmission()
    }
  }, [submissionId])

  const handleCriteriaChange = (task: 'task1' | 'task2', key: CriteriaKey, value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '')

    if (task === 'task1') {
      setTask1Scores((prev) => ({
        ...prev,
        [key]: sanitized
      }))
    } else {
      setTask2Scores((prev) => ({
        ...prev,
        [key]: sanitized
      }))
    }
  }

  const handleCriteriaBlur = (task: 'task1' | 'task2', key: CriteriaKey, value: string) => {
    const normalized = sanitizeScoreInput(value)

    if (task === 'task1') {
      setTask1Scores((prev) => ({
        ...prev,
        [key]: normalized
      }))
    } else {
      setTask2Scores((prev) => ({
        ...prev,
        [key]: normalized
      }))
    }
  }

  const handleOverallBandChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '')

    setOverallBandInput(sanitized)
  }

  const handleOverallBandBlur = () => {
    setOverallBandInput((prev) => sanitizeScoreInput(prev))
  }

  const getWordCount = (text: string | null | undefined): number => {
    if (!text || typeof text !== 'string') return 0
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const getAnswerForQuestion = (questionId: string): string => {
    if (!submission?.answers || typeof submission.answers !== 'object') return ''
    return submission.answers[questionId] || ''
  }

  const task1Band = useMemo(() => computeBandFromScores(task1Scores), [task1Scores])
  const task2Band = useMemo(() => computeBandFromScores(task2Scores), [task2Scores])

  const weightedOverallBand = useMemo(() => {
    if (task1Band === null || task2Band === null) {
      return null
    }

    const weighted = (task1Band + task2Band * 2) / 3

    return Math.round(weighted * 2) / 2
  }, [task1Band, task2Band])

  const totalWordCount = useMemo(() => {
    if (!testDetails) {
      return 0
    }

    let totalWords = 0

    testDetails.passages.forEach((passage) => {
      passage.questions.forEach((question) => {
        const answer = getAnswerForQuestion(question.id)
        totalWords += getWordCount(answer)
      })
    })

    return totalWords
  }, [submission, testDetails])

  const expiryLabel = useMemo(() => {
    if (!submission?.completedAt) {
      return null
    }

    const expiryDate = new Date(submission.completedAt)
    expiryDate.setDate(expiryDate.getDate() + 3)

    const diffMs = expiryDate.getTime() - Date.now()

    if (diffMs <= 0) {
      return 'Expired'
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${days}d ${hours}h ${minutes}m`
  }, [submission?.completedAt])

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
      
      if (overallBandInput.trim()) {
        const normalizedOverall = sanitizeScoreInput(overallBandInput)

        if (normalizedOverall) {
          body.band = parseFloat(normalizedOverall)
        }
      }

      if (body.band === undefined) {
        if (task1Band !== null) {
          body.task1Band = task1Band
        }
        if (task2Band !== null) {
          body.task2Band = task2Band
        }
      }

      if (body.band === undefined && body.task1Band === undefined && body.task2Band === undefined) {
        setEvaluationError('Please enter an overall band or complete the task criteria.')
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
        setTask1Scores(createEmptyScores())
        setTask2Scores(createEmptyScores())
        setOverallBandInput('')
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
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="mt-2 h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-36 animate-pulse"></div>
          </div>
        </div>

        {/* Student Info Card Skeleton */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Test Info Card Skeleton */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-2"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Evaluation Form Skeleton */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-4"></div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
        </div>

        {/* Passage Skeleton */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-4"></div>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6">
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-4"></div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-40 animate-pulse mb-2"></div>
              <div className="bg-white rounded border border-gray-300 p-4 min-h-[200px]">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

  const overallBandToDisplay = submission.band !== null ? submission.band : weightedOverallBand
  const formattedOverallBand = formatBand(overallBandToDisplay)
  const formattedTask1Band = formatBand(task1Band)
  const formattedTask2Band = formatBand(task2Band)
  const weightedOverallDisplay = formatBand(weightedOverallBand)
  const submittedAtLabel = formatDate(submission.completedAt)
  const lastEvaluatedLabel = submission.band !== null ? formatDate(submission.updatedAt) : null
  const statusLabel = submission.isCompleted ? 'Completed' : 'In Progress'
  const statusBadgeClasses = submission.isCompleted
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700'

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/writing-tests/submissions"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            <span className="text-lg">←</span>
            Back to Submissions
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-full border border-red-500/10 bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {deleting ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Submission
              </>
            )}
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Writing Feedback</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">IELTS Writing Feedback</h1>
              <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm text-slate-600">
                <div>
                  <span className="font-semibold text-slate-900">Name:</span> {submission.student.name}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">ID:</span> {submission.id}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Date:</span> {submittedAtLabel}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between gap-4 sm:flex-row sm:items-center">
              {expiryLabel && (
                <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 2h6m0 0h6M12 2v2m-6 0h12m-4 16H8m8 0v2m-8-2v2m2-6h4m-4 0V8m4 8V8" />
                  </svg>
                  <span>
                    {expiryLabel === 'Expired' ? 'Feedback expired' : `Expires in: ${expiryLabel}`}
                  </span>
                </div>
              )}
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                <span className="text-xs uppercase tracking-wide text-blue-100">Band</span>
                <span className="text-2xl font-semibold">{formattedOverallBand}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-6 py-5">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Writing Task 1</h3>
                  <p className="mt-1 text-sm text-slate-500">Weight 1/3 of overall score</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  Band {formattedTask1Band}
                </span>
              </div>
              <div className="divide-y divide-slate-200">
                {WRITING_CRITERIA.map((criterion) => (
                  <div
                    key={`task1-${criterion.key}`}
                    className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{criterion.label}</p>
                      <p className="text-xs text-slate-500">Score (0-9 in 0.5 steps)</p>
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="9"
                      step="0.5"
                      value={task1Scores[criterion.key]}
                      onChange={(event) => handleCriteriaChange('task1', criterion.key, event.target.value)}
                      onBlur={(event) => handleCriteriaBlur('task1', criterion.key, event.target.value)}
                      className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      placeholder="--"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-6 py-5">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Writing Task 2</h3>
                  <p className="mt-1 text-sm text-slate-500">Weight 2/3 of overall score</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  Band {formattedTask2Band}
                </span>
              </div>
              <div className="divide-y divide-slate-200">
                {WRITING_CRITERIA.map((criterion) => (
                  <div
                    key={`task2-${criterion.key}`}
                    className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{criterion.label}</p>
                      <p className="text-xs text-slate-500">Score (0-9 in 0.5 steps)</p>
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="9"
                      step="0.5"
                      value={task2Scores[criterion.key]}
                      onChange={(event) => handleCriteriaChange('task2', criterion.key, event.target.value)}
                      onBlur={(event) => handleCriteriaBlur('task2', criterion.key, event.target.value)}
                      className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      placeholder="--"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Test Summary</h3>
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Writing Test</span>
                  <span className="flex-1 text-right font-medium text-slate-900">{submission.test.title}</span>
                </div>
                {submission.test.readingTest?.title && (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Reading Reference</span>
                    <span className="flex-1 text-right text-slate-900">{submission.test.readingTest?.title}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Word Count</span>
                  <span className="font-semibold text-slate-900">{totalWordCount} words</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Submitted</span>
                  <span className="text-slate-900">{submittedAtLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClasses}`}>
                    {statusLabel}
                  </span>
                </div>
                {lastEvaluatedLabel && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Last Evaluated</span>
                    <span className="text-slate-900">{lastEvaluatedLabel}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Save Evaluation</h3>
              <p className="mt-2 text-sm text-slate-500">
                Enter band scores for each criterion or override the final band directly.
              </p>

              {evaluationSuccess && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
                  <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Evaluation saved successfully.</span>
                </div>
              )}

              {evaluationError && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{evaluationError}</span>
                </div>
              )}

              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">Computed Overall</span>
                    <span className="text-base font-semibold text-slate-900">{weightedOverallDisplay}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Calculated automatically from Task 1 (33%) and Task 2 (67%).</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Overall Band Override (optional)
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="9"
                      step="0.5"
                      value={overallBandInput}
                      onChange={(event) => handleOverallBandChange(event.target.value)}
                      onBlur={handleOverallBandBlur}
                      className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      placeholder="e.g., 6.5"
                    />
                    <span className="text-xs text-slate-500">Leave blank to accept computed band.</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleEvaluate}
                disabled={evaluating}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/60 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {evaluating ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Evaluation'
                )}
              </button>

              {lastEvaluatedLabel && (
                <p className="mt-3 text-xs text-slate-500">
                  Last saved on {lastEvaluatedLabel}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {testDetails.passages.map((passage) => (
            <div
              key={passage.id}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-900">{passage.title}</h3>
                <span className="text-sm font-medium text-slate-500">Passage {passage.order}</span>
              </div>

              {passage.contents.length > 0 && (
                <div className="mt-5 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 text-sm leading-relaxed text-slate-700">
                  {passage.contents.map((content) => (
                    <p key={content.id}>{content.text}</p>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-6">
                {passage.questions.map((question) => {
                  const answer = getAnswerForQuestion(question.id)
                  const wordCount = getWordCount(answer)

                  return (
                    <div
                      key={question.id}
                      className="rounded-3xl border border-slate-100 bg-slate-50/60 p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-semibold text-slate-900">
                            {question.type === 'TASK_1' ? 'Task 1' : 'Task 2'} · Question {question.questionNumber}
                          </h4>
                          <p className="mt-2 text-sm text-slate-600">{question.questionText}</p>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h3m13 0a1 1 0 011 1v3m0 13a1 1 0 01-1 1h-3M4 21a1 1 0 01-1-1v-3M8 2h8m-8 20h8M2 8h20M2 16h20" />
                          </svg>
                          <span>{wordCount} words</span>
                        </span>
                      </div>

                      {question.readingPassage && (
                        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                          <span className="font-semibold">Related Reading:</span> {question.readingPassage.title}
                        </div>
                      )}

                      <div className="mt-5 rounded-2xl border border-white bg-white p-5 shadow-sm">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Student&apos;s Answer
                        </span>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                          {answer ? (
                            answer
                          ) : (
                            <span className="text-slate-400 italic">No answer provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

