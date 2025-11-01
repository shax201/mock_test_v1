import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testToken = searchParams.get('token')

    if (!testToken) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Verify the test token
    const assignment = await prisma.assignment.findUnique({
      where: { tokenHash: testToken },
      include: {
        student: true,
        mock: {
          include: {
            modules: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Invalid test token' }, { status: 404 })
    }

    // Check if assignment is still valid
    const now = new Date()
    if (now < assignment.validFrom || now > assignment.validUntil) {
      return NextResponse.json({ error: 'Test token has expired' }, { status: 403 })
    }

    // Get all submissions for this assignment to check completion status
    const submissions = await prisma.submission.findMany({
      where: { assignmentId: assignment.id },
      select: {
        moduleId: true,
        submittedAt: true,
        autoScore: true
      }
    })

    // Create a map of module completion status
    const moduleCompletionMap = new Map()
    submissions.forEach(submission => {
      moduleCompletionMap.set(submission.moduleId, {
        isCompleted: !!submission.submittedAt,
        submittedAt: submission.submittedAt,
        autoScore: submission.autoScore
      })
    })

    // Transform modules for the frontend with module-specific data
    const modules = await Promise.all(assignment.mock.modules.map(async (module) => {
      let readingData = null
      let listeningData = null

      if (module.type === 'READING') {
        readingData = await prisma.readingModuleData.findUnique({
          where: { moduleId: module.id }
        })
      } else if (module.type === 'LISTENING') {
        listeningData = await prisma.listeningModuleData.findUnique({
          where: { moduleId: module.id }
        })
      }

      const completionStatus = moduleCompletionMap.get(module.id) || {
        isCompleted: false,
        submittedAt: null,
        autoScore: null
      }

      return {
        id: module.id,
        type: module.type,
        duration: module.durationMinutes,
        instructions: module.instructions,
        audioUrl: module.audioUrl,
        passageContent: module.passageContent,
        readingData: readingData,
        listeningData: listeningData,
        isCompleted: completionStatus.isCompleted,
        submittedAt: completionStatus.submittedAt,
        autoScore: completionStatus.autoScore
      }
    }))

    return NextResponse.json({
      success: true,
      modules,
      assignment: {
        id: assignment.id,
        candidateNumber: assignment.candidateNumber,
        studentName: assignment.student.name || assignment.student.email,
        mockTitle: assignment.mock.title
      }
    })
  } catch (error) {
    console.error('Error fetching test modules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test modules' },
      { status: 500 }
    )
  }
}
