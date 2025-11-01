import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
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

    // Get student's weak areas from their test results
    const studentResults = await prisma.submission.findMany({
      where: {
        assignment: {
          studentId: decoded.userId
        },
        submittedAt: {
          not: null
        }
      },
      include: {
        assignment: {
          include: {
            student: true
          }
        },
        module: {
          include: {
            mock: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 5 // Get last 5 test results
    })

    // Analyze weak areas
    const weakAreas = analyzeWeakAreas(studentResults)
    
    // Get available remedial test templates from database
    const remedialTestTemplates = await prisma.remedialTestTemplate.findMany({
      where: {
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

    // Check which remedial tests the student has already attempted
    const studentAssignments = await prisma.assignment.findMany({
      where: {
        studentId: decoded.userId,
        mock: {
          title: {
            startsWith: 'Remedial Test:'
          }
        }
      },
      include: {
        submissions: {
          where: {
            submittedAt: {
              not: null
            }
          }
        },
        mock: true
      }
    })

    // Also check RemedialTestSession for completed tests
    const completedSessions = await prisma.remedialTestSession.findMany({
      where: {
        studentId: decoded.userId,
        completedAt: {
          not: null
        }
      },
      include: {
        template: true
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Create a map of attempted remedial tests with completion info (keyed by template ID)
    const attemptedTests = new Map()
    
    // Add from assignments (if any - typically remedial tests use sessions, not assignments)
    studentAssignments.forEach(assignment => {
      if (assignment.submissions.length > 0) {
        // Note: This path is less common for remedial tests
        // Remedial tests typically use RemedialTestSession
      }
    })

    // Add from completed sessions (key by templateId)
    completedSessions.forEach(session => {
      if (session.templateId) {
        attemptedTests.set(session.templateId, {
          attempted: true,
          completedAt: session.completedAt,
          score: session.score
        })
      }
    })

    // Convert templates to the format expected by the frontend
    const remedialTests = remedialTestTemplates.map(template => {
      const attemptInfo = attemptedTests.get(template.id) || { attempted: false }
      return {
        id: template.id,
        title: template.title,
        description: template.description,
        type: template.type,
        module: template.module,
        difficulty: template.difficulty,
        duration: template.duration,
        questions: template.questions,
        mockTest: template.mockTest,
        attempted: attemptInfo.attempted,
        completedAt: attemptInfo.completedAt || null,
        score: attemptInfo.score || null
      }
    })

    return NextResponse.json({
      success: true,
      remedialTests,
      weakAreas
    })

  } catch (error) {
    console.error('Error fetching remedial tests:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', errorMessage)
    console.error('Error stack:', errorStack)
    return NextResponse.json(
      { error: 'Failed to fetch remedial tests', details: errorMessage },
      { status: 500 }
    )
  }
}

function analyzeWeakAreas(studentResults: any[]) {
  // For now, return default weak areas since we don't have question submissions
  // In a real implementation, this would analyze the student's performance
  const weakAreas = {
    reading: {
      matchingHeadings: 2,
      informationMatching: 1,
      multipleChoice: 3,
      trueFalse: 1
    },
    listening: {
      multipleChoice: 2,
      notesCompletion: 1,
      summaryCompletion: 0
    }
  }

  return weakAreas
}