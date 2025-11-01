import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyJWT } from '@/lib/auth/jwt'

const prisma = new PrismaClient()

export async function GET(
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
    const studentId = resolvedParams.id

    // Fetch student details
    const student = await prisma.user.findUnique({
      where: {
        id: studentId,
        role: 'STUDENT'
      },
      include: {
        assignments: {
          include: {
            mock: {
              select: {
                title: true,
                description: true
              }
            }
          }
        },
        _count: {
          select: {
            assignments: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const studentId = resolvedParams.id
    const { name, email, candidateNumber, phone, dateOfBirth, address, notes } = await request.json()

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if student exists
    const existingStudent = await prisma.user.findUnique({
      where: { id: studentId }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check if email is being changed and already exists
    if (email !== existingStudent.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }


    // Update student
    const student = await prisma.user.update({
      where: { id: studentId },
      data: {
        name,
        email,
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address || null,
        notes: notes || null
      }
    })

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const studentId = resolvedParams.id

    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check if student has any submissions (prevent deletion if they have test history)
    const submissionCount = await prisma.submission.count({
      where: {
        assignment: {
          studentId
        }
      }
    })

    if (submissionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete student with test submissions. Please archive instead.' },
        { status: 400 }
      )
    }

    // Delete student and related data
    await prisma.$transaction(async (tx) => {
      // Delete assignments
      await tx.assignment.deleteMany({
        where: { studentId }
      })

      // Delete student
      await tx.user.delete({
        where: { id: studentId }
      })
    })

    return NextResponse.json({ message: 'Student deleted successfully' })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
