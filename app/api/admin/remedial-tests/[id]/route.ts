import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

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

    const decoded = await verifyJWT(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const remedialTest = await prisma.remedialTestTemplate.findUnique({
      where: { id },
      include: {
        sessions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        mockTest: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      }
    })

    if (!remedialTest) {
      return NextResponse.json(
        { error: 'Remedial test not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      remedialTest
    })

  } catch (error) {
    console.error('Error fetching remedial test:', error)
    return NextResponse.json(
      { error: 'Failed to fetch remedial test' },
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

    const decoded = await verifyJWT(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      title,
      description,
      type,
      module,
      difficulty,
      duration,
      questions,
      audioUrl,
      audioPublicId,
      mockTestId,
      isActive
    } = await request.json()

    const { id } = await params
    // Check if remedial test exists
    const existingTest = await prisma.remedialTestTemplate.findUnique({
      where: { id }
    })

    if (!existingTest) {
      return NextResponse.json(
        { error: 'Remedial test not found' },
        { status: 404 }
      )
    }

    // Update remedial test template
    const updatedTest = await prisma.remedialTestTemplate.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(type && { type }),
        ...(module && { module }),
        ...(difficulty && { difficulty }),
        ...(duration && { duration }),
        ...(questions && { questions }),
        ...(audioUrl !== undefined && { audioUrl }),
        ...(audioPublicId !== undefined && { audioPublicId }),
        ...(mockTestId !== undefined && { mockTestId }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json({
      success: true,
      remedialTest: updatedTest
    })

  } catch (error) {
    console.error('Error updating remedial test:', error)
    return NextResponse.json(
      { error: 'Failed to update remedial test' },
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

    const decoded = await verifyJWT(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    // Check if remedial test exists
    const existingTest = await prisma.remedialTestTemplate.findUnique({
      where: { id }
    })

    if (!existingTest) {
      return NextResponse.json(
        { error: 'Remedial test not found' },
        { status: 404 }
      )
    }

    // Delete remedial test template and all related sessions
    await prisma.remedialTestTemplate.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Remedial test deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting remedial test:', error)
    return NextResponse.json(
      { error: 'Failed to delete remedial test' },
      { status: 500 }
    )
  }
}
