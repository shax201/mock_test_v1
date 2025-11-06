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
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all completed writing test sessions
    const sessions = await prisma.testSession.findMany({
      where: {
        testType: 'WRITING',
        isCompleted: true
      },
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
          testId: session.testId,
          testTitle: writingTest?.title || 'Unknown Test',
          readingTestTitle: writingTest?.readingTest?.title || 'N/A',
          answers: session.answers,
          isCompleted: session.isCompleted,
          completedAt: session.completedAt?.toISOString() || null,
          score: session.score,
          band: session.band,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString()
        }
      })
    )

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching writing test submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

