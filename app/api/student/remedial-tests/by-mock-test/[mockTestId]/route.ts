import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mockTestId: string }> }
) {
  try {
    // Verify student authentication
    const token = request.cookies.get('student-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { mockTestId } = await params

    if (!mockTestId) {
      return NextResponse.json({ error: 'Mock test ID is required' }, { status: 400 })
    }

    // Get remedial test templates linked to this specific mock test
    const remedialTestTemplates = await prisma.remedialTestTemplate.findMany({
      where: {
        mockTestId: mockTestId,
        isActive: true
      },
      include: {
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

    // Convert templates to the format expected by the frontend
    const remedialTests = remedialTestTemplates.map(template => ({
      id: template.id,
      title: template.title,
      description: template.description,
      type: template.type,
      module: template.module,
      difficulty: template.difficulty,
      duration: template.duration,
      questions: template.questions,
      mockTest: template.mockTest
    }))

    return NextResponse.json({
      success: true,
      remedialTests,
      mockTestId
    })

  } catch (error: any) {
    console.error('Error fetching remedial tests by mock test ID:', error)
    return NextResponse.json(
      { error: 'Failed to fetch remedial tests', details: error.message },
      { status: 500 }
    )
  }
}
