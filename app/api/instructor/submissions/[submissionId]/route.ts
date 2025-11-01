import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, hasRole } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    
    if (!payload || !hasRole(payload, UserRole.INSTRUCTOR)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const submissionId = resolvedParams.submissionId

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            mock: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        module: {
          select: {
            id: true,
            type: true
          }
        },
        instructorMarks: {
          select: {
            id: true,
            taskAchievement: true,
            coherenceCohesion: true,
            lexicalResource: true,
            grammarAccuracy: true,
            overallBand: true,
            markedAt: true
          },
          orderBy: {
            markedAt: 'desc'
          },
          take: 1
        },
        writingFeedback: {
          select: {
            id: true,
            textRangeStart: true,
            textRangeEnd: true,
            comment: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Only allow access to WRITING and SPEAKING modules
    if (submission.module.type !== 'WRITING' && submission.module.type !== 'SPEAKING') {
      return NextResponse.json(
        { error: 'This module does not require instructor grading' },
        { status: 400 }
      )
    }

    // Extract writing tasks from answersJson if it's a writing submission
    let tasks: Array<{ id: string; title: string; content: string; wordCount: number }> = []
    
    if (submission.module.type === 'WRITING') {
      const answers = submission.answersJson as any
      if (answers.tasks && Array.isArray(answers.tasks)) {
        tasks = answers.tasks.map((task: any, index: number) => ({
          id: `task${index + 1}`,
          title: `Task ${index + 1}`,
          content: task.content || task.answer || '',
          wordCount: (task.content || task.answer || '').split(/\s+/).filter((w: string) => w.length > 0).length
        }))
      } else if (answers.task1 || answers.task2) {
        // Handle different answer formats
        if (answers.task1) {
          const content = answers.task1.content || answers.task1.answer || ''
          tasks.push({
            id: 'task1',
            title: 'Task 1',
            content,
            wordCount: content.split(/\s+/).filter((w: string) => w.length > 0).length
          })
        }
        if (answers.task2) {
          const content = answers.task2.content || answers.task2.answer || ''
          tasks.push({
            id: 'task2',
            title: 'Task 2',
            content,
            wordCount: content.split(/\s+/).filter((w: string) => w.length > 0).length
          })
        }
      }
    }

    const formattedSubmission = {
      id: submission.id,
      candidateNumber: submission.assignment.candidateNumber,
      studentName: submission.assignment.student.name || submission.assignment.student.email,
      studentEmail: submission.assignment.student.email,
      testTitle: submission.assignment.mock.title,
      moduleType: submission.module.type,
      submittedAt: submission.submittedAt,
      startedAt: submission.startedAt,
      answersJson: submission.answersJson,
      tasks,
      marks: submission.instructorMarks[0] || null,
      feedback: submission.writingFeedback.map(fb => ({
        text: '', // Would need to extract from content based on range
        comment: fb.comment,
        range: [fb.textRangeStart, fb.textRangeEnd]
      }))
    }

    return NextResponse.json({ submission: formattedSubmission })
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

