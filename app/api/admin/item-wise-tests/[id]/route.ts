import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

async function ensureAdmin(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const payload = await verifyJWT(token)
  if (!payload || payload.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { payload }
}

function normalizeIds(input: unknown) {
  return Array.isArray(input)
    ? Array.from(
        new Set(
          input.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
        )
      )
    : []
}

function revalidateItemWiseTestPages() {
  revalidatePath('/admin/item-wise-tests')
  revalidatePath('/admin')
  revalidateTag('item-wise-tests', 'max')
  revalidateTag('admin-dashboard', 'max')
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await ensureAdmin(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const itemWiseTest = await prisma.itemWiseTest.findUnique({ where: { id } })

    if (!itemWiseTest) {
      return NextResponse.json({ error: 'Item-wise test not found' }, { status: 404 })
    }

    return NextResponse.json({ itemWiseTest })
  } catch (error) {
    console.error('Error fetching item-wise test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await ensureAdmin(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const existing = await prisma.itemWiseTest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Item-wise test not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      isActive,
      testType,
      questionType,
      moduleType,
      readingTestIds,
      listeningTestIds,
      writingTestIds
    } = body

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return NextResponse.json({ error: 'Title must be a non-empty string' }, { status: 400 })
    }

    const normalizedReadingIds = readingTestIds !== undefined ? normalizeIds(readingTestIds) : undefined
    const normalizedListeningIds = listeningTestIds !== undefined ? normalizeIds(listeningTestIds) : undefined
    const normalizedWritingIds = writingTestIds !== undefined ? normalizeIds(writingTestIds) : undefined

    if (normalizedReadingIds && normalizedReadingIds.length) {
      const found = await prisma.readingTest.count({ where: { id: { in: normalizedReadingIds } } })
      if (found !== normalizedReadingIds.length) {
        return NextResponse.json({ error: 'One or more reading tests do not exist' }, { status: 400 })
      }
    }

    if (normalizedListeningIds && normalizedListeningIds.length) {
      const found = await prisma.listeningTest.count({ where: { id: { in: normalizedListeningIds } } })
      if (found !== normalizedListeningIds.length) {
        return NextResponse.json({ error: 'One or more listening tests do not exist' }, { status: 400 })
      }
    }

    if (normalizedWritingIds && normalizedWritingIds.length) {
      const found = await prisma.writingTest.count({ where: { id: { in: normalizedWritingIds } } })
      if (found !== normalizedWritingIds.length) {
        return NextResponse.json({ error: 'One or more writing tests do not exist' }, { status: 400 })
      }
    }

    const nextModuleType =
      moduleType && ['READING', 'LISTENING', 'WRITING'].includes(moduleType) ? moduleType : existing.moduleType

    const nextReadingIds =
      nextModuleType === 'READING'
        ? normalizedReadingIds ?? existing.readingTestIds
        : []
    const nextListeningIds =
      nextModuleType === 'LISTENING'
        ? normalizedListeningIds ?? existing.listeningTestIds
        : []
    const nextWritingIds =
      nextModuleType === 'WRITING'
        ? normalizedWritingIds ?? existing.writingTestIds
        : []

    if (nextModuleType === 'READING' && nextReadingIds.length === 0) {
      return NextResponse.json(
        { error: 'Select at least one reading test for a reading module.' },
        { status: 400 }
      )
    }

    if (nextModuleType === 'LISTENING' && nextListeningIds.length === 0) {
      return NextResponse.json(
        { error: 'Select at least one listening test for a listening module.' },
        { status: 400 }
      )
    }

    if (nextModuleType === 'WRITING' && nextWritingIds.length === 0) {
      return NextResponse.json(
        { error: 'Select at least one writing test for a writing module.' },
        { status: 400 }
      )
    }

    const updated = await prisma.itemWiseTest.update({
      where: { id },
      data: {
        title,
        isActive: typeof isActive === 'boolean' ? isActive : undefined,
        testType,
        questionType,
        moduleType: nextModuleType,
        readingTestIds: nextReadingIds,
        listeningTestIds: nextListeningIds,
        writingTestIds: nextWritingIds
      }
    })

    revalidateItemWiseTestPages()

    return NextResponse.json({ itemWiseTest: updated })
  } catch (error) {
    console.error('Error updating item-wise test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await ensureAdmin(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const existing = await prisma.itemWiseTest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Item-wise test not found' }, { status: 404 })
    }

    await prisma.itemWiseTest.delete({ where: { id } })

    revalidateItemWiseTestPages()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting item-wise test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
