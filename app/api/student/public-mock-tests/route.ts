import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get current user from token
    let currentUserId: string | null = null
    const token = request.cookies.get('student-token')?.value

    if (token) {
      try {
        const decoded = await verifyJWT(token)
        if (decoded && decoded.role === 'STUDENT') {
          currentUserId = decoded.userId
        }
      } catch (error) {
        // Token is invalid, continue without user context
        console.log('Invalid token, proceeding without user context')
      }
    }

    // Fetch all mock tests available for public participation
    const mockTests = await prisma.mock.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        modules: {
          select: {
            durationMinutes: true
          }
        },
        assignments: {
          where: currentUserId ? {
            studentId: currentUserId
          } : {
            studentId: 'nonexistent'
          },
          include: {
            submissions: {
              select: {
                submittedAt: true
              }
            }
          }
        }
      }
    })

    // Transform the data to match the expected format
    const transformedMockTests = mockTests.map(mock => {
      // Check if user has completed this test
      let status = 'AVAILABLE'
      let completionInfo = null

      if (currentUserId && mock.assignments && mock.assignments.length > 0) {
        const assignment = mock.assignments[0]
        const hasSubmissions = assignment.submissions.length > 0
        const allSubmitted = assignment.submissions.every(sub => sub.submittedAt !== null)
        
        if (hasSubmissions && allSubmitted) {
          status = 'COMPLETED'
          completionInfo = {
            completedAt: assignment.submissions[0]?.submittedAt
          }
        } else if (hasSubmissions) {
          status = 'IN_PROGRESS'
        }
      }

      return {
        id: mock.id,
        title: mock.title,
        description: mock.description || 'IELTS Mock Test',
        duration: mock.modules.reduce((total, module) => total + module.durationMinutes, 0),
        status: status,
        createdAt: mock.createdAt,
        completionInfo: completionInfo
      }
    })

    return NextResponse.json({
      success: true,
      mockTests: transformedMockTests
    })
  } catch (error) {
    console.error('Error fetching public mock tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch public mock tests' },
      { status: 500 }
    )
  }
}
