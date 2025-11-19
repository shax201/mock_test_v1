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

export async function GET(request: NextRequest) {
  try {
    const auth = await ensureAdmin(request)
    if ('error' in auth) return auth.error

    const tests = await prisma.itemWiseTest.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ itemWiseTests: tests })
  } catch (error) {
    console.error('Error fetching item-wise tests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await ensureAdmin(request)
    if ('error' in auth) return auth.error

    const body = await request.json()
    const {
      title,
      isActive = true,
      testType = 'ITEM_WISE_TEST',
      questionType = 'FLOW_CHART_COMPLETION',
      moduleType = 'READING',
      readingTestIds = [],
      listeningTestIds = [],
      writingTestIds = []
    } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!['READING', 'LISTENING', 'WRITING'].includes(moduleType)) {
      return NextResponse.json({ error: 'Invalid module type' }, { status: 400 })
    }

    const normalizedReadingIds = moduleType === 'READING' ? normalizeIds(readingTestIds) : []
    const normalizedListeningIds = moduleType === 'LISTENING' ? normalizeIds(listeningTestIds) : []
    const normalizedWritingIds = moduleType === 'WRITING' ? normalizeIds(writingTestIds) : []

    if (moduleType === 'READING' && normalizedReadingIds.length === 0) {
      return NextResponse.json(
        { error: 'Select at least one reading test for a reading module.' },
        { status: 400 }
      )
    }

    if (moduleType === 'LISTENING' && normalizedListeningIds.length === 0) {
      return NextResponse.json(
        { error: 'Select at least one listening test for a listening module.' },
        { status: 400 }
      )
    }

    if (moduleType === 'WRITING' && normalizedWritingIds.length === 0) {
      return NextResponse.json(
        { error: 'Select at least one writing test for a writing module.' },
        { status: 400 }
      )
    }

    if (normalizedReadingIds.length) {
      const found = await prisma.readingTest.count({ where: { id: { in: normalizedReadingIds } } })
      if (found !== normalizedReadingIds.length) {
        return NextResponse.json({ error: 'One or more reading tests do not exist' }, { status: 400 })
      }
    }

    if (normalizedListeningIds.length) {
      const found = await prisma.listeningTest.count({ where: { id: { in: normalizedListeningIds } } })
      if (found !== normalizedListeningIds.length) {
        return NextResponse.json({ error: 'One or more listening tests do not exist' }, { status: 400 })
      }
    }

    if (normalizedWritingIds.length) {
      const found = await prisma.writingTest.count({ where: { id: { in: normalizedWritingIds } } })
      if (found !== normalizedWritingIds.length) {
        return NextResponse.json({ error: 'One or more writing tests do not exist' }, { status: 400 })
      }
    }

    const itemWiseTest = await prisma.itemWiseTest.create({
      data: {
        title,
        isActive: Boolean(isActive),
        testType,
        questionType,
        moduleType,
        readingTestIds: normalizedReadingIds,
        listeningTestIds: normalizedListeningIds,
        writingTestIds: normalizedWritingIds
      }
    })

    revalidateItemWiseTestPages()

    return NextResponse.json({ itemWiseTest }, { status: 201 })
  } catch (error) {
    console.error('Error creating item-wise test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
