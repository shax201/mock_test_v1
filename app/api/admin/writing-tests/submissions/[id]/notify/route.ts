import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { emailService } from '@/lib/email/email-service'

const ALLOWED_ROLES = ['ADMIN', 'INSTRUCTOR']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || !ALLOWED_ROLES.includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const submissionId = resolvedParams.id
    const body = await request.json().catch(() => ({}))
    const optionalMessage: string | undefined = typeof body?.message === 'string' ? body.message : undefined

    const writingSession = await prisma.testSession.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!writingSession || writingSession.testType !== 'WRITING') {
      return NextResponse.json(
        { error: 'Writing test submission not found' },
        { status: 404 }
      )
    }

    if (!writingSession.student?.email) {
      return NextResponse.json(
        { error: 'Student email is missing. Update student profile before sending results.' },
        { status: 400 }
      )
    }

    const writingTest = await prisma.writingTest.findUnique({
      where: { id: writingSession.testId },
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!writingTest) {
      return NextResponse.json(
        { error: 'Associated writing test not found' },
        { status: 404 }
      )
    }

    const modules: Array<{
      name: string
      status: string
      band: number | null
      score: number | null
      completedAt?: string | null
      testTitle?: string | null
    }> = []

    // Reading summary
    let readingBand: number | null = null
    let readingSessionCompletedAt: string | null = null
    let readingScore: number | null = null
    let readingStatus = 'Pending'
    if (writingTest.readingTest?.id) {
      const readingSession = await prisma.testSession.findFirst({
        where: {
          testId: writingTest.readingTest.id,
          studentId: writingSession.studentId,
          testType: 'READING'
        },
        orderBy: { updatedAt: 'desc' }
      })

      if (readingSession) {
        readingBand = readingSession.band ?? null
        readingScore = readingSession.score ?? null
        readingSessionCompletedAt = readingSession.completedAt?.toISOString() ?? null
        readingStatus = 'Completed'
      }

      modules.push({
        name: 'Reading',
        status: readingStatus,
        band: readingBand,
        score: readingScore,
        completedAt: readingSessionCompletedAt,
        testTitle: writingTest.readingTest.title ?? 'Reading Test'
      })
    }

    // Listening summary (linked via reading test if available)
    if (writingTest.readingTest?.id) {
      const listeningTest = await prisma.listeningTest.findFirst({
        where: {
          readingTestId: writingTest.readingTest.id
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true
        }
      })

      if (listeningTest) {
        const listeningSession = await prisma.testSession.findFirst({
          where: {
            testId: listeningTest.id,
            studentId: writingSession.studentId,
            testType: 'LISTENING'
          },
          orderBy: { updatedAt: 'desc' }
        })

        modules.push({
          name: 'Listening',
          status: listeningSession ? 'Completed' : 'Pending',
          band: listeningSession?.band ?? null,
          score: listeningSession?.score ?? null,
          completedAt: listeningSession?.completedAt?.toISOString() ?? null,
          testTitle: listeningTest.title ?? 'Listening Test'
        })
      } else {
        modules.push({
          name: 'Listening',
          status: 'Pending',
          band: null,
          score: null,
          completedAt: null,
          testTitle: 'Listening Test'
        })
      }
    }

    // Writing summary
    const writingStatus = writingSession.band !== null && writingSession.band !== undefined
      ? 'Completed'
      : writingSession.isCompleted
        ? 'Awaiting Evaluation'
        : 'In Progress'

    modules.push({
      name: 'Writing',
      status: writingStatus,
      band: writingSession.band ?? null,
      score: writingSession.score ?? null,
      completedAt: writingSession.completedAt?.toISOString() ?? null,
      testTitle: writingTest.title
    })

    const calculableBands = modules
      .map((module) => module.band)
      .filter((value): value is number => typeof value === 'number')

    const overallBand = calculableBands.length
      ? Math.round((calculableBands.reduce((sum, value) => sum + value, 0) / calculableBands.length) * 2) / 2
      : null

    const emailSent = await emailService.sendResultsSummaryEmail({
      studentName: writingSession.student.name || 'Student',
      studentEmail: writingSession.student.email,
      mockTitle: writingTest.readingTest?.title ?? writingTest.title,
      overallBand,
      modules,
      message: optionalMessage ?? null
    })

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to deliver email. Check email service configuration.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      emailSent,
      data: {
        student: {
          name: writingSession.student.name,
          email: writingSession.student.email
        },
        modules,
        overallBand
      }
    })
  } catch (error) {
    console.error('Error sending results email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

