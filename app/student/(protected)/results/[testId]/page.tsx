import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import TestResultsDetailClient from './TestResultsDetailClient'

interface WritingNote {
  id: string
  start: number
  end: number
  text: string
  category: string
  comment: string
}

interface NormalizedWritingAnswer {
  text: string
  notes: WritingNote[]
}

const normalizeWritingAnswer = (raw: unknown): NormalizedWritingAnswer => {
  if (!raw) {
    return { text: '', notes: [] }
  }

  if (typeof raw === 'string') {
    return { text: raw, notes: [] }
  }

  if (typeof raw === 'object') {
    const record = raw as Record<string, unknown>
    const text = typeof record.text === 'string' ? record.text : ''
    const rawNotes = Array.isArray(record.notes) ? record.notes : []
    const notes: WritingNote[] = rawNotes
      .map((note) => {
        if (typeof note !== 'object' || note === null) return null
        const ref = note as Record<string, unknown>
        const id = typeof ref.id === 'string' ? ref.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`
        const start = typeof ref.start === 'number' ? ref.start : 0
        const end = typeof ref.end === 'number' ? ref.end : start
        const snippet = typeof ref.text === 'string' ? ref.text : ''
        const category = typeof ref.category === 'string' ? ref.category : 'Other'
        const comment = typeof ref.comment === 'string' ? ref.comment : ''

        return {
          id,
          start,
          end: Math.max(end, start),
          text: snippet,
          category,
          comment
        } as WritingNote
      })
      .filter(Boolean) as WritingNote[]

    return { text, notes }
  }

  return { text: '', notes: [] }
}

// Enable ISR with time-based revalidation (revalidate every 60 seconds)
export const revalidate = 60

interface TestResultsData {
  testTitle: string
  testDate: string
  candidateNumber: string
  studentName: string
  mockTestId: string
  bandScores: {
    listening: number
    reading: number
    writing: number
    speaking?: number
  }
  overallBand?: number
  detailedScores?: any
  questionDetails?: {
    reading?: Array<{
      id: string
      question: string
      type: string
      part: number
      options?: string[]
      studentAnswer: string
      correctAnswer: string
      isCorrect: boolean
      explanation?: string
    }>
    listening?: Array<{
      id: string
      question: string
      type: string
      part: number
      options?: string[]
      studentAnswer: string
      correctAnswer: string
      isCorrect: boolean
      explanation?: string
    }>
    writing?: Array<{
      id: string
      question: string
      type: string
      part: number
      studentAnswer: string
      notes?: WritingNote[]
      correctAnswer: string
      isCorrect: boolean | null
      explanation?: string
      wordCount?: number
    }>
  }
  feedback?: {
    writing: Array<{
      questionId: string
      category: string
      text: string
      comment: string
      range: [number, number]
    }>
  }
  generatedAt: string
  status: string
}

// Cache the result detail query
const getCachedResultDetail = unstable_cache(
  async (testId: string, studentId: string): Promise<TestResultsData | null> => {
    // Step 1: Try to find session by ID first (if testId is a session ID)
    let session = await prisma.testSession.findUnique({
      where: {
        id: testId,
        studentId: studentId,
        isCompleted: true
      }
    })

    // Step 2: If not found by session ID, try to find by test ID
    if (!session) {
      // Try READING test first
      session = await prisma.testSession.findFirst({
        where: {
          testId: testId,
          studentId: studentId,
          testType: 'READING',
          isCompleted: true
        },
        orderBy: { completedAt: 'desc' }
      })

      // If not READING, try WRITING
      if (!session) {
        session = await prisma.testSession.findFirst({
          where: {
            testId: testId,
            studentId: studentId,
            testType: 'WRITING',
            isCompleted: true
          },
          orderBy: { updatedAt: 'desc' }
        })
      }
    }

    if (!session) {
      return null
    }

    // Step 3: Fetch test details based on test type
    let testDetails: any = null
    let testTitle = 'Test'
    let testDate = session.completedAt?.toISOString() || new Date().toISOString()

    if (session.testType === 'READING') {
      const readingTest = await prisma.readingTest.findUnique({
        where: { id: session.testId },
        select: {
          id: true,
          title: true,
          totalQuestions: true,
          totalTimeMinutes: true
        }
      })
      if (readingTest) {
        testDetails = readingTest
        testTitle = readingTest.title
      }
    } else if (session.testType === 'WRITING') {
      const writingTest = await prisma.writingTest.findUnique({
        where: { id: session.testId },
        include: {
          readingTest: {
            select: {
              id: true,
              title: true
            }
          },
          passages: {
            include: {
              questions: {
                orderBy: { questionNumber: 'asc' }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      })
      if (writingTest) {
        testDetails = writingTest
        testTitle = writingTest.title
      }
    }

    // Step 4: Format results for TestResultsAnalysis component
    const results: TestResultsData = {
      testTitle: testTitle,
      testDate: testDate,
      candidateNumber: '',
      studentName: 'Student',
      mockTestId: session.testId,
      bandScores: {
        listening: 0,
        reading: session.testType === 'READING' ? (session.band ?? 0) : 0,
        writing: session.testType === 'WRITING' ? (session.band ?? 0) : 0
      },
      overallBand: session.band ?? 0,
      detailedScores: {
        score: session.score ?? 0,
        band: session.band ?? 0
      },
      questionDetails: {} as any,
      feedback: {
        writing: []
      },
      generatedAt: session.completedAt?.toISOString() || new Date().toISOString(),
      status: 'completed'
    }

    // Step 5: Format question details based on test type
    if (session.testType === 'READING') {
      const readingTest = await prisma.readingTest.findUnique({
        where: { id: session.testId },
        include: {
          passages: {
            include: {
              questions: {
                include: {
                  correctAnswer: true
                },
                orderBy: { questionNumber: 'asc' }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      })

      if (readingTest) {
        const readingQuestions: any[] = []
        readingTest.passages.forEach((passage, passageIndex) => {
          passage.questions.forEach((question) => {
            const studentAnswer = (session.answers as any)?.[question.questionNumber.toString()] || 'Unattempted'
            const correctAnswer = question.correctAnswer?.answer || ''
            
            readingQuestions.push({
              id: question.id,
              question: question.questionText,
              type: question.type,
              part: passageIndex + 1,
              options: question.options || [],
              studentAnswer: studentAnswer,
              correctAnswer: correctAnswer,
              isCorrect: studentAnswer === correctAnswer,
              explanation: ''
            })
          })
        })
        results.questionDetails = results.questionDetails || {}
        results.questionDetails.reading = readingQuestions

        // Check for speaking session for reading tests
        const speakingSession = await prisma.testSession.findFirst({
          where: {
            testId: session.testId,
            studentId: studentId,
            testType: 'SPEAKING',
            isCompleted: true
          },
          orderBy: { completedAt: 'desc' }
        })

        if (speakingSession && speakingSession.band) {
          results.bandScores.speaking = speakingSession.band
          
          // Recalculate overall band if speaking is available
          const bands: number[] = []
          if (session.band) bands.push(session.band)
          if (speakingSession.band) bands.push(speakingSession.band)
          
          if (bands.length > 0) {
            results.overallBand = bands.reduce((sum, band) => sum + band, 0) / bands.length
            results.overallBand = Math.round(results.overallBand * 2) / 2
          }
        }
      }
    } else if (session.testType === 'WRITING') {
      const writingFeedback = results.feedback?.writing || []
      if (testDetails && testDetails.passages) {
        const writingQuestions: any[] = []
        testDetails.passages.forEach((passage: any) => {
          passage.questions.forEach((question: any) => {
            const normalized = normalizeWritingAnswer((session.answers as any)?.[question.id])

            writingQuestions.push({
              id: question.id,
              question: question.questionText,
              type: question.type,
              part: passage.order,
              studentAnswer: normalized.text,
              notes: normalized.notes,
              correctAnswer: 'Evaluation pending',
              isCorrect: null,
              explanation: '',
              wordCount: normalized.text ? normalized.text.split(/\s+/).filter(Boolean).length : 0
            })

            if (normalized.notes.length) {
              normalized.notes.forEach((note) => {
                writingFeedback.push({
                  questionId: question.id,
                  category: note.category,
                  text: note.text,
                  comment: note.comment,
                  range: [note.start, note.end] as [number, number]
                })
              })
            }
          })
        })
        results.questionDetails = results.questionDetails || {}
        results.questionDetails.writing = writingQuestions
        results.feedback = results.feedback || { writing: [] }
        results.feedback.writing = writingFeedback
      }

      // Step 6: Also fetch reading test results if writing test is based on a reading test
      if (testDetails && testDetails.readingTestId) {
        const readingSession = await prisma.testSession.findFirst({
          where: {
            testId: testDetails.readingTestId,
            studentId: studentId,
            testType: 'READING',
            isCompleted: true
          },
          orderBy: { updatedAt: 'desc' }
        })

        if (readingSession) {
          const readingTest = await prisma.readingTest.findUnique({
            where: { id: testDetails.readingTestId },
            include: {
              passages: {
                include: {
                  questions: {
                    include: {
                      correctAnswer: true
                    },
                    orderBy: { questionNumber: 'asc' }
                  }
                },
                orderBy: { order: 'asc' }
              }
            }
          })

          if (readingTest) {
            const readingQuestions: any[] = []
            readingTest.passages.forEach((passage, passageIndex) => {
              passage.questions.forEach((question) => {
                const studentAnswer = (readingSession.answers as any)?.[question.questionNumber.toString()] || 'Unattempted'
                const correctAnswer = question.correctAnswer?.answer || ''
                
                readingQuestions.push({
                  id: question.id,
                  question: question.questionText,
                  type: question.type,
                  part: passageIndex + 1,
                  options: question.options || [],
                  studentAnswer: studentAnswer,
                  correctAnswer: correctAnswer,
                  isCorrect: studentAnswer === correctAnswer,
                  explanation: ''
                })
              })
            })
        results.questionDetails = results.questionDetails || {}
        results.questionDetails.reading = readingQuestions

            results.bandScores.reading = readingSession.band || 0
            
            // Fetch speaking session for this reading test
            const speakingSession = await prisma.testSession.findFirst({
              where: {
                testId: testDetails.readingTestId,
                studentId: studentId,
                testType: 'SPEAKING',
                isCompleted: true
              },
              orderBy: { completedAt: 'desc' }
            })

            if (speakingSession && speakingSession.band) {
              results.bandScores.speaking = speakingSession.band
            }

            // Calculate overall band including speaking if available
            const bands: number[] = []
            if (session.band) bands.push(session.band)
            if (readingSession.band) bands.push(readingSession.band)
            if (speakingSession?.band) bands.push(speakingSession.band)

            if (bands.length > 0) {
              results.overallBand = bands.reduce((sum, band) => sum + band, 0) / bands.length
              results.overallBand = Math.round(results.overallBand * 2) / 2 // Round to nearest 0.5
            } else if (readingSession.band) {
              results.overallBand = readingSession.band
            }

            if (testDetails.readingTest) {
              results.testTitle = `${testDetails.readingTest.title} + ${testTitle}`
            }
          }
        }
      }
    }

    // Get student email for candidate number
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { email: true }
    })
    
    if (student?.email) {
      results.candidateNumber = student.email.split('@')[0]
      results.studentName = student.email.split('@')[0]
    }

    return results
  },
  ['student-result-detail'],
  {
    revalidate: 60,
    tags: ['student-results', 'student-result-detail']
  }
)

export default async function TestResultsDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ testId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  // Auth is handled by middleware, get userId from token
  const cookieStore = await cookies()
  const token = cookieStore.get('student-token')?.value
  const payload = token ? await verifyJWT(token) : null
  const studentId = payload?.userId || ''

  if (!studentId) {
    // This shouldn't happen if middleware is working, but handle gracefully
    const resolvedParams = await params
    return <TestResultsDetailClient testId={resolvedParams.testId} initialResults={null} initialError="Authentication error" initialTab={undefined} />
  }
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const testId = resolvedParams.testId
  const initialTab = resolvedSearchParams.tab as 'brief' | 'writing' | 'question-wise' | undefined

  // Fetch result detail with caching
  let results: TestResultsData | null = null
  let error: string | null = null

  try {
    results = await getCachedResultDetail(testId, studentId)
    if (!results) {
      error = 'Test results not found'
    }
  } catch (err) {
    console.error('Error fetching test result detail:', err)
    error = 'Failed to fetch results'
  }

  return <TestResultsDetailClient testId={testId} initialResults={results} initialError={error} initialTab={initialTab} />
}
