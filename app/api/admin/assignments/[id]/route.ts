import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { revalidatePath, revalidateTag } from 'next/cache'

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

    const { id } = await params

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        readingTest: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Error fetching assignment:', error)
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

    const { id } = await params

    await prisma.assignment.delete({
      where: { id }
    })

    // Revalidate the assignments list page and cache tags
    revalidatePath('/admin/assignments')
    revalidateTag('assignments',"max")
    // Also revalidate dashboard since it shows assignment stats
    revalidatePath('/admin')
    revalidateTag('admin-dashboard', "max")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

