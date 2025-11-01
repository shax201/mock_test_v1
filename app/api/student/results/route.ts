import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenParam = searchParams.get('token')
    
    // Check if this is a token-based request (from test completion page)
    if (tokenParam) {
      // Find assignment by token hash
      const assignment = await prisma.assignment.findUnique({
        where: { tokenHash: tokenParam },
        include: {
          result: true,
          mock: true,
          student: true
        }
      })

      if (!assignment) {
        return NextResponse.json(
          { error: 'No results found' },
          { status: 404 }
        )
      }

      if (!assignment.result) {
        return NextResponse.json(
          { error: 'Results are not yet available. Please check back in 2-3 business days.' },
          { status: 202 }
        )
      }

      // Show results even if some scores are 0 (partial results are better than no results)

      // Get writing feedback
      const writingFeedback = await prisma.writingFeedback.findMany({
        where: {
          submission: {
            assignmentId: assignment.id,
            module: {
              type: 'WRITING'
            }
          }
        },
        include: {
          instructor: {
            select: { email: true }
          }
        }
      })

      const results = {
        candidateNumber: assignment.candidateNumber,
        testTitle: assignment.mock.title,
        bands: {
          listening: assignment.result.listeningBand,
          reading: assignment.result.readingBand,
          writing: assignment.result.writingBand,
          speaking: assignment.result.speakingBand,
          overall: assignment.result.overallBand
        },
        feedback: {
          writing: writingFeedback.map(fb => ({
            text: fb.comment,
            comment: `Instructor feedback: ${fb.comment}`,
            range: [fb.textRangeStart, fb.textRangeEnd]
          }))
        },
        generatedAt: assignment.result.generatedAt.toISOString()
      }

      return NextResponse.json({ results })
    }

    // Original JWT-based authentication for student portal
    const token = request.cookies.get('student-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    // Verify JWT token
    const decoded = await verifyJWT(token)

    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 403 }
      )
    }

    // Get student's results
    const results = await prisma.result.findMany({
      where: {
        assignment: {
          studentId: decoded.userId
        }
      },
      include: {
        assignment: {
          include: {
            mock: true
          }
        }
      },
      orderBy: {
        generatedAt: 'desc'
      }
    })

    const formattedResults = results.map(result => ({
      id: result.id,
      testTitle: result.assignment.mock.title,
      overallBand: result.overallBand,
      listeningBand: result.listeningBand,
      readingBand: result.readingBand,
      writingBand: result.writingBand,
      speakingBand: result.speakingBand,
      completedAt: result.generatedAt.toISOString(),
      status: 'COMPLETED',
      candidateNumber: result.assignment.candidateNumber
    }))

    return NextResponse.json({
      results: formattedResults
    })
  } catch (error) {
    console.error('Results error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}