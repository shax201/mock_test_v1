import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAllData() {
  console.log('🗑️  Clearing all existing data...')
  
  try {
    // Delete in correct order to avoid foreign key constraints
    await prisma.remedialTestSession.deleteMany({})
    await prisma.remedialTestTemplate.deleteMany({})
    await prisma.mockQuestion.deleteMany({})
    await prisma.mockModule.deleteMany({})
    await prisma.mock.deleteMany({})
    await prisma.questionBank.deleteMany({})
    
    console.log('✅ All data cleared successfully')
  } catch (error) {
    console.error('❌ Error clearing data:', error)
    throw error
  }
}

async function createComprehensiveMockTest() {
  console.log('📝 Creating comprehensive mock test...')
  
  // Find or create an admin user
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  
  if (!adminUser) {
    console.log('👤 Creating admin user...')
    adminUser = await prisma.user.create({
      data: {
        name: 'System Admin',
        email: 'admin@radiance.edu',
        passwordHash: 'dummy-hash',
        role: 'ADMIN'
      }
    })
  }
  
  // Create the mock test
  const mockTest = await prisma.mock.create({
    data: {
      title: 'IELTS Academic Mock Test - Comprehensive',
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

  console.log(`✅ Created mock test: "${mockTest.title}" (ID: ${mockTest.id})`)
  console.log(`🎧 Listening Module: ${listeningModule.id} (${listeningQuestions.length} questions)`)
  console.log(`📖 Reading Module: ${readingModule.id} (${readingQuestions.length} questions)`)
  console.log(`✍️  Writing Module: ${writingModule.id} (0 questions - manual tasks)`)
  
  return { mockTest, adminUser }
}

async function createRemedialTestTemplates(mockTest: any, adminUser: any) {
  console.log('📝 Creating remedial test templates...')
  
  // Template 1: Matching Headings for Reading
  const matchingHeadingsTemplate = await prisma.remedialTestTemplate.create({
    data: {
      title: 'Reading - Matching Headings Practice',
      description: 'Practice matching headings to reading passage sections to improve reading comprehension skills.',
      type: 'MATCHING_HEADINGS',
      module: 'READING',
      difficulty: 'INTERMEDIATE',
      duration: 20,
      mockTestId: mockTest.id,
      isActive: true,
      createdBy: adminUser.id,
      questions: {
        passage: {
          title: 'Climate Change and Renewable Energy',
          sections: [
            {
              id: 'section-1',
              number: 1,
              content: 'Climate change is one of the most pressing issues of our time. The Earth\'s climate has been changing throughout history, but the current rate of change is unprecedented. Scientists have identified human activities as the primary driver of recent climate change, particularly the burning of fossil fuels which releases greenhouse gases into the atmosphere.'
            },
            {
              id: 'section-2', 
              number: 2,
              content: 'The consequences of climate change are far-reaching and include rising global temperatures, melting ice caps, sea level rise, and more frequent extreme weather events. These changes pose significant threats to ecosystems, human health, and economic stability worldwide.'
            },
            {
              id: 'section-3',
              number: 3,
              content: 'Renewable energy sources such as solar, wind, and hydroelectric power offer promising alternatives to fossil fuels. These technologies have become increasingly cost-effective and efficient, making them viable options for large-scale energy production. Many countries have committed to ambitious renewable energy targets as part of their climate action plans.'
            }
          ]
        },
        headings: [
          'A) The Impact of Climate Change',
          'B) The Science Behind Climate Change', 
          'C) Solutions for Climate Change',
          'D) Historical Climate Patterns',
          'E) Economic Benefits of Renewable Energy'
        ],
        correctAnswers: {
          'section-1': 'B',
          'section-2': 'A', 
          'section-3': 'C'
        },
        instructions: 'Choose the correct heading for each section. There are more headings than sections, so you will not use all of them.'
      }
    }
  })

  // Template 2: Information Matching for Reading
  const informationMatchingTemplate = await prisma.remedialTestTemplate.create({
    data: {
      title: 'Reading - Information Matching Practice',
      description: 'Practice matching statements to specific sections of a reading passage to improve information location skills.',
      type: 'INFORMATION_MATCHING',
      module: 'READING',
      difficulty: 'INTERMEDIATE',
      duration: 25,
      mockTestId: mockTest.id,
      isActive: true,
      createdBy: adminUser.id,
      questions: {
        passage: {
          title: 'The Science of Photosynthesis',
          sections: [
            {
              id: 'section-1',
              number: 1,
              content: 'Photosynthesis is the fundamental process by which plants convert light energy into chemical energy. This remarkable biological mechanism not only sustains plant life but also provides the foundation for most ecosystems on Earth. The process occurs primarily in the chloroplasts of plant cells, where specialized pigments capture sunlight and transform it into usable energy.'
            },
            {
              id: 'section-2',
              number: 2,
              content: 'The process begins when chlorophyll and other pigments absorb photons from sunlight. This energy is then used to split water molecules, releasing oxygen as a byproduct and generating electrons that power the synthesis of glucose. The entire process can be summarized by the equation: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂.'
            },
            {
              id: 'section-3',
              number: 3,
              content: 'Plants have evolved sophisticated mechanisms to optimize photosynthesis under various environmental conditions. They can adjust the orientation of their leaves to maximize light absorption, regulate the opening and closing of stomata to control gas exchange, and modify their pigment composition to adapt to different light intensities and wavelengths.'
            }
          ]
        },
        statements: [
          'A) Plants can adjust their leaf orientation for better light absorption',
          'B) Photosynthesis occurs in chloroplasts',
          'C) The process releases oxygen as a byproduct',
          'D) Plants can modify their pigment composition',
          'E) Photosynthesis provides energy for most ecosystems',
          'F) Water molecules are split during the process'
        ],
        correctAnswers: {
          'A': 'section-3',
          'B': 'section-1',
          'C': 'section-2',
          'D': 'section-3',
          'E': 'section-1',
          'F': 'section-2'
        },
        instructions: 'Match each statement to the correct section of the passage. Each section may be used more than once.'
      }
    }
  })

  // Template 3: Multiple Choice for Listening
  const listeningMultipleChoiceTemplate = await prisma.remedialTestTemplate.create({
    data: {
      title: 'Listening - Multiple Choice Practice',
      description: 'Practice multiple choice questions for listening comprehension to improve audio processing skills.',
      type: 'MULTIPLE_CHOICE',
      module: 'LISTENING',
      difficulty: 'INTERMEDIATE',
      duration: 15,
      mockTestId: mockTest.id,
      isActive: true,
      createdBy: adminUser.id,
      questions: {
        audioFile: '/uploads/audio/sample-listening.mp3',
        questions: [
          {
            id: 'q1',
            content: 'What is the main topic of the conversation?',
            options: [
              'A) Weather forecast',
              'B) Travel arrangements', 
              'C) Work schedule',
              'D) Family reunion'
            ],
            correctAnswer: 'B',
            audioStartTime: 0,
            audioEndTime: 30
          },
          {
            id: 'q2',
            content: 'When is the flight scheduled to depart?',
            options: [
              'A) 8:30 AM',
              'B) 9:15 AM',
              'C) 10:00 AM', 
              'D) 11:30 AM'
            ],
            correctAnswer: 'C',
            audioStartTime: 30,
            audioEndTime: 60
          }
        ],
        instructions: 'Listen to the audio and choose the correct answer A, B, C or D for each question.'
      }
    }
  })

  // Template 4: Fill in the Blank for Reading
  const fillInBlankTemplate = await prisma.remedialTestTemplate.create({
    data: {
      title: 'Reading - Fill in the Blank Practice',
      description: 'Practice completing sentences with missing words to improve vocabulary and reading comprehension.',
      type: 'FIB',
      module: 'READING',
      difficulty: 'INTERMEDIATE',
      duration: 20,
      mockTestId: mockTest.id,
      isActive: true,
      createdBy: adminUser.id,
      questions: {
        passage: {
          title: 'Ecosystem Balance and Environmental Conservation',
          content: 'Ecosystems are complex networks of living organisms and their physical environment, functioning as integrated units that maintain ecological balance. The health of these systems depends on intricate relationships between species, nutrient cycles, and environmental factors. Each component plays a crucial role in maintaining the overall stability and productivity of the ecosystem.'
        },
        questions: [
          {
            id: 'q1',
            content: 'The _____ system is responsible for transporting nutrients throughout the plant.',
            correctAnswer: 'vascular',
            wordLimit: 1
          },
          {
            id: 'q2', 
            content: 'The process of photosynthesis converts _____ into glucose using sunlight.',
            correctAnswer: 'carbon dioxide',
            wordLimit: 2
          }
        ],
        instructions: 'Complete the sentences using words from the passage. Pay attention to the word limit for each answer.'
      }
    }
  })

  // Template 5: True/False/Not Given for Reading
  const trueFalseTemplate = await prisma.remedialTestTemplate.create({
    data: {
      title: 'Reading - True/False/Not Given Practice',
      description: 'Practice identifying whether statements are true, false, or not given based on the reading passage.',
      type: 'TRUE_FALSE_NOT_GIVEN',
      module: 'READING',
      difficulty: 'ADVANCED',
      duration: 25,
      mockTestId: mockTest.id,
      isActive: true,
      createdBy: adminUser.id,
      questions: {
        passage: {
          title: 'Biodiversity and Ecosystem Stability',
          content: 'Biodiversity plays a crucial role in maintaining ecosystem stability. A diverse ecosystem is more resilient to environmental changes and better able to recover from disturbances. Each species occupies a specific niche, contributing to the overall functioning of the system. The loss of even a single species can have cascading effects throughout the entire ecosystem. Human activities have significantly impacted ecosystems worldwide through habitat destruction, pollution, overexploitation of resources, and the introduction of invasive species.'
        },
        statements: [
          {
            id: 's1',
            content: 'Biodiversity is essential for ecosystem stability.',
            correctAnswer: 'TRUE'
          },
          {
            id: 's2',
            content: 'All species have equal importance in an ecosystem.',
            correctAnswer: 'FALSE'
          },
          {
            id: 's3',
            content: 'The loss of one species always leads to ecosystem collapse.',
            correctAnswer: 'FALSE'
          },
          {
            id: 's4',
            content: 'Human activities are the only threat to biodiversity.',
            correctAnswer: 'FALSE'
          }
        ],
        instructions: 'Read the passage and decide if each statement is TRUE, FALSE, or NOT GIVEN.'
      }
    }
  })

  console.log('✅ Created 5 remedial test templates:')
  console.log(`   📖 ${matchingHeadingsTemplate.title}`)
  console.log(`   📖 ${informationMatchingTemplate.title}`)
  console.log(`   🎧 ${listeningMultipleChoiceTemplate.title}`)
  console.log(`   📝 ${fillInBlankTemplate.title}`)
  console.log(`   ✅ ${trueFalseTemplate.title}`)

  return [
    matchingHeadingsTemplate,
    informationMatchingTemplate,
    listeningMultipleChoiceTemplate,
    fillInBlankTemplate,
    trueFalseTemplate
  ]
}

async function main() {
  try {
    console.log('🚀 Setting up complete IELTS Mock Test System...')
    console.log('')
    
    // Clear all existing data
    await clearAllData()
    
    // Create comprehensive mock test
    const { mockTest, adminUser } = await createComprehensiveMockTest()
    console.log('')
    
    // Create remedial test templates
    const templates = await createRemedialTestTemplates(mockTest, adminUser)
    console.log('')
    
    console.log('🎉 Complete system setup finished successfully!')
    console.log('')
    console.log('📊 Summary:')
    console.log(`   🎯 Mock Test: "${mockTest.title}"`)
    console.log(`   📝 Remedial Templates: ${templates.length}`)
    console.log(`   👤 Admin User: ${adminUser.email}`)
    console.log('')
    console.log('✨ You can now:')
    console.log('   • Access admin panel: /admin')
    console.log('   • View mock tests: /admin/mocks')
    console.log('   • Manage remedial tests: /admin/remedial-tests')
    console.log('   • Student portal: /student')
    console.log('   • Take remedial tests: /student/remedial-tests')
    console.log('')
    console.log('🔑 Default admin credentials:')
    console.log('   Email: admin@radiance.edu')
    console.log('   Password: admin123')
    
  } catch (error) {
    console.error('❌ Error during system setup:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
main()
