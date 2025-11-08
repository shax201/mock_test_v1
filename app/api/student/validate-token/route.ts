import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find assignment by access token
    const assignment = await prisma.assignment.findUnique({
      where: { accessToken: token },
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    // Check if token is expired
    const now = new Date()
    if (new Date(assignment.validUntil) < now) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 403 })
    }

    // Check if token is not yet valid
    if (new Date(assignment.validFrom) > now) {
      return NextResponse.json({ error: 'Token is not yet valid' }, { status: 403 })
    }

    return NextResponse.json({
      valid: true,
      assignment: {
        id: assignment.id,
        readingTestId: assignment.readingTestId,
        testTitle: assignment.readingTest.title,
        studentName: assignment.student.name || assignment.student.email,
        validFrom: assignment.validFrom,
        validUntil: assignment.validUntil
      }
    })
  } catch (error) {
    console.error('Error validating token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

