import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Test basic queries
    const userCount = await prisma.user.count()
    const mockCount = await prisma.mock.count()
    const questionBankCount = await prisma.questionBank.count()
    
    return NextResponse.json({
      status: 'Database connection successful',
      counts: {
        users: userCount,
        mocks: mockCount,
        questionBank: questionBankCount
      }
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
