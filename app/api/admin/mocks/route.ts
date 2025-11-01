import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, hasRole } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { UserRole, ModuleType } from '@prisma/client'
import { ModuleDataService } from '@/lib/services/module-data-service'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    
    if (!payload || !hasRole(payload, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const mocks = await prisma.mock.findMany({
      include: {
        creator: {
          select: { email: true }
        },
        modules: {
          include: {
            questions: true
          }
        },
        _count: {
          select: {
            assignments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ mocks })
  } catch (error) {
    console.error('Error fetching mocks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    
    if (!payload || !hasRole(payload, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, description, modules, isDraft, moduleData } = await request.json()

    if (!title || !modules || !Array.isArray(modules)) {
      return NextResponse.json(
        { error: 'Title and modules are required' },
        { status: 400 }
      )
    }

    // Create mock test with modules and questions
    const mock = await prisma.$transaction(async (tx) => {
      // First create the mock
      const createdMock = await tx.mock.create({
        data: {
          title,
          description: description || '',
          createdBy: payload.userId,
        }
      })

      // Then create modules and their questions
      for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
        const module = modules[moduleIndex]
        
        // Create the module
        console.log(`Creating module ${moduleIndex + 1}:`, {
          type: module.type,
          audioUrl: module.audioUrl,
          hasAudioUrl: !!module.audioUrl,
          audioUrlLength: module.audioUrl?.length || 0
        })
        
        const createdModule = await tx.mockModule.create({
          data: {
            mockId: createdMock.id,
            type: module.type as ModuleType,
            durationMinutes: module.duration || 60,
            audioUrl: module.audioUrl || null,
            instructions: module.instructions || '',
            order: moduleIndex + 1,
            passageContent: module.passageContent || null,
          }
        })
        
        console.log(`Module ${moduleIndex + 1} created with audioUrl:`, createdModule.audioUrl)

        // Create questions for this module
        if (module.questions && module.questions.length > 0) {
          for (let questionIndex = 0; questionIndex < module.questions.length; questionIndex++) {
            const question = module.questions[questionIndex]
            
            // First create the question in the question bank
            const questionBank = await tx.questionBank.create({
              data: {
                type: question.type || 'MCQ',
                contentJson: {
                  content: question.content || '',
                  options: question.options || [],
                  fibData: question.fibData || null,
                  instructions: question.instructions || '',
                  type: question.type || 'MCQ',
                  part: question.part || 1
                },
                reusable: false
              }
            })

            // Then create the mock question linking to the question bank
            await tx.mockQuestion.create({
              data: {
                moduleId: createdModule.id,
                questionBankId: questionBank.id,
                order: questionIndex + 1,
                points: question.points || 1,
                correctAnswerJson: question.correctAnswer || ''
              }
            })
          }
        }

        // Create module-specific data if provided
        if (moduleData && moduleData[moduleIndex]) {
          const data = moduleData[moduleIndex]
          if (module.type === ModuleType.READING && data.readingData) {
            await tx.readingModuleData.create({
              data: {
                moduleId: createdModule.id,
                part1Content: data.readingData.part1Content || null,
                part2Content: data.readingData.part2Content || null,
                part3Content: data.readingData.part3Content || null,
                part1Passage: data.readingData.part1Passage || null,
                part2Passage: data.readingData.part2Passage || null,
                part3Passage: data.readingData.part3Passage || null,
                part1Instructions: data.readingData.part1Instructions || null,
                part2Instructions: data.readingData.part2Instructions || null,
                part3Instructions: data.readingData.part3Instructions || null
              }
            })
          } else if (module.type === ModuleType.LISTENING && data.listeningData) {
            await tx.listeningModuleData.create({
              data: {
                moduleId: createdModule.id,
                audioUrl: data.listeningData.audioUrl || null,
                audioPublicId: data.listeningData.audioPublicId || null,
                audioDuration: data.listeningData.audioDuration || null,
                part1Content: data.listeningData.part1Content || null,
                part2Content: data.listeningData.part2Content || null,
                part3Content: data.listeningData.part3Content || null,
                part1Instructions: data.listeningData.part1Instructions || null,
                part2Instructions: data.listeningData.part2Instructions || null,
                part3Instructions: data.listeningData.part3Instructions || null,
                part1AudioStart: data.listeningData.part1AudioStart || null,
                part1AudioEnd: data.listeningData.part1AudioEnd || null,
                part2AudioStart: data.listeningData.part2AudioStart || null,
                part2AudioEnd: data.listeningData.part2AudioEnd || null,
                part3AudioStart: data.listeningData.part3AudioStart || null,
                part3AudioEnd: data.listeningData.part3AudioEnd || null
              }
            })
          }
        }
      }

      // Return the created mock with all relations
      return await tx.mock.findUnique({
        where: { id: createdMock.id },
        include: {
          modules: {
            include: {
              questions: {
                include: {
                  questionBank: true
                }
              },
              readingData: true,
              listeningData: true
            }
          }
        }
      })
    })

    return NextResponse.json({ mock }, { status: 201 })
  } catch (error) {
    console.error('Error creating mock:', error)
    
    // Provide more specific error information
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
