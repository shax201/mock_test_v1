#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Configuration: Number of variants to create for each remedial test type
const NUMBER_OF_VARIANTS = 5

// Configuration: Whether to clear existing remedial tests before creating new ones
const CLEAR_EXISTING_TESTS = true

// Sample remedial test data with matching headings
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
        options: [],
        correctAnswers: { "0": "True" },
        correctAnswer: "True",
        instructions: "Listen to the statement and determine if it's true or false."
      },
      {
        id: "q2",
        questions: ["Audio Question"],
        questionAudios: [{ url: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3", publicId: "audio_audio_1761738493805" }],
        options: [],
        correctAnswers: { "0": "False" },
        correctAnswer: "False",
        instructions: "Listen carefully and decide if the statement is true or false."
      }
    ],
    audioUrl: "https://res.cloudinary.com/dz0azrpke/video/upload/v1761738498/ielts-mock/audio/audio_audio_1761738493805.mp3.mp3",
    audioPublicId: "audio_audio_1761738493805"
  },

  // Matching Headings Reading Tests
  {
    title: "Reading - Matching Headings Practice",
    description: "Practice matching headings to passage sections to improve reading comprehension",
    type: "MATCHING_HEADINGS",
    module: "READING",
    difficulty: "INTERMEDIATE",
    duration: 20,
    passageContent: {
      part1: "<h2>The Benefits of Regular Exercise</h2>\n<p><strong>1.</strong> Regular physical activity has numerous health benefits. It helps maintain a healthy weight, reduces the risk of chronic diseases such as heart disease, diabetes, and certain cancers. Exercise also strengthens the immune system and improves overall physical fitness. Research has shown that just 30 minutes of moderate exercise per day can significantly improve cardiovascular health and reduce the risk of developing serious medical conditions. Additionally, regular exercise helps build stronger bones and muscles, which becomes increasingly important as we age.</p>\n<p><strong>2.</strong> Beyond physical health, exercise has significant mental health benefits. It releases endorphins, which are natural mood lifters, and can help reduce symptoms of depression and anxiety. Regular exercise also improves sleep quality and cognitive function. Studies have demonstrated that people who exercise regularly tend to have better memory, concentration, and problem-solving abilities. The psychological benefits are so pronounced that many healthcare professionals now prescribe exercise as part of treatment plans for mental health conditions.</p>\n<p><strong>3.</strong> Exercise also plays a crucial role in social well-being. Group activities and team sports provide opportunities for social interaction and can help build lasting friendships. Many people find that exercising with others increases their motivation and enjoyment. Joining a fitness class, sports team, or running group can create a sense of community and belonging. These social connections can be particularly valuable for individuals who may otherwise feel isolated, providing both emotional support and accountability in maintaining a regular exercise routine.</p>\n<p><strong>4.</strong> To maximize the benefits of exercise, it's important to find activities you enjoy and can maintain long-term. This might include walking, swimming, cycling, dancing, or any other form of physical activity that gets your heart rate up. The key to sustainable fitness is choosing exercises that fit your lifestyle, interests, and physical capabilities. Start with activities that feel manageable, gradually increase intensity and duration, and remember that consistency matters more than perfection. Whether you prefer high-intensity workouts or gentle activities like yoga or tai chi, the most important thing is staying active regularly.</p>",
      part2: "",
      part3: ""
    },
    questions: [
      {
        id: "q1",
        passage: {
          title: "The Benefits of Regular Exercise",
          sections: [
            {
              id: "section-1",
              number: 1,
              content: "Regular physical activity has numerous health benefits. It helps maintain a healthy weight, reduces the risk of chronic diseases such as heart disease, diabetes, and certain cancers. Exercise also strengthens the immune system and improves overall physical fitness. Research has shown that just 30 minutes of moderate exercise per day can significantly improve cardiovascular health and reduce the risk of developing serious medical conditions. Additionally, regular exercise helps build stronger bones and muscles, which becomes increasingly important as we age.",
              hasHeading: true,
              heading: ""
            },
            {
              id: "section-2",
              number: 2,
              content: "Beyond physical health, exercise has significant mental health benefits. It releases endorphins, which are natural mood lifters, and can help reduce symptoms of depression and anxiety. Regular exercise also improves sleep quality and cognitive function. Studies have demonstrated that people who exercise regularly tend to have better memory, concentration, and problem-solving abilities. The psychological benefits are so pronounced that many healthcare professionals now prescribe exercise as part of treatment plans for mental health conditions.",
              hasHeading: false
            },
            {
              id: "section-3",
              number: 3,
              content: "Exercise also plays a crucial role in social well-being. Group activities and team sports provide opportunities for social interaction and can help build lasting friendships. Many people find that exercising with others increases their motivation and enjoyment. Joining a fitness class, sports team, or running group can create a sense of community and belonging. These social connections can be particularly valuable for individuals who may otherwise feel isolated, providing both emotional support and accountability in maintaining a regular exercise routine.",
              hasHeading: true,
              heading: ""
            },
            {
              id: "section-4",
              number: 4,
              content: "To maximize the benefits of exercise, it's important to find activities you enjoy and can maintain long-term. This might include walking, swimming, cycling, dancing, or any other form of physical activity that gets your heart rate up. The key to sustainable fitness is choosing exercises that fit your lifestyle, interests, and physical capabilities. Start with activities that feel manageable, gradually increase intensity and duration, and remember that consistency matters more than perfection. Whether you prefer high-intensity workouts or gentle activities like yoga or tai chi, the most important thing is staying active regularly.",
              hasHeading: false
            }
          ]
        },
        headings: [
          "Physical Health Benefits",
          "Mental Health Benefits", 
          "Social Benefits",
          "Getting Started with Exercise"
        ],
        questions: ["Match the headings to the appropriate sections"],
        options: [],
        questionAudios: [],
        correctAnswers: {
          "section-1": "Physical Health Benefits",
          "section-3": "Social Benefits"
        },
        correctAnswer: "",
        instructions: "Read the passage and match the headings to the correct sections. Some sections have heading gaps where you need to drag the appropriate heading."
      }
    ],
    audioUrl: null,
    audioPublicId: null
  },

  // Another Matching Headings Test
  {
    title: "Reading - Academic Text Headings",
    description: "Practice with academic-style passages and matching headings",
    type: "MATCHING_HEADINGS", 
    module: "READING",
    difficulty: "ADVANCED",
    duration: 25,
    passageContent: {
      part1: "<h2>Climate Change and Its Global Impact</h2>\n<p><strong>1.</strong> Climate change refers to long-term shifts in global temperatures and weather patterns. While climate variations are natural, scientific evidence shows that human activities have been the primary driver of climate change since the mid-20th century, particularly due to greenhouse gas emissions. The Intergovernmental Panel on Climate Change (IPCC) has concluded that it is extremely likely that more than half of the observed increase in global average surface temperature from 1951 to 2010 was caused by human activities. This conclusion is based on extensive analysis of temperature records, ice core samples, and computer models that simulate climate patterns over thousands of years.</p>\n<p><strong>2.</strong> The primary cause of recent climate change is the increased concentration of greenhouse gases in the atmosphere. Carbon dioxide levels have risen by more than 40% since the Industrial Revolution, primarily from burning fossil fuels for electricity, heat, and transportation. Methane, nitrous oxide, and fluorinated gases also contribute significantly to the greenhouse effect. Deforestation and changes in land use have further exacerbated the problem by reducing the Earth's capacity to absorb carbon dioxide. Industrial processes, agricultural practices, and waste management systems have all contributed to the increasing concentration of these gases in our atmosphere.</p>\n<p><strong>3.</strong> The consequences of climate change are already visible worldwide. Rising sea levels threaten coastal communities, extreme weather events are becoming more frequent and intense, and ecosystems are shifting as species adapt to changing conditions. Glaciers and ice sheets are melting at unprecedented rates, contributing to sea level rise. Heatwaves, droughts, floods, and hurricanes are occurring with greater frequency and severity. Ocean acidification, caused by the absorption of excess carbon dioxide, is threatening marine ecosystems and coral reefs. Many plant and animal species are shifting their geographic ranges or facing extinction as their habitats change.</p>\n<p><strong>4.</strong> Addressing climate change requires immediate and sustained action at all levels. This includes transitioning to renewable energy sources, improving energy efficiency, protecting and restoring forests, and developing new technologies for carbon capture and storage. International cooperation through agreements like the Paris Agreement is essential for coordinated global action. Governments, businesses, and individuals all have roles to play in reducing emissions and adapting to changes that are already underway. Investment in clean energy technologies, sustainable transportation systems, and climate-resilient infrastructure will be crucial for mitigating the worst impacts of climate change.</p>",
      part2: "",
      part3: ""
    },
    questions: [
      {
        id: "q1",
        passage: {
          title: "Climate Change and Its Global Impact",
          sections: [
            {
              id: "section-1",
              number: 1,
              content: "Climate change refers to long-term shifts in global temperatures and weather patterns. While climate variations are natural, scientific evidence shows that human activities have been the primary driver of climate change since the mid-20th century, particularly due to greenhouse gas emissions. The Intergovernmental Panel on Climate Change (IPCC) has concluded that it is extremely likely that more than half of the observed increase in global average surface temperature from 1951 to 2010 was caused by human activities. This conclusion is based on extensive analysis of temperature records, ice core samples, and computer models that simulate climate patterns over thousands of years.",
              hasHeading: true,
              heading: ""
            },
            {
              id: "section-2",
              number: 2,
              content: "The primary cause of recent climate change is the increased concentration of greenhouse gases in the atmosphere. Carbon dioxide levels have risen by more than 40% since the Industrial Revolution, primarily from burning fossil fuels for electricity, heat, and transportation. Methane, nitrous oxide, and fluorinated gases also contribute significantly to the greenhouse effect. Deforestation and changes in land use have further exacerbated the problem by reducing the Earth's capacity to absorb carbon dioxide. Industrial processes, agricultural practices, and waste management systems have all contributed to the increasing concentration of these gases in our atmosphere.",
              hasHeading: false
            },
            {
              id: "section-3",
              number: 3,
              content: "The consequences of climate change are already visible worldwide. Rising sea levels threaten coastal communities, extreme weather events are becoming more frequent and intense, and ecosystems are shifting as species adapt to changing conditions. Glaciers and ice sheets are melting at unprecedented rates, contributing to sea level rise. Heatwaves, droughts, floods, and hurricanes are occurring with greater frequency and severity. Ocean acidification, caused by the absorption of excess carbon dioxide, is threatening marine ecosystems and coral reefs. Many plant and animal species are shifting their geographic ranges or facing extinction as their habitats change.",
              hasHeading: true,
              heading: ""
            },
            {
              id: "section-4",
              number: 4,
              content: "Addressing climate change requires immediate and sustained action at all levels. This includes transitioning to renewable energy sources, improving energy efficiency, protecting and restoring forests, and developing new technologies for carbon capture and storage. International cooperation through agreements like the Paris Agreement is essential for coordinated global action. Governments, businesses, and individuals all have roles to play in reducing emissions and adapting to changes that are already underway. Investment in clean energy technologies, sustainable transportation systems, and climate-resilient infrastructure will be crucial for mitigating the worst impacts of climate change.",
              hasHeading: false
            }
          ]
        },
        headings: [
          "Understanding Climate Change",
          "Causes of Climate Change",
          "Global Consequences",
          "Solutions and Mitigation"
        ],
        questions: ["Match the headings to the appropriate sections"],
        options: [],
        questionAudios: [],
        correctAnswers: {
          "section-1": "Understanding Climate Change",
          "section-3": "Global Consequences"
        },
        correctAnswer: "",
        instructions: "Read the academic passage and match the headings to the correct sections. Pay attention to the main ideas and supporting details in each section."
      }
    ],
    audioUrl: null,
    audioPublicId: null
  },

  // Multiple Choice Reading Tests
  {
    title: "Reading - Multiple Choice Practice",
    description: "Practice reading comprehension with multiple choice questions",
    type: "MULTIPLE_CHOICE",
    module: "READING",
    difficulty: "INTERMEDIATE",
    duration: 18,
    passageContent: {
      part1: "<h2>The Digital Revolution in Education</h2>\n<p>The rapid advancement of technology has fundamentally transformed the landscape of education over the past two decades. Traditional classroom settings, once dominated by chalkboards and textbooks, have evolved into dynamic learning environments equipped with interactive whiteboards, tablets, and online learning platforms. This digital transformation has not only changed how information is delivered but also how students interact with content and with each other.</p>\n<p>One of the most significant developments in educational technology is the rise of online learning platforms. These platforms offer students the flexibility to learn at their own pace and access educational materials from anywhere in the world. Massive Open Online Courses (MOOCs) have made high-quality education accessible to millions of people who might not have had the opportunity to attend traditional universities. Universities and educational institutions worldwide now offer online degree programs that are recognized and respected by employers.</p>\n<p>Technology has also enabled more personalized learning experiences. Adaptive learning systems use artificial intelligence to analyze a student's performance and tailor educational content to their individual needs. This approach helps identify areas where students struggle and provides additional support and resources. Interactive simulations and virtual reality experiences allow students to explore complex concepts in ways that were previously impossible, making abstract ideas more tangible and understandable.</p>\n<p>However, the digital revolution in education also presents challenges. The digital divide remains a significant concern, as students from lower-income families may not have access to reliable internet connections or necessary devices. Additionally, there is a concern that excessive screen time may impact students' attention spans and social skills. Educators must find a balance between leveraging technology's benefits and maintaining the essential human elements of teaching, such as mentorship, emotional support, and face-to-face interaction.</p>",
      part2: "",
      part3: ""
    },
    questions: [
      {
        id: "q1",
        questions: ["What is the main topic of the passage?"],
        questionAudios: [],
        options: ["Technology", "Education", "Technology in Education", "Online Learning"],
        correctAnswers: { "0": "Technology in Education" },
        correctAnswer: "Technology in Education",
        instructions: "Read the passage and choose the best answer."
      },
      {
        id: "q2",
        questions: ["According to the passage, what is one significant development in educational technology?"],
        questionAudios: [],
        options: ["Interactive whiteboards", "Online learning platforms", "Tablets in classrooms", "Digital textbooks"],
        correctAnswers: { "0": "Online learning platforms" },
        correctAnswer: "Online learning platforms",
        instructions: "Read carefully and select the correct statement."
      }
    ],
    audioUrl: null,
    audioPublicId: null
  },

  // True/False Reading Tests
  {
    title: "Reading - True/False Practice",
    description: "Practice reading comprehension with true/false questions",
    type: "TRUE_FALSE",
    module: "READING",
    difficulty: "BEGINNER",
    duration: 12,
    passageContent: {
      part1: "<h2>The Importance of Healthy Eating Habits</h2>\n<p>Maintaining a balanced diet is essential for overall health and well-being. Regular consumption of fruits, vegetables, whole grains, and lean proteins provides the body with necessary nutrients, vitamins, and minerals. These foods support the immune system, help maintain a healthy weight, and reduce the risk of chronic diseases such as heart disease, diabetes, and certain types of cancer.</p>\n<p>Nutrition experts recommend eating a variety of foods from all food groups to ensure adequate nutrition. It's important to limit the intake of processed foods, which often contain high amounts of sugar, salt, and unhealthy fats. While occasional treats are perfectly fine, they should not make up the majority of one's diet. Drinking plenty of water throughout the day is also crucial for maintaining proper hydration and supporting bodily functions.</p>\n<p>While diet is important, it's worth noting that healthy eating alone cannot guarantee perfect health. Regular physical activity, adequate sleep, stress management, and avoiding harmful substances like tobacco and excessive alcohol are all important components of a healthy lifestyle. However, establishing good eating habits early in life can set the foundation for long-term health benefits and make it easier to maintain these habits throughout adulthood.</p>",
      part2: "",
      part3: ""
    },
    questions: [
      {
        id: "q1",
        questions: ["According to the passage, eating fruits and vegetables helps support the immune system."],
        questionAudios: [],
        options: [],
        correctAnswers: { "0": "True" },
        correctAnswer: "True",
        instructions: "Read the passage and determine if the statement is true or false."
      },
      {
        id: "q2",
        questions: ["The passage states that healthy eating alone guarantees perfect health."],
        questionAudios: [],
        options: [],
        correctAnswers: { "0": "False" },
        correctAnswer: "False",
        instructions: "Read carefully and decide if the statement is true or false."
      }
    ],
    audioUrl: null,
    audioPublicId: null
  }
]

