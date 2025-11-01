import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { token, answers, timeSpent } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find assignment by token
    const assignment = await prisma.assignment.findUnique({
      where: { tokenHash: token },
      include: {
        mock: {
          include: {
            modules: {
              where: { type: 'READING' }
            }
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    // Check if assignment is still valid
    const now = new Date()
    if (now < assignment.validFrom || now > assignment.validUntil) {
      return NextResponse.json({ error: 'Assignment has expired' }, { status: 403 })
    }

    // Find or create submission
    const readingModule = assignment.mock.modules[0]
    if (!readingModule) {
      return NextResponse.json({ error: 'Reading module not found' }, { status: 404 })
    }

    let submission = await prisma.submission.findFirst({
      where: {
        assignmentId: assignment.id,
        moduleId: readingModule.id
      }
    })

    if (!submission) {
      // Create new submission
      submission = await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          moduleId: readingModule.id,
          startedAt: new Date(),
          answersJson: answers,
          autoScore: null
        }
      })
    } else {
      // Update existing submission
      submission = await prisma.submission.update({
        where: { id: submission.id },
        data: {
          answersJson: answers
        }
      })
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        answers: submission.answersJson
      }
    })
  } catch (error) {
    console.error('Auto-save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
