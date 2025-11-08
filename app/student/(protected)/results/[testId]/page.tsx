import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import TestResultsDetailClient from './TestResultsDetailClient'

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
      correctAnswer: string
      isCorrect: boolean | null
      explanation?: string
      wordCount?: number
    }>
  }
  feedback?: {
    writing: Array<{
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
      }
    } else if (session.testType === 'WRITING') {
      if (testDetails && testDetails.passages) {
        const writingQuestions: any[] = []
        testDetails.passages.forEach((passage: any) => {
          passage.questions.forEach((question: any) => {
            const studentAnswer = (session.answers as any)?.[question.id] || ''
            
            writingQuestions.push({
              id: question.id,
              question: question.questionText,
              type: question.type,
              part: passage.order,
              studentAnswer: studentAnswer,
              correctAnswer: 'Evaluation pending',
              isCorrect: null,
              explanation: '',
              wordCount: studentAnswer ? studentAnswer.split(/\s+/).filter(Boolean).length : 0
            })
          })
        })
        results.questionDetails = results.questionDetails || {}
        results.questionDetails.writing = writingQuestions
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
            
            if (session.band && readingSession.band) {
              results.overallBand = (session.band + readingSession.band) / 2
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
