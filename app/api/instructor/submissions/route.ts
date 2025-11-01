import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, hasRole } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    
    if (!payload || !hasRole(payload, UserRole.INSTRUCTOR)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending' // pending, completed
    const moduleType = searchParams.get('moduleType') // WRITING, SPEAKING, or null for all

    // Get submissions that need grading (WRITING or SPEAKING modules)
    // or that are already graded
    const whereClause: any = {
      module: {
        type: moduleType ? moduleType : { in: ['WRITING', 'SPEAKING'] }
      },
      submittedAt: { not: null }
    }

    if (status === 'pending') {
      // Submissions without instructor marks
      whereClause.instructorMarks = { none: {} }
    } else if (status === 'completed') {
      // Submissions with instructor marks
      whereClause.instructorMarks = { some: {} }
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        assignment: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            mock: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        module: {
          select: {
            id: true,
            type: true
          }
        },
        instructorMarks: {
          select: {
            id: true,
            overallBand: true,
            markedAt: true
          },
          orderBy: {
            markedAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        submittedAt: status === 'pending' ? 'asc' : 'desc'
      }
    })

    const formattedSubmissions = submissions.map(sub => ({
      id: sub.id,
      candidateNumber: sub.assignment.candidateNumber,
      studentName: sub.assignment.student.name || sub.assignment.student.email,
      studentEmail: sub.assignment.student.email,
      testTitle: sub.assignment.mock.title,
      moduleType: sub.module.type,
      submittedAt: sub.submittedAt,
      status: sub.instructorMarks.length > 0 ? 'COMPLETED' : 'PENDING',
      overallBand: sub.instructorMarks[0]?.overallBand || null,
      markedAt: sub.instructorMarks[0]?.markedAt || null
    }))

    return NextResponse.json({ submissions: formattedSubmissions })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

