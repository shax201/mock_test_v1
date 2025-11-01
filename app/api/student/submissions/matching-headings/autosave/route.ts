import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { token, answers, timeSpent } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find the assignment by token
    const assignment = await prisma.assignment.findUnique({
      where: { tokenHash: token },
      include: { 
        mock: {
          include: {
            modules: true
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
      return NextResponse.json({ error: 'Test token has expired' }, { status: 400 })
    }

    // Find the matching headings module
    const module = assignment.mock.modules.find(m => m.type === 'READING')
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Check if submission already exists
    let submission = await prisma.submission.findFirst({
      where: {
        assignmentId: assignment.id,
        moduleId: module.id
      }
    })

    if (submission) {
      // Update existing submission
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          answersJson: answers,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new submission
      await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          moduleId: module.id,
          startedAt: new Date(),
          answersJson: answers
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error auto-saving matching headings submission:', error)
    return NextResponse.json({ error: 'Failed to auto-save submission' }, { status: 500 })
  }
}
