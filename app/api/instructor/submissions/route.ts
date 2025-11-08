import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all' // 'pending', 'completed', 'all'
    const moduleType = searchParams.get('moduleType') || 'all' // 'WRITING', 'SPEAKING', 'all'

    // Build where clause
    const where: any = {
      testType: 'WRITING', // Only writing tests need instructor grading
      isCompleted: true
    }

    if (status === 'pending') {
      where.band = null
    } else if (status === 'completed') {
      where.band = { not: null }
    }

    // Fetch submissions
    const sessions = await prisma.testSession.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Fetch writing test details for each session
    const submissions = await Promise.all(
      sessions.map(async (session) => {
        const writingTest = await prisma.writingTest.findUnique({
          where: { id: session.testId },
          select: {
            id: true,
            title: true,
            readingTest: {
              select: {
                id: true,
                title: true
              }
            }
          }
        })

        return {
          id: session.id,
          studentId: session.studentId,
          studentName: session.student.name || 'Unknown',
          studentEmail: session.student.email,
          candidateNumber: session.student.email.split('@')[0], // Use email prefix as candidate number
          testId: session.testId,
          testTitle: writingTest?.title || 'Unknown Test',
          readingTestTitle: writingTest?.readingTest?.title || 'N/A',
          moduleType: 'WRITING',
          moduleTitle: 'Writing Test',
          answers: session.answers,
          isCompleted: session.isCompleted,
          completedAt: session.completedAt?.toISOString() || null,
          score: session.score,
          band: session.band,
          submittedAt: session.completedAt?.toISOString() || session.createdAt.toISOString(),
          status: session.band === null ? 'PENDING' : 'COMPLETED',
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString()
        }
      })
    )

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching instructor submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