async function seedRemedialTests() {
  try {
    console.log('🌱 Starting remedial tests seeding with matching headings...')

    // Get or create an admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.log('👤 Creating admin user...')
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          passwordHash: await hash('admin123', 10),
          role: 'ADMIN',
          name: 'Admin User'
        }
      })
    }

    // Find or create a mock test to link remedial tests to
    let mockTest = await prisma.mock.findFirst({
      where: { title: { contains: 'Comprehensive' } }
    })

    if (!mockTest) {
      console.log('📝 Creating a mock test for remedial tests...')
      mockTest = await prisma.mock.create({
        data: {
          title: 'IELTS Academic Mock Test - Comprehensive',
          description: 'A comprehensive IELTS Academic mock test with all question types',
          createdBy: adminUser.id
        }
      })
      console.log(`✅ Created mock test: ${mockTest.title}`)
    } else {
      console.log(`📋 Using existing mock test: ${mockTest.title}`)
    }

    // Clear existing remedial tests if configured
    if (CLEAR_EXISTING_TESTS) {
      console.log('🧹 Clearing existing remedial tests...')
      await prisma.remedialTestTemplate.deleteMany({})
    }

    // Create remedial tests with multiple variants
    console.log(`📝 Creating ${NUMBER_OF_VARIANTS} variant(s) of each remedial test type...`)
    const createdTests = []
    
    for (const testData of remedialTestData) {
      for (let variantNumber = 1; variantNumber <= NUMBER_OF_VARIANTS; variantNumber++) {
        // Remove unsupported fields for RemedialTestTemplate and keep them for runtime usage
        const { passageContent, ...templateData } = testData as any
        
        // Add variant suffix to title if creating multiple variants
        const variantSuffix = NUMBER_OF_VARIANTS > 1 ? ` - Variant ${variantNumber}` : ''
        const variantTitle = `${templateData.title}${variantSuffix}`

        // If READING and we have passageContent, embed a helper question carrying the HTML passage
        // This will be extracted at session start and not rendered as a real question
        let questionsWithPassageHelper = templateData.questions
        if (templateData.module === 'READING' && passageContent && passageContent.part1) {
          questionsWithPassageHelper = [
            { id: '__passage__', passage: passageContent.part1, instructions: '' },
            ...templateData.questions
          ]
        }

        const remedialTest = await prisma.remedialTestTemplate.create({
          data: {
            ...templateData,
            title: variantTitle,
            questions: questionsWithPassageHelper,
            mockTestId: mockTest.id,
            createdBy: adminUser.id,
            isActive: true
          }
        })

        createdTests.push(remedialTest)
        console.log(`✅ Created: ${remedialTest.title} (${remedialTest.type}) - Linked to: ${mockTest.title}`)
      }
    }

    // Get final count
    const totalTests = await prisma.remedialTestTemplate.count()
    const matchingHeadingsTests = await prisma.remedialTestTemplate.count({
      where: { type: 'MATCHING_HEADINGS' }
    })
    const listeningTests = await prisma.remedialTestTemplate.count({
      where: { module: 'LISTENING' }
    })
    const readingTests = await prisma.remedialTestTemplate.count({
      where: { module: 'READING' }
    })

    console.log('\n🎉 Remedial tests seeding completed!')
    console.log(`📊 Summary:`)
    console.log(`   - Variants per test type: ${NUMBER_OF_VARIANTS}`)
    console.log(`   - Base test types: ${remedialTestData.length}`)
    console.log(`   - Total remedial tests created: ${createdTests.length}`)
    console.log(`   - Total remedial tests in database: ${totalTests}`)
    console.log(`   - Matching Headings: ${matchingHeadingsTests}`)
    console.log(`   - Listening tests: ${listeningTests}`)
    console.log(`   - Reading tests: ${readingTests}`)
    console.log(`   - Linked to mock test: ${mockTest.title}`)
    console.log(`   - Mock test ID: ${mockTest.id}`)
    console.log(`   - Admin user: ${adminUser.email}`)
    
    // Show breakdown by type
    console.log('\n📋 Breakdown by Test Type:')
    const testTypes = [...new Set(remedialTestData.map(t => t.type))]
    for (const type of testTypes) {
      const count = await prisma.remedialTestTemplate.count({ where: { type } })
      console.log(`   - ${type}: ${count} test(s)`)
    }

  } catch (error) {
    console.error('❌ Error seeding remedial tests:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
seedRemedialTests()
  .catch((error) => {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  })
