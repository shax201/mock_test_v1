'use server'

import { prisma } from '@/lib/db'

export async function getMockTests() {
  try {
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

    return {
      success: true,
      mockTests
    }
  } catch (error) {
    console.error('Error fetching mock tests:', error)
    return {
      success: false,
      mockTests: [],
      error: 'Failed to fetch mock tests'
    }
  }
}
