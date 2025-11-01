import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyJWT } from '@/lib/auth/jwt'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const status = searchParams.get('status') || 'all'

    const where: any = {}
    if (status !== 'all') {
      where.status = status
    }
    if (q) {
      where.OR = [
        { mock: { title: { contains: q, mode: 'insensitive' } } },
        { student: { email: { contains: q, mode: 'insensitive' } } },
        { student: { name: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        mock: {
          select: { id: true, title: true, description: true }
        },
        student: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error listing assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


