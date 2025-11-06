import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

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
        writing: session.testType === 'WRITING' ? (session.band ?? null) : 0
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
      // For writing tests, format the writing questions
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
              isCorrect: null, // Writing is evaluated by instructor
              explanation: '',
              wordCount: studentAnswer ? studentAnswer.split(/\s+/).filter(Boolean).length : 0
            })
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
            
            // Update overall band (average of reading and writing if both exist)
            if (session.band && readingSession.band) {
              results.overallBand = (session.band + readingSession.band) / 2
            } else if (readingSession.band) {
              results.overallBand = readingSession.band
            }

            // Update test title to include both tests
            if (testDetails.readingTest) {
              results.testTitle = `${testDetails.readingTest.title} + ${testTitle}`
            }
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

