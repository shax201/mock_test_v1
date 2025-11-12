import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

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

/**
 * GET /api/student/results/[testId]
 * Fetches test results for a student
 * Supports both test ID and session ID
 * Handles READING and WRITING test types
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    // Authenticate student
    const token = request.cookies.get('student-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const testId = resolvedParams.testId

    // Step 1: Try to find session by ID first (if testId is a session ID)
    // This will always fetch the latest data from the database, including updated band scores
    let session = await prisma.testSession.findUnique({
      where: {
        id: testId,
        studentId: payload.userId,
        isCompleted: true
      }
    })
    
    // Log for debugging
    if (session && session.testType === 'WRITING') {
      console.log('Writing session found:', {
        id: session.id,
        band: session.band,
        score: session.score,
        updatedAt: session.updatedAt
      })
    }

    // Step 2: If not found by session ID, try to find by test ID
    if (!session) {
      // Try READING test first
      session = await prisma.testSession.findFirst({
        where: {
          testId: testId,
          studentId: payload.userId,
          testType: 'READING',
          isCompleted: true
        },
        orderBy: { completedAt: 'desc' }
      })

      // If not READING, try WRITING
      // Order by updatedAt to get the most recently evaluated session
      if (!session) {
        session = await prisma.testSession.findFirst({
          where: {
            testId: testId,
            studentId: payload.userId,
            testType: 'WRITING',
            isCompleted: true
          },
          orderBy: { updatedAt: 'desc' }
        })
      }
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Test results not found' },
        { status: 404 }
      )
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
    const results = {
      testTitle: testTitle,
      testDate: testDate,
      candidateNumber: '',
      studentName: payload.email || 'Student',
      mockTestId: session.testId,
      bandScores: {
        listening: 0,
        reading: session.testType === 'READING' ? (session.band ?? 0) : 0,
        writing: session.testType === 'WRITING' ? (session.band ?? null) : 0,
        speaking: undefined as number | undefined
      },
      overallBand: session.band ?? 0,
      detailedScores: {
        score: session.score ?? 0,
        band: session.band ?? 0
      },
      questionDetails: {} as any,
    feedback: {
      writing: [] as Array<{
        questionId: string
        category: string
        text: string
        comment: string
        range: [number, number]
      }>
    },
    generatedAt: session.completedAt?.toISOString() || new Date().toISOString(),
    status: 'completed'
    }

    // Step 5: Format question details based on test type
    if (session.testType === 'READING') {
      // For reading tests, we need to fetch questions and format them
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
        results.questionDetails.reading = readingQuestions
      }
    } else if (session.testType === 'WRITING') {
      const writingFeedback = results.feedback.writing
      // For writing tests, format the writing questions
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
              isCorrect: null, // Writing is evaluated by instructor
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
                  range: [note.start, note.end]
                })
              })
            }
          })
        })
        results.questionDetails.writing = writingQuestions
      }

      // Step 6: Also fetch reading test results if writing test is based on a reading test
      if (testDetails && testDetails.readingTestId) {
        // Find the reading test session for the same student
        // Order by updatedAt to get the most recently evaluated session
        const readingSession = await prisma.testSession.findFirst({
          where: {
            testId: testDetails.readingTestId,
            studentId: payload.userId,
            testType: 'READING',
            isCompleted: true
          },
          orderBy: { updatedAt: 'desc' }
        })

        if (readingSession) {
          // Fetch reading test details
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
            // Format reading questions
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
            results.questionDetails.reading = readingQuestions

            // Update band scores to include reading
            results.bandScores.reading = readingSession.band || 0
            
            // Fetch speaking session for this reading test
            const speakingSession = await prisma.testSession.findFirst({
              where: {
                testId: testDetails.readingTestId,
                studentId: payload.userId,
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

            // Update test title to include both tests
            if (testDetails.readingTest) {
              results.testTitle = `${testDetails.readingTest.title} + ${testTitle}`
            }
          }
        }
      } else if (session.testType === 'READING') {
        // For reading tests, also check for speaking session
        const speakingSession = await prisma.testSession.findFirst({
          where: {
            testId: session.testId,
            studentId: payload.userId,
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
    }

    return NextResponse.json({
      results
    })

  } catch (error) {
    console.error('Error fetching test results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

