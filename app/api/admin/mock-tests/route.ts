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

    // Get all mock tests for selection
    const mockTests = await prisma.mock.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        modules: {
          select: {
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      mockTests
    })

  } catch (error) {
    console.error('Error fetching mock tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mock tests' },
      { status: 500 }
    )
  }
}
