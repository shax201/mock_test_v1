import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AssignmentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find assignment by token hash
    const assignment = await prisma.assignment.findUnique({
      where: { tokenHash: token },
      include: {
        mock: true,
        student: true
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      )
    }

    // Check if token is expired
    const now = new Date()
    if (now > assignment.validUntil) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 410 }
      )
    }

    // Check if token is not yet active
    if (now < assignment.validFrom) {
      return NextResponse.json(
        { error: 'Token is not yet active' },
        { status: 403 }
      )
    }

    // Check assignment status
    if (assignment.status === AssignmentStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Test has already been completed' },
        { status: 409 }
      )
    }

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        candidateNumber: assignment.candidateNumber,
        studentName: assignment.student.email, // Using email as name for now
        mockTitle: assignment.mock.title,
        validFrom: assignment.validFrom,
        validUntil: assignment.validUntil,
        status: assignment.status
      }
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
