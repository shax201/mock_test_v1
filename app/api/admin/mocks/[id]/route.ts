import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, hasRole } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { UserRole, ModuleType } from '@prisma/client'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || !hasRole(payload, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const id = resolvedParams.id

    const mock = await prisma.mock.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            questions: {
              include: {
                questionBank: true
              }
            }
          }
        },
        creator: {
          select: { email: true }
        },
        _count: {
          select: { assignments: true }
        }
      }
    })

    if (!mock) {
      return NextResponse.json({ error: 'Mock test not found' }, { status: 404 })
    }

    // Transform the data for the frontend
    const transformedMock = {
      id: mock.id,
      title: mock.title,
      description: mock.description,
      hasAssignments: mock._count.assignments > 0,
      modules: mock.modules.map(module => ({
        id: module.id,
        type: module.type,
        duration: module.durationMinutes,
        audioUrl: module.audioUrl,
        instructions: module.instructions,
        questions: module.questions.map(q => {
          const content = q.questionBank.contentJson as any
          return {
            id: q.id,
            type: q.questionBank.type,
            content: content.content || '',
            options: content.options || [],
            fibData: content.fibData || null,
            instructions: content.instructions || '',
            points: q.points,
            correctAnswer: q.correctAnswerJson,
            part: content.part || 1
          }
        }),
        passageContent: module.passageContent
      }))
    }

    return NextResponse.json({ mock: transformedMock })
  } catch (error) {
    console.error('Error fetching mock:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || !hasRole(payload, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const id = resolvedParams.id
    const { title, description, modules, isDraft } = await request.json()

    if (!title || !modules || !Array.isArray(modules)) {
      return NextResponse.json(
        { error: 'Title and modules are required' },
        { status: 400 }
      )
    }

    // Check if mock exists
    const existingMock = await prisma.mock.findUnique({
      where: { id },
      include: { assignments: true }
    })

    if (!existingMock) {
      return NextResponse.json({ error: 'Mock test not found' }, { status: 404 })
    }

    // If there are assignments, warn about updating
    if (existingMock.assignments.length > 0 && !isDraft) {
      return NextResponse.json(
        { error: 'Cannot update published mock test with existing assignments. Save as draft first.' },
        { status: 400 }
      )
    }

    // Update mock test with modules and questions
    const updatedMock = await prisma.$transaction(async (tx) => {
      // Update the mock
      const updatedMock = await tx.mock.update({
        where: { id },
        data: {
          title,
          description: description || '',
        }
      })

      // Delete existing modules and their questions
      await tx.mockQuestion.deleteMany({
        where: {
          module: {
            mockId: id
          }
        }
      })
      await tx.mockModule.deleteMany({
        where: { mockId: id }
      })

      // Create new modules and questions
      for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
        const module = modules[moduleIndex]
        const createdModule = await tx.mockModule.create({
          data: {
            mockId: id,
            type: module.type as ModuleType,
            durationMinutes: module.duration || 60,
            audioUrl: module.audioUrl || null,
            instructions: module.instructions || '',
            order: moduleIndex + 1,
            passageContent: module.passageContent || null,
          }
        })

        if (module.questions && module.questions.length > 0) {
          for (let questionIndex = 0; questionIndex < module.questions.length; questionIndex++) {
            const question = module.questions[questionIndex]
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
      }

      return await tx.mock.findUnique({
        where: { id },
        include: {
          modules: {
            include: {
              questions: {
                include: {
                  questionBank: true
                }
              }
            }
          },
          creator: {
            select: { email: true }
          },
          _count: {
            select: { assignments: true }
          }
        }
      })
    })

    return NextResponse.json({ mock: updatedMock })
  } catch (error) {
    console.error('Error updating mock:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || !hasRole(payload, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const id = resolvedParams.id
    const body = await request.json()
    const { title, description } = body || {}

    if (!title && typeof description === 'undefined') {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updated = await prisma.mock.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(typeof description !== 'undefined' ? { description } : {}),
      },
      include: {
        modules: { include: { questions: true } },
        _count: { select: { assignments: true } },
      },
    })

    return NextResponse.json({ mock: updated })
  } catch (error) {
    console.error('Error updating mock:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || !hasRole(payload, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const id = resolvedParams.id

    await prisma.mock.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting mock:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


