import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, hasRole } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { calculateWritingBand, calculateOverallBand } from '@/lib/scoring/band-calculator'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    
    if (!payload || !hasRole(payload, UserRole.INSTRUCTOR)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { submissionId, marks, feedback } = await request.json()

    if (!submissionId || !marks) {
      return NextResponse.json(
        { error: 'Submission ID and marks are required' },
        { status: 400 }
      )
    }

    // Find the submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
        module: true
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Calculate writing band
    const writingBand = calculateWritingBand({
      taskAchievement: marks.taskAchievement,
      coherenceCohesion: marks.coherenceCohesion,
      lexicalResource: marks.lexicalResource,
      grammarAccuracy: marks.grammarAccuracy
    })

    // Create instructor mark
    await prisma.instructorMark.create({
      data: {
        submissionId: submissionId,
        instructorId: payload.userId,
        taskAchievement: marks.taskAchievement,
        coherenceCohesion: marks.coherenceCohesion,
        lexicalResource: marks.lexicalResource,
        grammarAccuracy: marks.grammarAccuracy,
        overallBand: writingBand
      }
    })

    // Add writing feedback if provided
    if (feedback && feedback.length > 0) {
      await Promise.all(
        feedback.map((fb: any) =>
          prisma.writingFeedback.create({
            data: {
              submissionId: submissionId,
              instructorId: payload.userId,
              textRangeStart: fb.range[0],
              textRangeEnd: fb.range[1],
              comment: fb.comment
            }
          })
        )
      )
    }

    // Check if all modules are graded and calculate overall result
    const assignment = await prisma.assignment.findUnique({
      where: { id: submission.assignmentId },
      include: {
        submissions: {
          include: {
            module: true,
            instructorMarks: true
          }
        }
      }
    })

    if (assignment) {
      const allModulesGraded = assignment.submissions.every(sub => {
        if (sub.module.type === 'LISTENING' || sub.module.type === 'READING') {
          return sub.autoScore !== null
        } else {
          return sub.instructorMarks.length > 0
        }
      })

      if (allModulesGraded) {
        // Calculate overall result
        const listeningSubmission = assignment.submissions.find(s => s.module.type === 'LISTENING')
        const readingSubmission = assignment.submissions.find(s => s.module.type === 'READING')
        const writingSubmission = assignment.submissions.find(s => s.module.type === 'WRITING')
        const speakingSubmission = assignment.submissions.find(s => s.module.type === 'SPEAKING')

        // Get bands (this would need proper conversion from auto scores)
        const listeningBand = listeningSubmission?.autoScore || 0
        const readingBand = readingSubmission?.autoScore || 0
        const writingBand = writingSubmission?.instructorMarks[0]?.overallBand || 0
        const speakingBand = speakingSubmission?.instructorMarks[0]?.overallBand || 0

        const overallBand = calculateOverallBand({
          listening: listeningBand,
          reading: readingBand,
          writing: writingBand,
          speaking: speakingBand
        })

        // Create result
        await prisma.result.upsert({
          where: { assignmentId: assignment.id },
          update: {
            listeningBand,
            readingBand,
            writingBand,
            speakingBand,
            overallBand
          },
          create: {
            assignmentId: assignment.id,
            listeningBand,
            readingBand,
            writingBand,
            speakingBand,
            overallBand
          }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving marks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
