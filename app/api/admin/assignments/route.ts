import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { revalidatePath, revalidateTag } from 'next/cache'
import { randomBytes } from 'crypto'
import { emailService } from '@/lib/email/email-service'

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

    // Check if assignment model exists
    if (!prisma.assignment) {
      console.error('Assignment model not found in Prisma client. Please restart the dev server.')
      return NextResponse.json(
        { error: 'Assignment model not available. Please restart the server.' },
        { status: 500 }
      )
    }

    const assignments = await prisma.assignment.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        readingTest: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate status based on dates
    const now = new Date()
    const assignmentsWithStatus = assignments.map(assignment => {
      let status = assignment.status

      // Auto-update status based on dates
      if (new Date(assignment.validFrom) > now) {
        status = 'PENDING'
      } else if (new Date(assignment.validUntil) < now) {
        status = 'EXPIRED'
      } else if (status === 'PENDING' && new Date(assignment.validFrom) <= now) {
        status = 'ACTIVE'
      }

      return {
        ...assignment,
        status
      }
    })

    return NextResponse.json({ assignments: assignmentsWithStatus })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { studentId, readingTestId, validFrom, validUntil } = await request.json()

    // Validation
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    if (!readingTestId) {
      return NextResponse.json({ error: 'Reading test ID is required' }, { status: 400 })
    }

    if (!validFrom) {
      return NextResponse.json({ error: 'Valid from date is required' }, { status: 400 })
    }

    if (!validUntil) {
      return NextResponse.json({ error: 'Valid until date is required' }, { status: 400 })
    }

    if (new Date(validUntil) <= new Date(validFrom)) {
      return NextResponse.json({ error: 'Expiration date must be after the start date' }, { status: 400 })
    }

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Verify reading test exists
    const readingTest = await prisma.readingTest.findUnique({
      where: { id: readingTestId }
    })

    if (!readingTest) {
      return NextResponse.json({ error: 'Reading test not found' }, { status: 404 })
    }

    // Generate unique access token
    const accessToken = randomBytes(32).toString('hex')

    // Determine initial status
    const now = new Date()
    const validFromDate = new Date(validFrom)
    let status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' = 'PENDING'
    if (validFromDate <= now) {
      status = 'ACTIVE'
    }

    const assignment = await prisma.assignment.create({
      data: {
        studentId,
        readingTestId,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        accessToken,
        status
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        readingTest: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Send email notification to student
    try {
      // Get base URL for the test link
      const protocol = request.headers.get('x-forwarded-proto') || 'http'
      const host = request.headers.get('host') || 'localhost:3000'
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`
      const testLink = `${baseUrl}/test/${accessToken}`
      
      const validFromFormatted = new Date(assignment.validFrom).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      const validUntilFormatted = new Date(assignment.validUntil).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      await emailService.sendAssignmentNotification({
        studentName: assignment.student.name || assignment.student.email,
        studentEmail: assignment.student.email,
        mockTitle: assignment.readingTest.title,
        mockDescription: `You have been assigned an IELTS Reading Test. The test will be available from ${validFromFormatted} until ${validUntilFormatted}. Please complete the test before the expiration date.`,
        validUntil: assignment.validUntil.toISOString(),
        testLink
      })
      console.log(`Assignment email sent successfully to ${assignment.student.email}`)
    } catch (emailError) {
      // Log error but don't fail the assignment creation
      console.error('Failed to send assignment email:', emailError)
      // Continue - assignment is created successfully even if email fails
    }

    // Revalidate the assignments list page and cache tags
    revalidatePath('/admin/assignments')
    revalidateTag('assignments', "max")
    // Also revalidate dashboard since it shows assignment stats
    revalidatePath('/admin')
    revalidateTag('admin-dashboard', "max")

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating assignment:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Access token collision. Please try again.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

