import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

/**
 * GET /api/student/listening-tests/by-reading-test/[id]
 * Gets the listening test associated with a reading test ID
 * This allows students to navigate from reading test to listening test
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate student
    const token = request.cookies.get('student-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const readingTestId = resolvedParams.id

    // Find listening test that is associated with this reading test
    const listeningTest = await prisma.listeningTest.findFirst({
      where: {
        readingTestId: readingTestId,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        audioSource: true,
        totalTimeMinutes: true
      }
    })

    if (!listeningTest) {
      return NextResponse.json(
        { error: 'No listening test found for this reading test' },
        { status: 404 }
      )
    }

    return NextResponse.json({ listeningTest })
  } catch (error) {
    console.error('Error fetching listening test by reading test ID:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

