import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    // Verify student authentication
    const token = request.cookies.get('student-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify JWT token using the same method as other student APIs
    const decoded = await verifyJWT(token)
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { mockId } = await request.json()

    if (!mockId) {
      return NextResponse.json(
        { error: 'Mock test ID is required' },
        { status: 400 }
      )
    }

    // Check if mock test exists
    const mock = await prisma.mock.findUnique({
      where: { id: mockId },
      include: {
        modules: true
      }
    })

    if (!mock) {
      return NextResponse.json(
        { error: 'Mock test not found' },
        { status: 404 }
      )
    }

    // Check if student already has an active assignment for this mock test
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        studentId: decoded.userId,
        mockId,
        status: 'ACTIVE'
      }
    })

    if (existingAssignment) {
      return NextResponse.json({
        success: true,
        assignment: {
          id: existingAssignment.id,
          tokenHash: existingAssignment.tokenHash,
          status: existingAssignment.status
        }
      })
    }

    // Generate candidate number and token hash
    const candidateNumber = `C${Date.now().toString().slice(-6)}`
    const tokenHash = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create assignment with 7 days validity
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 7)

    const assignment = await prisma.assignment.create({
      data: {
        studentId: decoded.userId,
        mockId,
        candidateNumber,
        tokenHash,
        validFrom: new Date(),
        validUntil,
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

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        tokenHash: assignment.tokenHash,
        status: assignment.status,
        mockTitle: assignment.mock.title,
        validUntil: assignment.validUntil
      }
    })
  } catch (error) {
    console.error('Error starting mock test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
