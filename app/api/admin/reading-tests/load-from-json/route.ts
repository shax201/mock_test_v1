import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Load-from-JSON API called')

    const token = request.cookies.get('auth-token')?.value
    console.log('Token present:', !!token)

    if (!token) {
      console.log('❌ No token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    console.log('JWT payload:', payload ? { role: payload.role, email: payload.email } : null)

    if (!payload || payload.role !== 'ADMIN') {
      console.log('❌ Forbidden - not admin or invalid token')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('✅ Authentication passed')

    // Read the JSON file
    const filePath = path.join(process.cwd(), 'app', 'full-exam-reading', 'reading-test-data.json')
    console.log('Reading file from:', filePath)

    const fileContents = fs.readFileSync(filePath, 'utf8')
    console.log('File read successfully, length:', fileContents.length)

    const jsonData = JSON.parse(fileContents)
    console.log('JSON parsed successfully')

    const { test, passages, questions, correctAnswers, bandCalculation } = jsonData
    console.log('Data extracted:', {
      testTitle: test.title,
      passagesCount: passages.length,
      questionsCount: Object.keys(questions).length,
      answersCount: Object.keys(correctAnswers).length
    })

    // Transform passages with their questions
    console.log('🔄 Transforming passages...')
    const transformedPassages = passages.map((passage: any, passageIndex: number) => {
      // Get questions for this passage
      const passageQuestions = Object.keys(questions)
        .filter(key => questions[key].passageId === passage.id)
        .map(key => ({
          questionKey: key,
          ...questions[key]
        }))

      return {
        title: passage.title,
        order: passageIndex + 1,
        contents: {
          create: passage.content.map((content: any, contentIndex: number) => ({
            contentId: content.id,
            text: content.text,
            order: contentIndex + 1
          }))
        },
        questions: {
          create: passageQuestions.map((questionData: any) => ({
            questionNumber: parseInt(questionData.questionKey),
            type: transformQuestionType(questionData.type),
            questionText: questionData.questionText,
            options: questionData.options,
            headingsList: questionData.headingsList,
            summaryText: questionData.summaryText,
            subQuestions: questionData.subQuestions,
            points: 1,
            correctAnswer: {
              create: {
                answer: correctAnswers[questionData.questionKey]
              }
            }
          }))
        }
      }
    })

    // Transform band score ranges
    const transformedBandScoreRanges = bandCalculation.ranges.map((range: any) => ({
      minScore: range.minScore,
      band: range.band
    }))

    console.log('📊 Data transformation completed')
    console.log('Passages to create:', transformedPassages.length)
    console.log('Band ranges to create:', transformedBandScoreRanges.length)

    // Create the reading test
    console.log('💾 Creating reading test in database...')
    const readingTest = await prisma.readingTest.create({
      data: {
        title: test.title,
        totalQuestions: test.totalQuestions,
        totalTimeMinutes: test.totalTimeMinutes,
        passages: {
          create: transformedPassages
        },
        bandScoreRanges: {
          create: transformedBandScoreRanges
        }
      },
      include: {
        passages: {
          include: {
            questions: {
              include: {
                correctAnswer: true
              }
            },
            contents: true
          }
        },
        bandScoreRanges: true
      }
    })

    console.log('✅ Reading test created successfully!')

    return NextResponse.json({
      message: 'Reading test created successfully from JSON data',
      readingTest
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating reading test from JSON:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', errorMessage)
    console.error('Error stack:', errorStack)
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// Helper function to transform question types
function transformQuestionType(type: string): string {
  switch (type) {
    case 'matching-headings':
      return 'MATCHING_HEADINGS'
    case 'true-false-not-given':
      return 'TRUE_FALSE_NOT_GIVEN'
    case 'summary-completion':
      return 'SUMMARY_COMPLETION'
    case 'multiple-choice':
      return 'MULTIPLE_CHOICE'
    default:
      return type.toUpperCase().replace(/-/g, '_')
  }
}
