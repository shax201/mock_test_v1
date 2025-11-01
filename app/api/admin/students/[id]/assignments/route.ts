import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyJWT } from '@/lib/auth/jwt'
import { emailService } from '@/lib/email/email-service'

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

    // Fetch student assignments
    const assignments = await prisma.assignment.findMany({
      where: { studentId },
      include: {
        mock: {
          select: {
            title: true,
            description: true
          }
        },
        submissions: {
          select: {
            id: true,
            submittedAt: true,
            autoScore: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error fetching student assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const { mockId, expiresAt } = await request.json()

    // Validate required fields
    if (!mockId || !expiresAt) {
      return NextResponse.json(
        { error: 'Mock test ID and expiration date are required' },
        { status: 400 }
      )
    }

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

    // Check if mock test exists and is not a draft
    const mock = await prisma.mock.findUnique({
      where: { id: mockId }
    })

    if (!mock) {
      return NextResponse.json(
        { error: 'Mock test not found' },
        { status: 404 }
      )
    }


    // Check if assignment already exists
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        studentId,
        mockId,
        status: 'ACTIVE'
      }
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Student already has an active assignment for this mock test' },
        { status: 400 }
      )
    }

    // Generate candidate number and token hash
    const candidateNumber = `IELTS${Date.now().toString().slice(-6)}`
    const tokenHash = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        studentId,
        mockId,
        candidateNumber,
        tokenHash,
        validFrom: new Date(),
        validUntil: new Date(expiresAt),
        status: 'ACTIVE'
      },
      include: {
        mock: {
          select: {
            title: true,
            description: true
          }
        }
      }
    })

    // Send email notification to student
    try {
      // Get student details for email
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { name: true, email: true }
      })

      if (student) {
        const testLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/test/${assignment.tokenHash}`
        
        const emailData = {
          studentName: student.name || 'Student',
          studentEmail: student.email,
          mockTitle: assignment.mock.title,
          mockDescription: assignment.mock.description || 'Complete this IELTS mock test to assess your English language skills.',
          validUntil: assignment.validUntil.toISOString(),
          testLink
        }

        // Send email asynchronously (don't wait for it)
        emailService.sendAssignmentNotification(emailData).catch(error => {
          console.error('Failed to send assignment email:', error)
        })
      }
    } catch (emailError) {
      console.error('Error sending assignment email:', emailError)
      // Don't fail the assignment creation if email fails
    }

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
