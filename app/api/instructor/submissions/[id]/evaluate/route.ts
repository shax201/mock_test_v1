import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const sessionId = resolvedParams.id
    const body = await request.json()

    // Validate input
    const { band, task1Band, task2Band } = body

    let finalBand: number | null = null

    if (band !== undefined && band !== null) {
      // Direct overall band score
      if (typeof band !== 'number' || band < 0 || band > 9) {
        return NextResponse.json(
          { error: 'Band score must be between 0 and 9' },
          { status: 400 }
        )
      }
      finalBand = band
    } else if (task1Band !== undefined || task2Band !== undefined) {
      // Calculate from task scores
      const t1 = task1Band !== undefined ? parseFloat(task1Band) : null
      const t2 = task2Band !== undefined ? parseFloat(task2Band) : null

      if (t1 !== null && (t1 < 0 || t1 > 9)) {
        return NextResponse.json(
          { error: 'Task 1 band score must be between 0 and 9' },
          { status: 400 }
        )
      }
      if (t2 !== null && (t2 < 0 || t2 > 9)) {
        return NextResponse.json(
          { error: 'Task 2 band score must be between 0 and 9' },
          { status: 400 }
        )
      }

      if (t1 !== null && t2 !== null) {
        // Task 1 is 1/3, Task 2 is 2/3
        finalBand = (t1 * 1 + t2 * 2) / 3
        // Round to nearest 0.5
        finalBand = Math.round(finalBand * 2) / 2
      } else if (t1 !== null) {
        finalBand = t1
      } else if (t2 !== null) {
        finalBand = t2
      }
    }

    if (finalBand === null) {
      return NextResponse.json(
        { error: 'Please provide at least one band score' },
        { status: 400 }
      )
    }

    // Update the test session
    const updatedSession = await prisma.testSession.update({
      where: { id: sessionId },
      data: {
        band: finalBand,
        score: Math.round(finalBand * 10) // Convert band to score (0-90)
      }
    })

    // Revalidate instructor pages and cache tags
    revalidatePath('/instructor')
    revalidatePath('/instructor/pending')
    revalidatePath('/instructor/completed')
    revalidateTag('instructor-dashboard', 'max')
    revalidateTag('instructor-submissions', 'max')
    // Revalidate student results pages
    revalidateTag('student-results', 'max')
    revalidateTag('student-result-detail', 'max')

    return NextResponse.json({
      success: true,
      submission: {
        id: updatedSession.id,
        band: updatedSession.band,
        score: updatedSession.score,
        updatedAt: updatedSession.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error evaluating submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

