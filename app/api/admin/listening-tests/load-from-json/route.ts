import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Load-from-JSON API called for listening test')

    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Read the JSON file
    const filePath = path.join(process.cwd(), 'app', 'full-exam-listening', 'listening-test-data.json')
    console.log('Reading file from:', filePath)

    const fileContents = fs.readFileSync(filePath, 'utf8')
    const jsonData = JSON.parse(fileContents)
    console.log('JSON parsed successfully')

    const requestBody = await request.json().catch(() => ({}))
    const { readingTestId } = requestBody

    const { audioSource, instructions, parts, correctAnswers } = jsonData

    // Transform parts with their questions
    console.log('🔄 Transforming parts...')
    const transformedParts = parts.map((part: any, partIndex: number) => {
      const questions: any[] = []

      // Part 1: Fill-in-the-blank questions
      if (part.fillRows) {
        part.fillRows.forEach((row: any) => {
          questions.push({
            number: row.q,
            type: 'TEXT',
            labelPrefix: row.labelPrefix,
            textPrefix: row.textPrefix,
            textSuffix: row.textSuffix,
            correctAnswer: correctAnswers[`q${row.q}`]
          })
        })
      }

      // Part 2 & 3: Single choice (radio) questions
      if (part.singleChoice) {
        part.singleChoice.forEach((sc: any) => {
          questions.push({
            number: sc.number,
            type: 'RADIO',
            questionText: sc.question,
            options: sc.options,
            correctAnswer: correctAnswers[`q${sc.number}`]
          })
        })
      }

      // Part 2 & 3: Matching (select) questions
      if (part.matching && part.matching.items) {
        part.matching.items.forEach((item: any) => {
          questions.push({
            number: item.q,
            type: 'SELECT',
            matchingLabel: item.label,
            correctAnswer: correctAnswers[`q${item.q}`]
          })
        })
      }

      // Part 4: Notes completion questions
      if (part.notes) {
        const extractQuestionsFromNotes = (notes: any[]): void => {
          notes.forEach((section: any) => {
            if (section.items) {
              section.items.forEach((item: any) => {
                if (item.q) {
                  questions.push({
                    number: item.q,
                    type: 'TEXT',
                    textPrefix: item.prefix,
                    textSuffix: item.suffix,
                    correctAnswer: correctAnswers[`q${item.q}`]
                  })
                }
                if (item.children) {
                  extractQuestionsFromNotes([{ items: item.children }])
                }
              })
            }
            if (section.subsections) {
              section.subsections.forEach((sub: any) => {
                if (sub.items) {
                  sub.items.forEach((item: any) => {
                    if (item.q) {
                      questions.push({
                        number: item.q,
                        type: 'TEXT',
                        textPrefix: item.prefix,
                        textSuffix: item.suffix,
                        correctAnswer: correctAnswers[`q${item.q}`]
                      })
                    }
                  })
                }
              })
            }
          })
        }
        extractQuestionsFromNotes(part.notes)
      }

      return {
        index: part.id || partIndex + 1,
        title: part.title,
        prompt: part.prompt || (part.prompt11_15 ? [part.prompt11_15] : []),
        sectionTitle: part.sectionTitle,
        courseRequired: part.courseRequired,
        matchingHeading: part.matching?.heading,
        matchingOptions: part.matching?.options,
        notesSections: part.notes,
        questions: questions.sort((a, b) => a.number - b.number)
      }
    })

    console.log('📊 Data transformation completed')
    console.log('Parts to create:', transformedParts.length)

    // Create the listening test
    console.log('💾 Creating listening test in database...')
    const listeningTest = await prisma.listeningTest.create({
      data: {
        title: 'IELTS Listening Test',
        audioSource,
        instructions,
        readingTestId: readingTestId || null,
        parts: {
          create: transformedParts.map((part: any) => ({
            index: part.index,
            title: part.title,
            prompt: part.prompt,
            sectionTitle: part.sectionTitle,
            courseRequired: part.courseRequired,
            matchingHeading: part.matchingHeading,
            matchingOptions: part.matchingOptions,
            notesSections: part.notesSections,
            questions: {
              create: part.questions.map((q: any) => ({
                number: q.number,
                type: q.type,
                labelPrefix: q.labelPrefix,
                textPrefix: q.textPrefix,
                textSuffix: q.textSuffix,
                questionText: q.questionText,
                options: q.options,
                matchingLabel: q.matchingLabel,
                correctAnswer: {
                  create: {
                    answer: q.correctAnswer
                  }
                }
              }))
            }
          }))
        }
      },
      include: {
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

    console.log('✅ Listening test created successfully!')

    return NextResponse.json({
      message: 'Listening test created successfully from JSON data',
      listeningTest
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating listening test from JSON:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}

