import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AssignmentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (in production, you'd verify the Vercel cron secret)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find expired assignments
    const expiredAssignments = await prisma.assignment.findMany({
      where: {
        validUntil: {
          lt: new Date()
        },
        status: {
          not: AssignmentStatus.EXPIRED
        }
      }
    })

    // Update expired assignments
    const updateResult = await prisma.assignment.updateMany({
      where: {
        validUntil: {
          lt: new Date()
        },
        status: {
          not: AssignmentStatus.EXPIRED
        }
      },
      data: {
        status: AssignmentStatus.EXPIRED
      }
    })

    return NextResponse.json({
      success: true,
      expiredCount: updateResult.count,
      message: `Marked ${updateResult.count} assignments as expired`
    })
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
