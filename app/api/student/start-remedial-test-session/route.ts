import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { generateStudentToken } from '@/lib/auth/token-generator'

function mapQuestionType(remedialType: string): string {
  const typeMap: Record<string, string> = {
    'MATCHING_HEADINGS': 'MATCHING',
    'INFORMATION_MATCHING': 'MATCHING',
    'MULTIPLE_CHOICE': 'MULTIPLE_CHOICE',
    'TRUE_FALSE_NOT_GIVEN': 'TRUE_FALSE_NOT_GIVEN',
    'TRUE_FALSE': 'TRUE_FALSE',
    'FIB': 'FIB',
    'NOTES_COMPLETION': 'NOTES_COMPLETION',
    'SUMMARY_COMPLETION': 'SUMMARY_COMPLETION'
  }
  
  return typeMap[remedialType] || 'MULTIPLE_CHOICE'
}

export async function POST(request: NextRequest) {
  try {
    // Verify student authentication
    const token = request.cookies.get('student-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { remedialTestId } = await request.json()

    if (!remedialTestId) {
      return NextResponse.json({ error: 'Remedial test ID is required' }, { status: 400 })
    }

    // Get the remedial test template
    const remedialTest = await prisma.remedialTestTemplate.findUnique({
      where: { id: remedialTestId },
      include: {
        mockTest: true
      }
    }) as any

    if (!remedialTest) {
      return NextResponse.json({ error: 'Remedial test not found' }, { status: 404 })
    }

    if (!remedialTest.isActive) {
      return NextResponse.json({ error: 'Remedial test is not active' }, { status: 400 })
    }

    // Generate a unique token for this remedial test session
    const candidateNumber = `R${Date.now()}`
    const now = new Date()
    const validUntil = new Date(now.getTime() + remedialTest.duration * 60 * 1000)
    const sessionToken = generateStudentToken(candidateNumber, now, validUntil)

    // Create a remedial test session
    const session = await prisma.remedialTestSession.create({
      data: {
        studentId: decoded.userId,
        templateId: remedialTestId,
        testType: 'REMEDIAL',
        status: 'ACTIVE',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + remedialTest.duration * 60 * 1000), // Convert minutes to milliseconds
        answers: {}
      }
    })

    // Transform remedial test questions to the format expected by the frontend
    type TransformedQuestion = {
      id: string
      type: 'MATCHING' | string
      // Matching-specific fields
      passage?: string
      headings?: string[]
      correctAnswers?: Record<string, string>
      // Non-matching fields
      content?: string
      options?: string[]
      correctAnswer?: string
      questionAudios?: string[]
      // Common fields
      instructions: string
      points: number
      part: number
    }

    type SourceQuestion = {
      id?: string
      passage?: string
      headings?: string[]
      correctAnswers?: Record<string, string>
      instructions?: string
      questions?: unknown[]
      content?: string
      options?: string[]
      correctAnswer?: string
      questionAudios?: string[]
    }

    // Prepare passageContent for READING module (HTML string per part)
    let passageContent: any = undefined
    let part1PassageHtml: string | undefined = undefined
    if (remedialTest.module === 'READING') {
      const firstMatching = Array.isArray(remedialTest.questions)
        ? (remedialTest.questions as any[]).find((q) => q.id === '__passage__' && typeof q.passage === 'string') ||
          (remedialTest.questions as any[]).find((q) => typeof q.passage === 'string')
        : undefined
      const part1Passage = typeof firstMatching?.passage === 'string' ? firstMatching.passage : undefined
      part1PassageHtml = part1Passage
      passageContent = remedialTest.passageContent || (part1Passage ? { part1: part1Passage, part2: '', part3: '' } : undefined)
    }

    // Extract helper passage question if present and exclude it from real questions
    const sourceQuestions: SourceQuestion[] = Array.isArray(remedialTest.questions)
      ? (remedialTest.questions as SourceQuestion[]).filter((q: any) => q?.id !== '__passage__')
      : []

    const transformedQuestions: TransformedQuestion[] = sourceQuestions.length > 0
      ? sourceQuestions.map((q: SourceQuestion, index: number): TransformedQuestion => {
          // Special handling for matching headings questions
          if (remedialTest.type === 'MATCHING_HEADINGS' && q.passage && q.headings) {
            return {
              id: q.id || `q${index + 1}`,
              type: 'MATCHING',
              passage: q.passage,
              headings: q.headings,
              correctAnswers: q.correctAnswers || {},
              instructions: q.instructions || '',
              points: 1,
              part: 1
            }
          } else {
            return {
              id: q.id || `q${index + 1}`,
              type: mapQuestionType(remedialTest.type),
              content: (q.questions && typeof q.questions[0] === 'string' ? q.questions[0] : q.content) || 'Question',
              options: q.options || [],
              correctAnswer: q.correctAnswer || q.correctAnswers?.["0"] || '',
              points: 1,
              part: 1,
              instructions: q.instructions || '',
              questionAudios: q.questionAudios || [],
              passage: part1PassageHtml
            }
          }
        })
      : []

    // passageContent already computed above

    // Create a mock test structure for the remedial test
    // This allows us to reuse the existing test infrastructure
    const mockTest = await prisma.mock.create({
      data: {
        title: `Remedial Test: ${remedialTest.title}`,
        description: remedialTest.description || '',
        createdBy: decoded.userId, // Use student's ID for remedial tests
        modules: {
          create: [
            {
              type: remedialTest.module as any,
              durationMinutes: remedialTest.duration,
              instructions: `Complete this ${remedialTest.type.replace(/_/g, ' ').toLowerCase()} practice test.`,
              audioUrl: remedialTest.audioUrl,
              order: 1,
              passageContent: passageContent,
              questions: {
                create: transformedQuestions.map((q: TransformedQuestion, index: number) => ({
                  order: index + 1,
                  correctAnswerJson: q.type === 'MATCHING' ? JSON.stringify(q.correctAnswers ?? {}) : (q.correctAnswer ?? ''),
                  questionBank: {
                    create: {
                      type: q.type as any,
                      contentJson: q.type === 'MATCHING' ? {
                        passage: q.passage,
                        headings: q.headings,
                        instructions: q.instructions,
                        correctAnswers: q.correctAnswers,
                        content: 'Match the headings to the appropriate sections'
                      } : {
                        content: q.content,
                        options: q.options,
                        instructions: q.instructions,
                        questionAudios: q.questionAudios,
                        passage: part1PassageHtml,
                        correctAnswers: { "0": q.correctAnswer }
                      }
                    }
                  }
                }))
              }
            }
          ]
        }
      }
    })

    // Create listening module data if this is a listening test
    if (remedialTest.module === 'LISTENING' && remedialTest.audioUrl) {
      // Fetch the created mock test with modules to get the module ID
      const mockTestWithModules = await prisma.mock.findUnique({
        where: { id: mockTest.id },
        include: { modules: true }
      })
      
      if (mockTestWithModules) {
        const listeningModule = mockTestWithModules.modules.find(m => m.type === 'LISTENING')
        if (listeningModule) {
          await prisma.listeningModuleData.create({
            data: {
              moduleId: listeningModule.id,
              audioUrl: remedialTest.audioUrl,
              audioPublicId: remedialTest.audioPublicId,
              audioDuration: 300, // Default 5 minutes, can be updated later
              part1Content: 'Listen to the audio and answer the questions.',
              part2Content: 'Continue listening to the audio.',
              part3Content: 'Complete the listening test.',
              part1Instructions: 'Listen carefully and choose the best answer.',
              part2Instructions: 'Pay attention to details in the audio.',
              part3Instructions: 'Focus on the main ideas and supporting details.'
            }
          })
        }
      }
    }

    // Create an assignment for the student
    const assignment = await prisma.assignment.create({
      data: {
        studentId: decoded.userId,
        mockId: mockTest.id,
        candidateNumber: candidateNumber, // Use the same candidate number
        tokenHash: sessionToken, // Store the token as tokenHash
        validFrom: now,
        validUntil: validUntil,
        status: 'ACTIVE'
      }
    })

    return NextResponse.json({
      success: true,
      token: sessionToken,
      assignmentId: assignment.id,
      sessionId: session.id,
      testTitle: remedialTest.title,
      duration: remedialTest.duration,
      module: remedialTest.module
    })

  } catch (error: unknown) {
    console.error('Error starting remedial test session:', error)
    return NextResponse.json(
      { error: 'Failed to start remedial test session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
