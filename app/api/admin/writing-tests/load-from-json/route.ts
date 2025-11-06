import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Load-from-JSON API called for writing test')

    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('✅ Authentication passed')

    // Get readingTestId from request body if provided
    let requestReadingTestId: string | undefined
    try {
      const body = await request.json()
      requestReadingTestId = body.readingTestId
    } catch {
      // Request body is empty or invalid, continue
    }

    // Read the JSON file
    const filePath = path.join(process.cwd(), 'app', 'full-exam-writing', 'writing-test-data.json')
    console.log('Reading file from:', filePath)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Writing test JSON file not found. Please create app/full-exam-writing/writing-test-data.json' },
        { status: 404 }
      )
    }

    const fileContents = fs.readFileSync(filePath, 'utf8')
    console.log('File read successfully, length:', fileContents.length)

    const jsonData = JSON.parse(fileContents)
    console.log('JSON parsed successfully')

    const { test, readingTestId: jsonReadingTestId, passages, passageConfigs } = jsonData
    
    // Use readingTestId from request body if provided, otherwise from JSON
    const readingTestId = requestReadingTestId || jsonReadingTestId
    
    console.log('Data extracted:', {
      testTitle: test.title,
      readingTestId,
      passagesCount: passages.length,
      passageConfigsCount: passageConfigs?.length || 0
    })

    // Verify reading test exists
    if (!readingTestId) {
      return NextResponse.json(
        { error: 'readingTestId is required. Please provide it in the request body or in the JSON file.' },
        { status: 400 }
      )
    }

    const readingTest = await prisma.readingTest.findUnique({
      where: { id: readingTestId },
      include: {
        passages: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!readingTest) {
      return NextResponse.json(
        { error: `Reading test with ID ${readingTestId} not found` },
        { status: 404 }
      )
    }

    console.log('✅ Reading test found:', readingTest.title)

    // Transform passages with their questions
    console.log('🔄 Transforming passages...')
    const transformedPassages = passages.map((passage: any, passageIndex: number) => {
      return {
        title: passage.title,
        order: passage.order || passageIndex + 1,
        contents: {
          create: passage.contents?.map((content: any, contentIndex: number) => ({
            contentId: content.contentId || content.id,
            text: content.text,
            order: contentIndex + 1
          })) || []
        },
        questions: {
          create: passage.questions?.map((question: any) => {
            const questionInput: any = {
              questionNumber: question.questionNumber || parseInt(question.number) || 1,
              type: question.type || 'TASK_1',
              questionText: question.questionText || question.text,
              points: question.points || 1
            }

            // Link to reading passage if specified
            if (question.readingPassageId || question.readingPassage) {
              const readingPassageId = question.readingPassageId || question.readingPassage
              // Find reading passage by order or ID
              const readingPassage = readingTest.passages.find(
                (p: any) => p.id === readingPassageId || p.order === parseInt(readingPassageId)
              )
              if (readingPassage) {
                questionInput.readingPassageId = readingPassage.id
              }
            }

            return questionInput
          }) || []
        }
      }
    })

    // Transform passage configs
    const transformedPassageConfigs = passageConfigs?.map((config: any) => ({
      part: config.part,
      total: config.total,
      start: config.start
    })) || []

    console.log('📊 Data transformation completed')
    console.log('Passages to create:', transformedPassages.length)
    console.log('Passage configs to create:', transformedPassageConfigs.length)

    // Create the writing test
    console.log('💾 Creating writing test in database...')
    const writingTest = await prisma.writingTest.create({
      data: {
        title: test.title,
        readingTestId: readingTestId,
        totalTimeMinutes: test.totalTimeMinutes || 60,
        passages: {
          create: transformedPassages
        },
        passageConfigs: {
          create: transformedPassageConfigs
        }
      },
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        },
        passages: {
          include: {
            contents: true,
            questions: {
              include: {
                readingPassage: {
                  select: {
                    id: true,
                    title: true,
                    order: true
                  }
                }
              }
            }
          }
        },
        passageConfigs: true
      }
    })

    console.log('✅ Writing test created successfully!')

    return NextResponse.json({
      message: 'Writing test created successfully from JSON data',
      writingTest
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating writing test from JSON:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}

