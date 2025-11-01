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

    // Fetch all mock tests that have listening modules
    const mockTests = await prisma.mock.findMany({
      where: {
        modules: {
          some: {
            type: 'LISTENING'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        modules: {
          where: {
            type: 'LISTENING'
          },
          select: {
            id: true,
            type: true,
            durationMinutes: true,
            audioUrl: true,
            instructions: true
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
              include: {
                module: {
                  select: {
                    type: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Fetch all active remedial tests with LISTENING module
    const remedialTests = await prisma.remedialTestTemplate.findMany({
      where: {
        module: 'LISTENING',
        isActive: true
      },
      include: {
        sessions: currentUserId ? {
          where: {
            studentId: currentUserId,
            completedAt: {
              not: null
            }
          },
          orderBy: {
            completedAt: 'desc'
          },
          take: 1
        } : false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the expected format
    const transformedMockTests = mockTests.map(mock => {
      const listeningModule = mock.modules[0] // Get the listening module
      
      // Check if user has completed this listening test
      let status = 'AVAILABLE'
      let completionInfo = null

      if (currentUserId && mock.assignments && mock.assignments.length > 0) {
        const assignment = mock.assignments[0]
        const listeningSubmission = assignment.submissions?.find(sub => sub.module && sub.module.type === 'LISTENING')
        
        if (listeningSubmission && listeningSubmission.submittedAt) {
          status = 'COMPLETED'
          completionInfo = {
            completedAt: listeningSubmission.submittedAt,
            autoScore: listeningSubmission.autoScore
          }
        }
      }
      
      return {
        id: mock.id,
        title: mock.title,
        description: mock.description || 'IELTS Listening Test',
        duration: listeningModule?.durationMinutes || 40,
        status: status,
        createdAt: mock.createdAt,
        audioUrl: listeningModule?.audioUrl,
        instructions: listeningModule?.instructions,
        moduleId: listeningModule?.id,
        completionInfo: completionInfo,
        isRemedial: false
      }
    })

    // Transform remedial tests to match the same format
    const transformedRemedialTests = remedialTests.map(template => {
      let status = 'AVAILABLE'
      let completionInfo = null

      // Check if user has completed this remedial test
      if (currentUserId && template.sessions && template.sessions.length > 0) {
        const session = template.sessions[0]
        if (session.completedAt) {
          status = 'COMPLETED'
          completionInfo = {
            completedAt: session.completedAt,
            autoScore: session.score || undefined
          }
        }
      }

      return {
        id: template.id,
        title: template.title,
        description: template.description || 'Remedial Listening Test',
        duration: template.duration,
        status: status,
        createdAt: template.createdAt,
        audioUrl: template.audioUrl || null,
        instructions: null,
        moduleId: null,
        completionInfo: completionInfo,
        isRemedial: true,
        remedialType: template.type,
        difficulty: template.difficulty
      }
    })

    // Combine both lists, with remedial tests first
    const allTests = [...transformedRemedialTests, ...transformedMockTests]

    return NextResponse.json({
      success: true,
      mockTests: allTests
    })
  } catch (error) {
    console.error('Error fetching listening tests:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch listening tests' 
      },
      { status: 500 }
    )
  }
}
