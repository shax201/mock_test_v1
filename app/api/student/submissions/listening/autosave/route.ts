import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, answers, timeSpent } = body

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
              where: { type: 'LISTENING' }
            }
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    const listeningModule = assignment.mock.modules[0]
    if (!listeningModule) {
      return NextResponse.json({ error: 'Listening module not found' }, { status: 404 })
    }

    // Check if submission already exists
    const submission = await prisma.submission.findFirst({
      where: {
        assignmentId: assignment.id,
        moduleId: listeningModule.id
      }
    })

    if (submission) {
      // Update existing submission
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          answersJson: answers
        }
      })
    } else {
      // Create new submission
      await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          moduleId: listeningModule.id,
          startedAt: new Date(),
          answersJson: answers
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Autosave error:', error)
    return NextResponse.json(
      { error: 'Failed to autosave' },
      { status: 500 }
    )
  }
}
