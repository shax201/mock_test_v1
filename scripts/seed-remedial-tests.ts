#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Sample remedial test data
const remedialTestData = [
  // Multiple Choice Listening Tests
  {
    title: "Listening Comprehension - Multiple Choice",
    description: "Practice listening skills with multiple choice questions based on audio content",
    type: "MULTIPLE_CHOICE",
    module: "LISTENING",
    difficulty: "INTERMEDIATE",
    duration: 15,
    questions: [
      {
        id: "q1",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswers: { "0": "Option A" },
        correctAnswer: "Option A",
        instructions: "Listen to the audio and choose the correct answer."
      },
      {
        id: "q2", 
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswers: { "0": "Option C" },
        correctAnswer: "Option C",
        instructions: "Listen carefully and select the best answer."
      },
      {
        id: "q3",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswers: { "0": "Option B" },
        correctAnswer: "Option B",
        instructions: "Pay attention to details in the audio."
      }
    ],
    audioUrl: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3",
    audioPublicId: "audio_audio_1761738493805"
  },
  
  // True/False Listening Tests
  {
    title: "Listening Comprehension - True/False",
    description: "Determine if statements are true or false based on audio content",
    type: "TRUE_FALSE",
    module: "LISTENING", 
    difficulty: "BEGINNER",
    duration: 10,
    questions: [
      {
        id: "q1",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        correctAnswers: { "0": "TRUE" },
        correctAnswer: "TRUE",
        instructions: "Listen to the statement and determine if it's true or false."
      },
      {
        id: "q2",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        correctAnswers: { "0": "FALSE" },
        correctAnswer: "FALSE",
        instructions: "Listen carefully and decide if the statement is correct."
      },
      {
        id: "q3",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        correctAnswers: { "0": "TRUE" },
        correctAnswer: "TRUE",
        instructions: "Determine the accuracy of the given statement."
      }
    ],
    audioUrl: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3",
    audioPublicId: "audio_audio_1761738493805"
  },

  // Advanced Multiple Choice
  {
    title: "Advanced Listening - Multiple Choice",
    description: "Challenging listening comprehension with complex audio content",
    type: "MULTIPLE_CHOICE",
    module: "LISTENING",
    difficulty: "ADVANCED",
      duration: 25,
    questions: [
      {
        id: "q1",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswers: { "0": "Option D" },
        correctAnswer: "Option D",
        instructions: "Listen to the complex audio and choose the most appropriate answer."
      },
      {
        id: "q2",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswers: { "0": "Option A" },
        correctAnswer: "Option A",
        instructions: "Focus on the main ideas and supporting details."
      },
      {
        id: "q3",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswers: { "0": "Option C" },
        correctAnswer: "Option C",
        instructions: "Listen for specific information and implications."
      },
      {
        id: "q4",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswers: { "0": "Option B" },
        correctAnswer: "Option B",
        instructions: "Analyze the speaker's tone and purpose."
      }
    ],
    audioUrl: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3",
    audioPublicId: "audio_audio_1761738493805"
  },

  // Beginner True/False
  {
    title: "Basic Listening - True/False",
    description: "Simple true/false questions for beginners",
    type: "TRUE_FALSE",
    module: "LISTENING",
    difficulty: "BEGINNER",
    duration: 8,
        questions: [
          {
        id: "q1",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        correctAnswers: { "0": "TRUE" },
        correctAnswer: "TRUE",
        instructions: "Listen and decide if the statement is true or false."
      },
      {
        id: "q2",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        correctAnswers: { "0": "FALSE" },
        correctAnswer: "FALSE",
        instructions: "Simple true or false question."
      }
    ],
    audioUrl: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3",
    audioPublicId: "audio_audio_1761738493805"
  },

  // Intermediate True/False
  {
    title: "Intermediate Listening - True/False",
    description: "Moderate difficulty true/false questions",
    type: "TRUE_FALSE",
    module: "LISTENING",
    difficulty: "INTERMEDIATE",
    duration: 12,
    questions: [
      {
        id: "q1",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        correctAnswers: { "0": "TRUE" },
        correctAnswer: "TRUE",
        instructions: "Listen carefully and determine the accuracy of the statement."
      },
      {
        id: "q2",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        correctAnswers: { "0": "FALSE" },
        correctAnswer: "FALSE",
        instructions: "Pay attention to specific details in the audio."
      },
      {
        id: "q3",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        correctAnswers: { "0": "TRUE" },
        correctAnswer: "TRUE",
        instructions: "Listen for the main idea and supporting evidence."
      }
    ],
    audioUrl: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3",
    audioPublicId: "audio_audio_1761738493805"
  }
]

async function main() {
  console.log('🌱 Starting remedial test seeding...')

  try {
    // First, ensure we have an admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.log('👤 Creating admin user...')
      const hashedPassword = await hash('admin123', 12)
      
      adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          phone: '+1234567890'
        }
      })
      console.log('✅ Admin user created')
    } else {
      console.log('✅ Admin user already exists')
    }

    // Get some mock tests to link to
    const mockTests = await prisma.mock.findMany({
      take: 3
    })

    console.log(`📚 Found ${mockTests.length} mock tests to link to`)
    
    // Create remedial test templates
    for (let i = 0; i < remedialTestData.length; i++) {
      const testData = remedialTestData[i]
      
      console.log(`📝 Creating remedial test: ${testData.title}`)
      
      const remedialTest = await prisma.remedialTestTemplate.create({
        data: {
          title: testData.title,
          description: testData.description,
          type: testData.type,
          module: testData.module,
          difficulty: testData.difficulty,
          duration: testData.duration,
          questions: testData.questions,
          audioUrl: testData.audioUrl,
          audioPublicId: testData.audioPublicId,
          mockTestId: mockTests.length > 0 ? mockTests[i % mockTests.length].id : null,
          isActive: true,
          createdBy: adminUser.id
        }
      })

      console.log(`✅ Created: ${remedialTest.title} (${remedialTest.type})`)
    }
    
    console.log('🎉 Remedial test seeding completed successfully!')
    console.log(`📊 Created ${remedialTestData.length} remedial test templates`)

    // Display summary
    const totalTests = await prisma.remedialTestTemplate.count()
    const listeningTests = await prisma.remedialTestTemplate.count({
      where: { module: 'LISTENING' }
    })
    const multipleChoiceTests = await prisma.remedialTestTemplate.count({
      where: { type: 'MULTIPLE_CHOICE' }
    })
    const trueFalseTests = await prisma.remedialTestTemplate.count({
      where: { type: 'TRUE_FALSE' }
    })

    console.log('\n📈 Summary:')
    console.log(`   Total remedial tests: ${totalTests}`)
    console.log(`   Listening tests: ${listeningTests}`)
    console.log(`   Multiple Choice tests: ${multipleChoiceTests}`)
    console.log(`   True/False tests: ${trueFalseTests}`)
    
  } catch (error) {
    console.error('❌ Error seeding remedial tests:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
main()
  .catch((error) => {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  })