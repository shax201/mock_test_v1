import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAllMockTests() {
  console.log('🗑️  Clearing all existing mock tests and questions...')
  
  try {
    // Delete in correct order to avoid foreign key constraints
    const deletedQuestions = await prisma.mockQuestion.deleteMany({})
    const deletedModules = await prisma.mockModule.deleteMany({})
    const deletedMocks = await prisma.mock.deleteMany({})
    const deletedQuestionBanks = await prisma.questionBank.deleteMany({})
    
    console.log(`✅ Cleared: ${deletedQuestions.count} questions, ${deletedModules.count} modules, ${deletedMocks.count} mocks, ${deletedQuestionBanks.count} question banks`)
  } catch (error) {
    console.error('❌ Error clearing mock tests:', error)
    throw error
  }
}

async function createSampleMockTest() {
  console.log('📝 Creating sample mock test...')
  
  // First, find or create an admin user
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  
  if (!adminUser) {
    console.log('👤 Creating admin user...')
    try {
      adminUser = await prisma.user.create({
        data: {
          name: 'System Admin',
          email: 'admin@ielts-mock.com',
          passwordHash: 'dummy-hash', // This is just for seeding
          role: 'ADMIN'
        }
      })
      console.log(`✅ Admin user created: ${adminUser.email}`)
    } catch (error) {
      console.error('❌ Error creating admin user:', error)
      throw error
    }
  } else {
    console.log(`✅ Using existing admin user: ${adminUser.email}`)
  }
  
  // Create the mock test
  const mockTest = await prisma.mock.create({
    data: {
      title: 'IELTS Academic Mock Test - Sample',
      description: 'A comprehensive IELTS Academic mock test with listening and reading modules',
      createdBy: adminUser.id,
    }
  })

  // Create Listening Module
  const listeningModule = await prisma.mockModule.create({
    data: {
      mockId: mockTest.id,
      type: 'LISTENING',
      durationMinutes: 40,
      instructions: 'You will hear a number of different recordings and you will have to answer questions on what you hear.',
      order: 1,
    }
  })

  // Create Reading Module with passage content
  console.log('📄 Creating reading module...')
  const readingModule = await prisma.mockModule.create({
    data: {
      mockId: mockTest.id,
      type: 'READING',
      durationMinutes: 60,
      instructions: 'You should spend about 20 minutes on each passage.',
      order: 2,
      passageContent: {
        part1: `<p><strong>Climate Change and Renewable Energy</strong></p>
<p>Climate change is one of the most pressing issues of our time. The Earth's climate has been changing throughout history, but the current rate of change is unprecedented. Scientists have identified human activities as the primary driver of recent climate change, particularly the burning of fossil fuels which releases greenhouse gases into the atmosphere.</p>
<p>The consequences of climate change are far-reaching and include rising global temperatures, melting ice caps, sea level rise, and more frequent extreme weather events. These changes pose significant threats to ecosystems, human health, and economic stability worldwide.</p>`,
        part2: `<p><strong>The Science of Photosynthesis</strong></p>
<p>Photosynthesis is the fundamental process by which plants convert light energy into chemical energy. This remarkable biological mechanism not only sustains plant life but also provides the foundation for most ecosystems on Earth. The process occurs primarily in the chloroplasts of plant cells, where specialized pigments capture sunlight and transform it into usable energy.</p>
<p>The process begins when chlorophyll and other pigments absorb photons from sunlight. This energy is then used to split water molecules, releasing oxygen as a byproduct and generating electrons that power the synthesis of glucose.</p>`,
        part3: `<p><strong>Ecosystem Balance and Environmental Conservation</strong></p>
<p>Ecosystems are complex networks of living organisms and their physical environment, functioning as integrated units that maintain ecological balance. The health of these systems depends on intricate relationships between species, nutrient cycles, and environmental factors.</p>
<p>Biodiversity plays a crucial role in maintaining ecosystem stability. A diverse ecosystem is more resilient to environmental changes and better able to recover from disturbances. Each species occupies a specific niche, contributing to the overall functioning of the system.</p>`
      }
    }
  })

  console.log(`✅ Created reading module with sample passage content`)

  // Create sample listening questions
  const listeningQuestions = [
    {
      type: 'MULTIPLE_CHOICE',
      content: 'What is the main topic of the conversation?',
      options: ['A) Weather', 'B) Travel plans', 'C) Work schedule', 'D) Family visit'],
      correctAnswer: 'B',
      points: 1,
      part: 1,
      instructions: 'Choose the correct answer A, B, C or D.'
    },
    {
      type: 'NOTES_COMPLETION',
      content: 'Complete the notes below using NO MORE THAN THREE WORDS for each answer.',
      correctAnswer: 'conference room',
      points: 1,
      part: 1,
      instructions: 'Write your answers in the spaces provided.'
    },
    {
      type: 'TRUE_FALSE_NOT_GIVEN',
      content: 'The speaker mentions that the meeting will be postponed.',
      correctAnswer: 'TRUE',
      points: 1,
      part: 2,
      instructions: 'Write TRUE, FALSE or NOT GIVEN.'
    }
  ]

  // Create sample reading questions
  const readingQuestions = [
    {
      type: 'MULTIPLE_CHOICE',
      content: 'According to the passage, what is the primary cause of climate change?',
      options: ['A) Natural cycles', 'B) Human activities', 'C) Solar radiation', 'D) Ocean currents'],
      correctAnswer: 'B',
      points: 1,
      part: 1,
      instructions: 'Choose the correct answer A, B, C or D.'
    },
    {
      type: 'FIB',
      content: 'The process of photosynthesis converts _____ into glucose using sunlight.',
      correctAnswer: 'carbon dioxide',
      points: 1,
      part: 1,
      instructions: 'Write your answer in the space provided.'
    },
    {
      type: 'TRUE_FALSE_NOT_GIVEN',
      content: 'The author suggests that renewable energy is the only solution to environmental problems.',
      correctAnswer: 'NOT_GIVEN',
      points: 1,
      part: 2,
      instructions: 'Write TRUE, FALSE or NOT GIVEN.'
    },
    {
      type: 'SUMMARY_COMPLETION',
      content: 'Complete the summary below using words from the passage.',
      correctAnswer: 'ecosystem',
      points: 1,
      part: 3,
      instructions: 'Choose NO MORE THAN TWO WORDS from the passage for each answer.'
    }
  ]

  // Create question bank entries and mock questions for listening
  console.log(`📝 Creating ${listeningQuestions.length} listening questions...`)
  for (let i = 0; i < listeningQuestions.length; i++) {
    const question = listeningQuestions[i]
    
    try {
      const questionBank = await prisma.questionBank.create({
        data: {
          type: question.type as any,
          contentJson: {
            content: question.content,
            options: question.options || [],
            instructions: question.instructions,
            type: question.type,
            part: question.part || 1
          },
          reusable: false
        }
      })

      await prisma.mockQuestion.create({
        data: {
          moduleId: listeningModule.id,
          questionBankId: questionBank.id,
          order: i + 1,
          points: question.points,
          correctAnswerJson: question.correctAnswer
        }
      })
      
      console.log(`  ✅ Created listening question ${i + 1}: ${question.type}`)
    } catch (error) {
      console.error(`❌ Error creating listening question ${i + 1}:`, error)
      throw error
    }
  }

  // Create question bank entries and mock questions for reading
  console.log(`📝 Creating ${readingQuestions.length} reading questions...`)
  for (let i = 0; i < readingQuestions.length; i++) {
    const question = readingQuestions[i]
    
    try {
      const questionBank = await prisma.questionBank.create({
        data: {
          type: question.type as any,
          contentJson: {
            content: question.content,
            options: question.options || [],
            instructions: question.instructions,
            type: question.type,
            part: question.part || 1
          },
          reusable: false
        }
      })

      await prisma.mockQuestion.create({
        data: {
          moduleId: readingModule.id,
          questionBankId: questionBank.id,
          order: i + 1,
          points: question.points,
          correctAnswerJson: question.correctAnswer
        }
      })
      
      console.log(`  ✅ Created reading question ${i + 1}: ${question.type}`)
    } catch (error) {
      console.error(`❌ Error creating reading question ${i + 1}:`, error)
      throw error
    }
  }

  console.log('✅ Sample mock test created successfully!')
  console.log(`📊 Mock Test ID: ${mockTest.id}`)
  console.log(`🎧 Listening Module: ${listeningModule.id} (${listeningQuestions.length} questions)`)
  console.log(`📖 Reading Module: ${readingModule.id} (${readingQuestions.length} questions)`)
  
  return mockTest
}

async function main() {
  try {
    console.log('🚀 Starting mock test reset and seed process...')
    console.log('⏰ Started at:', new Date().toISOString())
    
    // Clear all existing data
    await clearAllMockTests()
    
    // Create new sample mock test
    const mockTest = await createSampleMockTest()
    
    console.log('🎉 Mock test reset and seed completed successfully!')
    console.log(`🔗 You can now access the mock test in the admin panel`)
    console.log(`📝 Mock Test: "${mockTest.title}"`)
    console.log('⏰ Completed at:', new Date().toISOString())
    
  } catch (error) {
    console.error('❌ Error during mock test reset and seed:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  } finally {
    try {
      await prisma.$disconnect()
      console.log('🔌 Database connection closed')
    } catch (disconnectError) {
      console.error('❌ Error disconnecting from database:', disconnectError)
    }
  }
}

// Run the script
main()
