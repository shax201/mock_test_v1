import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const test = await prisma.listeningTest.findUnique({
      where: { id },
      include: {
        parts: {
          include: {
            questions: {
              include: { correctAnswer: true },
              orderBy: { number: 'asc' }
            }
          },
          orderBy: { index: 'asc' }
        }
      }
    })

    if (!test) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Build JSON structure compatible with the UI
    const correctAnswers: Record<string, any> = {}
    const parts = test.parts.map((part) => {
      // Map questions by type into appropriate UI fields
      const fillRows: any[] = []
      const singleChoice: any[] = []
      const matchingItems: any[] = []

      part.questions.forEach((q) => {
        // Collect correct answers map
        correctAnswers[`q${q.number}`] = q.correctAnswer?.answer ?? null

        if (q.type === 'TEXT') {
          // Part 1 and Part 4 blanks
          if (part.index === 1) {
            fillRows.push({
              q: q.number,
              labelPrefix: q.labelPrefix ?? '',
              textPrefix: q.textPrefix ?? '',
              textSuffix: q.textSuffix ?? ''
            })
          }
          // Part 4 will be handled by notesSections; TEXT questions still need answers only
        } else if (q.type === 'RADIO') {
          singleChoice.push({
            number: q.number,
            question: q.questionText ?? '',
            options: Array.isArray(q.options) ? q.options : (q.options ? (q.options as any) : [])
          })
        } else if (q.type === 'SELECT') {
          matchingItems.push({ q: q.number, label: q.matchingLabel ?? '' })
        }
      })

      const result: any = {
        id: part.index,
        title: part.title,
        prompt: Array.isArray(part.prompt) ? part.prompt : [],
        sectionTitle: part.sectionTitle ?? undefined,
        courseRequired: part.courseRequired ?? undefined,
      }

      if (fillRows.length) result.fillRows = fillRows
      if (singleChoice.length) result.singleChoice = singleChoice
      if (matchingItems.length || part.matchingHeading || part.matchingOptions) {
        result.matching = {
          heading: part.matchingHeading ?? '',
          options: Array.isArray(part.matchingOptions) ? part.matchingOptions : [],
          items: matchingItems
        }
      }
      if (part.notesSections) result.notes = part.notesSections

      return result
    })

    const payload = {
      audioSource: test.audioSource,
      instructions: Array.isArray(test.instructions) ? test.instructions : [],
      parts,
      correctAnswers
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Error fetching listening test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


