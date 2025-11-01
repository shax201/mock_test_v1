import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyJWT } from '@/lib/auth/jwt'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const assignmentId = resolvedParams.id

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check if assignment has submissions
    const submissionCount = await prisma.submission.count({
      where: { assignmentId }
    })

    if (submissionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete assignment with submissions. Please archive instead.' },
        { status: 400 }
      )
    }

    // Delete assignment
    await prisma.assignment.delete({
      where: { id: assignmentId }
    })

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
