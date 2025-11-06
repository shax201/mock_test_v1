import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const tests = await prisma.listeningTest.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: { select: { parts: true } },
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ tests })
  } catch (error) {
    console.error('Error fetching listening tests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


