import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Test basic queries
    const userCount = await prisma.user.count()
    const readingTestCount = await prisma.readingTest.count()
    const passageCount = await prisma.passage.count()
    const questionCount = await prisma.question.count()

    return NextResponse.json({
      status: 'Database connection successful',
      counts: {
        users: userCount,
        readingTests: readingTestCount,
        passages: passageCount,
        questions: questionCount
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
