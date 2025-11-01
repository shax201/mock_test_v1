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
    
    if (!payload || !hasRole(payload, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('moduleId')

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    const readingData = await prisma.readingModuleData.findUnique({
      where: { moduleId },
      include: {
        module: {
          include: {
            questions: {
              include: {
                questionBank: true
              }
            }
          }
        }
      }
    })

    if (!readingData) {
      return NextResponse.json({ error: 'Reading module data not found' }, { status: 404 })
    }

    return NextResponse.json({ readingData })
  } catch (error) {
    console.error('Error fetching reading module data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    
    if (!payload || !hasRole(payload, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      moduleId,
      part1Content,
      part2Content,
      part3Content,
      part1Passage,
      part2Passage,
      part3Passage,
      part1Instructions,
      part2Instructions,
      part3Instructions
    } = await request.json()

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    // Check if reading module data already exists
    const existingData = await prisma.readingModuleData.findUnique({
      where: { moduleId }
    })

    let readingData
    if (existingData) {
      // Update existing data
      readingData = await prisma.readingModuleData.update({
        where: { moduleId },
        data: {
          part1Content: part1Content || null,
          part2Content: part2Content || null,
          part3Content: part3Content || null,
          part1Passage: part1Passage || null,
          part2Passage: part2Passage || null,
          part3Passage: part3Passage || null,
          part1Instructions: part1Instructions || null,
          part2Instructions: part2Instructions || null,
          part3Instructions: part3Instructions || null
        }
      })
    } else {
      // Create new data
      readingData = await prisma.readingModuleData.create({
        data: {
          moduleId,
          part1Content: part1Content || null,
          part2Content: part2Content || null,
          part3Content: part3Content || null,
          part1Passage: part1Passage || null,
          part2Passage: part2Passage || null,
          part3Passage: part3Passage || null,
          part1Instructions: part1Instructions || null,
          part2Instructions: part2Instructions || null,
          part3Instructions: part3Instructions || null
        }
      })
    }

    return NextResponse.json({ readingData }, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating reading module data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    
    if (!payload || !hasRole(payload, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      moduleId,
      part1Content,
      part2Content,
      part3Content,
      part1Passage,
      part2Passage,
      part3Passage,
      part1Instructions,
      part2Instructions,
      part3Instructions
    } = await request.json()

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    const readingData = await prisma.readingModuleData.update({
      where: { moduleId },
      data: {
        part1Content: part1Content || null,
        part2Content: part2Content || null,
        part3Content: part3Content || null,
        part1Passage: part1Passage || null,
        part2Passage: part2Passage || null,
        part3Passage: part3Passage || null,
        part1Instructions: part1Instructions || null,
        part2Instructions: part2Instructions || null,
        part3Instructions: part3Instructions || null
      }
    })

    return NextResponse.json({ readingData })
  } catch (error) {
    console.error('Error updating reading module data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    
    if (!payload || !hasRole(payload, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('moduleId')

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    await prisma.readingModuleData.delete({
      where: { moduleId }
    })

    return NextResponse.json({ message: 'Reading module data deleted successfully' })
  } catch (error) {
    console.error('Error deleting reading module data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
