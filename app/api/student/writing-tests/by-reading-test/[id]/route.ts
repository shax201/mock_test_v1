import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

/**
 * GET /api/student/writing-tests/by-reading-test/[id]
 * Gets the writing test associated with a reading test ID
 * This allows students to navigate from reading test to writing test
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

    // Find writing test that is based on this reading test
    const writingTest = await prisma.writingTest.findFirst({
      where: {
        readingTestId: readingTestId,
        isActive: true
      },
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        },
        passages: {
          include: {
            contents: {
              orderBy: { order: 'asc' }
            },
            questions: {
              include: {
                readingPassage: {
                  select: {
                    id: true,
                    title: true,
                    order: true
                  }
                }
              },
              orderBy: { questionNumber: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        passageConfigs: {
          orderBy: { part: 'asc' }
        }
      }
    })

    if (!writingTest) {
      return NextResponse.json(
        { error: 'No writing test found for this reading test' },
        { status: 404 }
      )
    }

    return NextResponse.json({ writingTest })
  } catch (error) {
    console.error('Error fetching writing test by reading test ID:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

