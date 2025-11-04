import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  console.log('Seeding reading test data...')

  // Read the JSON file
  const dataPath = path.join(__dirname, '../app/full-exam-reading/reading-test-data.json')
  const rawData = fs.readFileSync(dataPath, 'utf-8')
  const testData = JSON.parse(rawData)

  // Create the reading test
  const readingTest = await prisma.readingTest.create({
    data: {
      title: testData.test.title,
      totalQuestions: testData.test.totalQuestions,
      totalTimeMinutes: testData.test.totalTimeMinutes,
      isActive: true
    }
  })

  console.log(`Created reading test: ${readingTest.title}`)

  // Create passages
  for (const [index, passage] of testData.passages.entries()) {
    const createdPassage = await prisma.passage.create({
      data: {
        readingTestId: readingTest.id,
        title: passage.title,
        order: index + 1
      }
    })

    console.log(`Created passage: ${createdPassage.title}`)

    // Create passage content
    for (const [contentIndex, content] of passage.content.entries()) {
      await prisma.passageContent.create({
        data: {
          passageId: createdPassage.id,
          contentId: content.id,
          text: content.text,
          order: contentIndex + 1
        }
      })
    }

    console.log(`Created ${passage.content.length} content segments for passage: ${createdPassage.title}`)
  }

  // Create questions
  for (const [questionId, question] of Object.entries(testData.questions)) {
    const questionData = question as any
    const passage = await prisma.passage.findFirst({
      where: {
        readingTestId: readingTest.id,
        title: testData.passages[questionData.passageId - 1]?.title
      }
    })

    if (!passage) {
      console.error(`Passage not found for question ${questionId}`)
      continue
    }

    const createdQuestion = await prisma.question.create({
      data: {
        passageId: passage.id,
        questionNumber: parseInt(questionId),
        type: questionData.type.replace(/-/g, '_').toUpperCase(),
        questionText: questionData.questionText,
        options: questionData.options ? JSON.stringify(questionData.options) : undefined,
        headingsList: questionData.headingsList ? JSON.stringify(questionData.headingsList) : undefined,
        summaryText: questionData.summaryText || null,
        points: 1
      }
    })

    // Create correct answer
    const correctAnswer = testData.correctAnswers[questionId]
    if (correctAnswer) {
      await prisma.correctAnswer.create({
        data: {
          questionId: createdQuestion.id,
          answer: correctAnswer
        }
      })
    }

    console.log(`Created question ${questionId}: ${createdQuestion.questionText.substring(0, 50)}...`)
  }

  // Create band score ranges
  for (const range of testData.bandCalculation.ranges) {
    await prisma.bandScoreRange.create({
      data: {
        readingTestId: readingTest.id,
        minScore: range.minScore,
        band: range.band
      }
    })
  }

  console.log(`Created ${testData.bandCalculation.ranges.length} band score ranges`)

  console.log('Reading test data seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
