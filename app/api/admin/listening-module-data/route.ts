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

    const listeningData = await prisma.listeningModuleData.findUnique({
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

    if (!listeningData) {
      return NextResponse.json({ error: 'Listening module data not found' }, { status: 404 })
    }

    return NextResponse.json({ listeningData })
  } catch (error) {
    console.error('Error fetching listening module data:', error)
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
      audioUrl,
      audioPublicId,
      audioDuration,
      part1Content,
      part2Content,
      part3Content,
      part1Instructions,
      part2Instructions,
      part3Instructions,
      part1AudioStart,
      part1AudioEnd,
      part2AudioStart,
      part2AudioEnd,
      part3AudioStart,
      part3AudioEnd
    } = await request.json()

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    // Check if listening module data already exists
    const existingData = await prisma.listeningModuleData.findUnique({
      where: { moduleId }
    })

    let listeningData
    if (existingData) {
      // Update existing data
      listeningData = await prisma.listeningModuleData.update({
        where: { moduleId },
        data: {
          audioUrl: audioUrl || null,
          audioPublicId: audioPublicId || null,
          audioDuration: audioDuration || null,
          part1Content: part1Content || null,
          part2Content: part2Content || null,
          part3Content: part3Content || null,
          part1Instructions: part1Instructions || null,
          part2Instructions: part2Instructions || null,
          part3Instructions: part3Instructions || null,
          part1AudioStart: part1AudioStart || null,
          part1AudioEnd: part1AudioEnd || null,
          part2AudioStart: part2AudioStart || null,
          part2AudioEnd: part2AudioEnd || null,
          part3AudioStart: part3AudioStart || null,
          part3AudioEnd: part3AudioEnd || null
        }
      })
    } else {
      // Create new data
      listeningData = await prisma.listeningModuleData.create({
        data: {
          moduleId,
          audioUrl: audioUrl || null,
          audioPublicId: audioPublicId || null,
          audioDuration: audioDuration || null,
          part1Content: part1Content || null,
          part2Content: part2Content || null,
          part3Content: part3Content || null,
          part1Instructions: part1Instructions || null,
          part2Instructions: part2Instructions || null,
          part3Instructions: part3Instructions || null,
          part1AudioStart: part1AudioStart || null,
          part1AudioEnd: part1AudioEnd || null,
          part2AudioStart: part2AudioStart || null,
          part2AudioEnd: part2AudioEnd || null,
          part3AudioStart: part3AudioStart || null,
          part3AudioEnd: part3AudioEnd || null
        }
      })
    }

    return NextResponse.json({ listeningData }, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating listening module data:', error)
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
      audioUrl,
      audioPublicId,
      audioDuration,
      part1Content,
      part2Content,
      part3Content,
      part1Instructions,
      part2Instructions,
      part3Instructions,
      part1AudioStart,
      part1AudioEnd,
      part2AudioStart,
      part2AudioEnd,
      part3AudioStart,
      part3AudioEnd
    } = await request.json()

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    const listeningData = await prisma.listeningModuleData.update({
      where: { moduleId },
      data: {
        audioUrl: audioUrl || null,
        audioPublicId: audioPublicId || null,
        audioDuration: audioDuration || null,
        part1Content: part1Content || null,
        part2Content: part2Content || null,
        part3Content: part3Content || null,
        part1Instructions: part1Instructions || null,
        part2Instructions: part2Instructions || null,
        part3Instructions: part3Instructions || null,
        part1AudioStart: part1AudioStart || null,
        part1AudioEnd: part1AudioEnd || null,
        part2AudioStart: part2AudioStart || null,
        part2AudioEnd: part2AudioEnd || null,
        part3AudioStart: part3AudioStart || null,
        part3AudioEnd: part3AudioEnd || null
      }
    })

    return NextResponse.json({ listeningData })
  } catch (error) {
    console.error('Error updating listening module data:', error)
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

    await prisma.listeningModuleData.delete({
      where: { moduleId }
    })

    return NextResponse.json({ message: 'Listening module data deleted successfully' })
  } catch (error) {
    console.error('Error deleting listening module data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
