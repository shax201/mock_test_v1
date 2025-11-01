import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
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

    // Get all remedial test templates
    const remedialTests = await prisma.remedialTestTemplate.findMany({
      include: {
        _count: {
          select: {
            sessions: true
          }
        },
        mockTest: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      remedialTests
    })

  } catch (error) {
    console.error('Error fetching remedial tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch remedial tests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      isActive = true
    } = await request.json()

    // Validate required fields
    if (!title || !type || !module || !questions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create remedial test template
    const remedialTest = await prisma.remedialTestTemplate.create({
      data: {
        title,
        description,
        type,
        module,
        difficulty: difficulty || 'INTERMEDIATE',
        duration: duration || 20,
        questions: questions,
        audioUrl: audioUrl || null,
        audioPublicId: audioPublicId || null,
        mockTestId: mockTestId || null,
        isActive,
        createdBy: decoded.userId
      }
    })

    return NextResponse.json({
      success: true,
      remedialTest
    })

  } catch (error) {
    console.error('Error creating remedial test:', error)
    return NextResponse.json(
      { error: 'Failed to create remedial test' },
      { status: 500 }
    )
  }
}
