import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Fetch all mock tests from the database
    const mockTests = await prisma.mock.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        modules: {
          select: {
            durationMinutes: true
          }
        }
      }
    })

    // Transform the data to match the expected format
    const transformedMockTests = mockTests.map(mock => ({
      id: mock.id,
      title: mock.title,
      description: mock.description || 'IELTS Mock Test',
      duration: mock.modules.reduce((total, module) => total + module.durationMinutes, 0),
      status: 'ACTIVE', // All mocks are considered active by default
      createdAt: mock.createdAt
    }))

    return NextResponse.json({
      success: true,
      mockTests: transformedMockTests
    })
  } catch (error) {
    console.error('Error fetching mock tests:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch mock tests' 
      },
      { status: 500 }
    )
  }
}
