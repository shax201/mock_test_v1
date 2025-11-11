import type { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { revalidatePath, revalidateTag } from 'next/cache'

interface IncomingNote {
  id: string
  start: number
  end: number
  text: string
  category: string
  comment: string
}

const normalizeNotes = (notes: unknown): IncomingNote[] => {
  if (!Array.isArray(notes)) return []

  return notes
    .map((note) => {
      if (typeof note !== 'object' || note === null) return null
      const record = note as Record<string, unknown>

      const id = typeof record.id === 'string' ? record.id : null
      const start = typeof record.start === 'number' ? record.start : null
      const end = typeof record.end === 'number' ? record.end : null
      const text = typeof record.text === 'string' ? record.text : ''
      const category = typeof record.category === 'string' ? record.category : ''
      const comment = typeof record.comment === 'string' ? record.comment : ''

      if (!id || start === null || end === null || start < 0 || end < start) {
        return null
      }

      return {
        id,
        start,
        end,
        text,
        category: category || 'Other',
        comment
      } satisfies IncomingNote
    })
    .filter((note): note is IncomingNote => !!note)
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
    const { questionId, text, notes } = await request.json()

    if (!questionId || typeof questionId !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing questionId' }, { status: 400 })
    }

    if (typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid answer text' }, { status: 400 })
    }

    const normalizedNotes = normalizeNotes(notes)

    const session = await prisma.testSession.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!session || session.testType !== 'WRITING') {
      return NextResponse.json(
        { error: 'Writing test submission not found' },
        { status: 404 }
      )
    }

    const existingAnswers = (session.answers as Prisma.JsonObject) ?? {}
    const notesPayload = normalizedNotes.map((note) => ({
      id: note.id,
      start: note.start,
      end: note.end,
      text: note.text,
      category: note.category,
      comment: note.comment
    })) satisfies Prisma.JsonArray

    const updatedAnswers = {
      ...existingAnswers,
      [questionId]: {
        text,
        notes: notesPayload
      }
    } satisfies Prisma.JsonObject

    await prisma.testSession.update({
      where: { id: resolvedParams.id },
      data: {
        answers: updatedAnswers
      }
    })

    // Revalidate caches so admin/student views update
    revalidatePath(`/admin/writing-tests/submissions/${resolvedParams.id}`)
    revalidateTag('writing-submissions')
    revalidateTag('student-results')

    return NextResponse.json({
      success: true,
      answer: updatedAnswers[questionId]
    })
  } catch (error) {
    console.error('Error saving writing notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

