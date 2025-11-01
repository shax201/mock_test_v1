import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Configuration: Number of mock tests to create
const NUMBER_OF_TESTS = 5

// Configuration: Whether to clear existing tests before creating new ones
const CLEAR_EXISTING_TESTS = true

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

async function createComprehensiveMockTest(testNumber: number = 1) {
  const testSuffix = NUMBER_OF_TESTS > 1 ? ` - Test ${testNumber}` : ''
  console.log(`📝 Creating comprehensive mock test ${testNumber}...`)
  
  // First, find or create an admin user
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  
  if (!adminUser) {
    console.log('👤 Creating admin user...')
    adminUser = await prisma.user.create({
      data: {
        name: 'System Admin',
        email: 'admin@ielts-mock.com',
        passwordHash: 'dummy-hash',
        role: 'ADMIN'
      }
    })
  }
  
  // Create the mock test
  const mockTest = await prisma.mock.create({
    data: {
      title: `IELTS Academic Mock Test - Comprehensive${testSuffix}`,
      description: 'A complete IELTS Academic mock test with all question types and comprehensive content',
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
<p>The consequences of climate change are far-reaching and include rising global temperatures, melting ice caps, sea level rise, and more frequent extreme weather events. These changes pose significant threats to ecosystems, human health, and economic stability worldwide.</p>
<p>Renewable energy sources such as solar, wind, and hydroelectric power offer promising alternatives to fossil fuels. These technologies have become increasingly cost-effective and efficient, making them viable options for large-scale energy production. Many countries have committed to ambitious renewable energy targets as part of their climate action plans.</p>`,
        part2: `<p><strong>The Science of Photosynthesis</strong></p>
<p>Photosynthesis is the fundamental process by which plants convert light energy into chemical energy. This remarkable biological mechanism not only sustains plant life but also provides the foundation for most ecosystems on Earth. The process occurs primarily in the chloroplasts of plant cells, where specialized pigments capture sunlight and transform it into usable energy.</p>
<p>The process begins when chlorophyll and other pigments absorb photons from sunlight. This energy is then used to split water molecules, releasing oxygen as a byproduct and generating electrons that power the synthesis of glucose. The entire process can be summarized by the equation: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂.</p>
<p>Plants have evolved sophisticated mechanisms to optimize photosynthesis under various environmental conditions. They can adjust the orientation of their leaves to maximize light absorption, regulate the opening and closing of stomata to control gas exchange, and modify their pigment composition to adapt to different light intensities and wavelengths.</p>`,
        part3: `<p><strong>Ecosystem Balance and Environmental Conservation</strong></p>
<p>Ecosystems are complex networks of living organisms and their physical environment, functioning as integrated units that maintain ecological balance. The health of these systems depends on intricate relationships between species, nutrient cycles, and environmental factors. Each component plays a crucial role in maintaining the overall stability and productivity of the ecosystem.</p>
<p>Biodiversity plays a crucial role in maintaining ecosystem stability. A diverse ecosystem is more resilient to environmental changes and better able to recover from disturbances. Each species occupies a specific niche, contributing to the overall functioning of the system. The loss of even a single species can have cascading effects throughout the entire ecosystem.</p>
<p>Human activities have significantly impacted ecosystems worldwide through habitat destruction, pollution, overexploitation of resources, and the introduction of invasive species. Conservation efforts focus on protecting critical habitats, restoring degraded ecosystems, and implementing sustainable management practices. These initiatives require international cooperation and long-term commitment to ensure the preservation of Earth's biological diversity for future generations.</p>`
      }
    }
  })

  console.log(`✅ Created reading module with comprehensive passage content`)

  // Create Writing Module
  const writingModule = await prisma.mockModule.create({
    data: {
      mockId: mockTest.id,
      type: 'WRITING',
      durationMinutes: 60,
      instructions: 'You will be given two writing tasks to complete.',
      order: 3,
    }
  })


  // Comprehensive listening questions
  const listeningQuestions = [
    // Part 1 - Multiple Choice
    {
      type: 'MULTIPLE_CHOICE',
      content: 'What is the main topic of the conversation?',
      options: ['A) Weather forecast', 'B) Travel arrangements', 'C) Work schedule', 'D) Family reunion'],
      correctAnswer: 'B',
      points: 1,
      part: 1,
      instructions: 'Choose the correct answer A, B, C or D.'
    },
    {
      type: 'MULTIPLE_CHOICE',
      content: 'When is the flight scheduled to depart?',
      options: ['A) 8:30 AM', 'B) 9:15 AM', 'C) 10:00 AM', 'D) 11:30 AM'],
      correctAnswer: 'C',
      points: 1,
      part: 1,
      instructions: 'Choose the correct answer A, B, C or D.'
    },
    
    // Part 2 - Notes Completion
    {
      type: 'NOTES_COMPLETION',
      content: 'Complete the notes below using NO MORE THAN THREE WORDS for each answer.',
      correctAnswer: 'conference room',
      points: 1,
      part: 2,
      instructions: 'Write your answers in the spaces provided.'
    },
    {
      type: 'NOTES_COMPLETION',
      content: 'The meeting will be held in the _____ on the third floor.',
      correctAnswer: 'main auditorium',
      points: 1,
      part: 2,
      instructions: 'Write your answers in the spaces provided.'
    },
    
    // Part 3 - True/False/Not Given
    {
      type: 'TRUE_FALSE_NOT_GIVEN',
      content: 'The speaker mentions that the meeting will be postponed.',
      correctAnswer: 'TRUE',
      points: 1,
      part: 3,
      instructions: 'Write TRUE, FALSE or NOT GIVEN.'
    },
    {
      type: 'TRUE_FALSE_NOT_GIVEN',
      content: 'All participants must bring their laptops.',
      correctAnswer: 'FALSE',
      points: 1,
      part: 3,
      instructions: 'Write TRUE, FALSE or NOT GIVEN.'
    }
  ]

  // Comprehensive reading questions
  const readingQuestions = [
    // Part 1 - Multiple Choice
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
      type: 'MULTIPLE_CHOICE',
      content: 'The author suggests that renewable energy is:',
      options: ['A) Too expensive', 'B) The best solution', 'C) Not reliable', 'D) Still experimental'],
      correctAnswer: 'B',
      points: 1,
      part: 1,
      instructions: 'Choose the correct answer A, B, C or D.'
    },
    
    // Part 2 - Fill in the Blank
    {
      type: 'FIB',
      content: 'The process of photosynthesis converts _____ into glucose using sunlight.',
      correctAnswer: 'carbon dioxide',
      points: 1,
      part: 2,
      instructions: 'Write your answer in the space provided.'
    },
    {
      type: 'FIB',
      content: 'The _____ system is responsible for transporting nutrients throughout the plant.',
      correctAnswer: 'vascular',
      points: 1,
      part: 2,
      instructions: 'Write your answer in the space provided.'
    },
    
    // Part 3 - True/False/Not Given
    {
      type: 'TRUE_FALSE_NOT_GIVEN',
      content: 'The author suggests that renewable energy is the only solution to environmental problems.',
      correctAnswer: 'NOT_GIVEN',
      points: 1,
      part: 3,
      instructions: 'Write TRUE, FALSE or NOT GIVEN.'
    },
    {
      type: 'TRUE_FALSE_NOT_GIVEN',
      content: 'Climate change affects all regions equally.',
      correctAnswer: 'FALSE',
      points: 1,
      part: 3,
      instructions: 'Write TRUE, FALSE or NOT GIVEN.'
    },
    
    // Part 3 - Summary Completion
    {
      type: 'SUMMARY_COMPLETION',
      content: 'Complete the summary below using words from the passage.',
      correctAnswer: 'ecosystem',
      points: 1,
      part: 3,
      instructions: 'Choose NO MORE THAN TWO WORDS from the passage for each answer.'
    },
    {
      type: 'SUMMARY_COMPLETION',
      content: 'The _____ plays a crucial role in maintaining environmental balance.',
      correctAnswer: 'carbon cycle',
      points: 1,
      part: 3,
      instructions: 'Choose NO MORE THAN TWO WORDS from the passage for each answer.'
    }
  ]

  // Create question bank entries and mock questions for listening
  for (let i = 0; i < listeningQuestions.length; i++) {
    const question = listeningQuestions[i]
    
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
  }

  // Create question bank entries and mock questions for reading
  for (let i = 0; i < readingQuestions.length; i++) {
    const question = readingQuestions[i]
    
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
  }

  console.log('✅ Comprehensive mock test created successfully!')
  console.log(`📊 Mock Test ID: ${mockTest.id}`)
  console.log(`🎧 Listening Module: ${listeningModule.id} (${listeningQuestions.length} questions)`)
  console.log(`📖 Reading Module: ${readingModule.id} (${readingQuestions.length} questions)`)
  console.log(`✍️  Writing Module: ${writingModule.id} (0 questions - manual tasks)`)
  
  return mockTest
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive mock test creation...')
    console.log(`📊 Configuration: Creating ${NUMBER_OF_TESTS} mock test(s)`)
    
    // Clear all existing data if configured
    if (CLEAR_EXISTING_TESTS) {
      await clearAllMockTests()
    }
    
    // Create multiple comprehensive mock tests
    const createdMockTests = []
    for (let i = 1; i <= NUMBER_OF_TESTS; i++) {
      console.log(`\n🔄 Creating mock test ${i} of ${NUMBER_OF_TESTS}...`)
      const mockTest = await createComprehensiveMockTest(i)
      createdMockTests.push(mockTest)
      console.log(`✅ Mock test ${i} created successfully!`)
    }
    
    console.log('\n🎉 All comprehensive mock tests creation completed successfully!')
    console.log(`📊 Total created: ${createdMockTests.length} mock test(s)`)
    console.log(`🔗 You can now access the mock tests in the admin panel`)
    console.log('\n📝 Created Mock Tests:')
    createdMockTests.forEach((mockTest, index) => {
      console.log(`   ${index + 1}. "${mockTest.title}" (ID: ${mockTest.id})`)
    })
    
  } catch (error) {
    console.error('❌ Error during comprehensive mock test creation:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
main()
