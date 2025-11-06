import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const listeningTest = await prisma.listeningTest.findUnique({
      where: { id: resolvedParams.id },
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        },
        parts: {
          include: {
            questions: {
              include: {
                correctAnswer: true
              }
            }
          },
          orderBy: {
            index: 'asc'
          }
        }
      }
    })

    if (!listeningTest) {
      return NextResponse.json({ error: 'Listening test not found' }, { status: 404 })
    }

    return NextResponse.json({ listeningTest })
  } catch (error) {
    console.error('Error fetching listening test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const { title, audioSource, instructions, readingTestId, isActive } = await request.json()

    const listeningTest = await prisma.listeningTest.update({
      where: { id: resolvedParams.id },
      data: {
        ...(title !== undefined && { title }),
        ...(audioSource !== undefined && { audioSource }),
        ...(instructions !== undefined && { instructions }),
        ...(readingTestId !== undefined && { readingTestId: readingTestId || null }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        },
        parts: {
          include: {
            questions: {
              include: {
                correctAnswer: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ listeningTest })
  } catch (error) {
    console.error('Error updating listening test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    await prisma.listeningTest.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ message: 'Listening test deleted successfully' })
  } catch (error) {
    console.error('Error deleting listening test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

