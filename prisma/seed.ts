import { PrismaClient, UserRole, ReadingQuestionType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@radiance.edu' },
    update: {},
    create: {
      email: 'admin@radiance.edu',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  })

  // Create instructor user
  const instructorPassword = await bcrypt.hash('instructor123', 12)

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@radiance.edu' },
    update: {},
    create: {
      email: 'instructor@radiance.edu',
      passwordHash: instructorPassword,
      role: UserRole.INSTRUCTOR,
    },
  })

  // Create sample reading test
  const readingTest = await prisma.readingTest.create({
    data: {
      title: 'IELTS Reading Practice Test',
      totalQuestions: 40,
      totalTimeMinutes: 60,
      isActive: true,
      bandScoreRanges: {
        create: [
          { minScore: 39, band: 9.0 },
          { minScore: 37, band: 8.5 },
          { minScore: 35, band: 8.0 },
          { minScore: 33, band: 7.5 },
          { minScore: 30, band: 7.0 },
          { minScore: 27, band: 6.5 },
          { minScore: 23, band: 6.0 },
          { minScore: 19, band: 5.5 },
          { minScore: 15, band: 5.0 },
          { minScore: 13, band: 4.5 },
          { minScore: 10, band: 4.0 },
          { minScore: 7, band: 3.5 },
          { minScore: 4, band: 3.0 },
          { minScore: 3, band: 2.5 },
          { minScore: 1, band: 2.0 },
          { minScore: 0, band: 0.0 }
        ]
      },
      passageConfigs: {
        create: [
          { part: 1, total: 13, start: 1 },
          { part: 2, total: 13, start: 14 },
          { part: 3, total: 14, start: 27 }
        ]
      }
    }
  })

  // Create passages
  const passage1 = await prisma.passage.create({
    data: {
      readingTestId: readingTest.id,
      title: 'The History of Pearls',
      order: 1,
      contents: {
        create: [
          {
            contentId: 'A',
            text: 'Pearls have long been considered one of the most precious jewels, and throughout history they have been a symbol of wealth, power and status.',
            order: 1
          },
          {
            contentId: 'B',
            text: 'There are three main types of pearls: natural, cultured and imitation.',
            order: 2
          }
        ]
      }
    }
  })

  // Create questions for passage 1
  const question5 = await prisma.question.create({
    data: {
      passageId: passage1.id,
      questionNumber: 5,
      type: ReadingQuestionType.SUMMARY_COMPLETION,
      questionText: 'Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
      summaryText: 'In history, pearls have had great importance within the men of wealth and power, which were treated as gems for women in [5]. Also, pearls were even used as a medicine for people in [6]. There are essentially three types of pearls: natural, cultured and imitation. Most freshwater cultured pearls sold today come from China while [7] Island is famous for its imitation pearl industry.',
      subQuestions: ['5', '6', '7']
    }
  })

  // Create correct answers
  await prisma.correctAnswer.create({
    data: {
      questionId: question5.id,
      answer: 'ancient Rome'
    }
  })

  console.log('Seeded users and sample reading test:', { admin, instructor, readingTest })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
