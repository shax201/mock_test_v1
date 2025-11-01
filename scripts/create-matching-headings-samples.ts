import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sampleQuestions = [
  {
    title: 'THE TALE OF THE PONYTAIL',
    sections: [
      {
        id: 'section-1',
        number: 1,
        content: 'The ponytail hairstyle has ancient origins, dating back to around 1600 B.C.E. in ancient Greece, where it was worn by both men and women. The style was also popular in ancient Rome and Egypt, where it was often adorned with ribbons, beads, or other decorative elements. The ponytail\'s versatility made it a practical choice for various activities, from daily work to formal occasions.',
        hasHeading: true,
        heading: 'A ground-breaking discovery.'
      },
      {
        id: 'section-2',
        number: 2,
        content: 'In the 17th century, the ponytail became a symbol of masculinity when the Manchu people of Northeast China adopted it as their signature hairstyle. When the Manchu conquered China and established the Qing dynasty, they required all Han Chinese men to wear their hair in the same style as a sign of submission. Refusing to adopt the hairstyle could result in severe penalties, including death.',
        hasHeading: true,
        heading: 'A modern trend with historical roots.'
      },
      {
        id: 'section-3',
        number: 3,
        content: 'During the 18th and 19th centuries, the ponytail became known as the "Queue" and was worn by European soldiers as a compulsory hairstyle. It was considered a symbol of masculinity and military discipline. However, as hairstyling techniques advanced and the ponytail became increasingly high-maintenance, it gradually fell out of favor among military personnel.',
        hasHeading: true,
        heading: 'Ponytails in the twentieth century.'
      },
      {
        id: 'section-4',
        number: 4,
        content: 'The ponytail experienced a decline in popularity during the 1930s and 1940s, largely due to the influence of Hollywood\'s glamorous curls and waves. However, it made a comeback in the 1950s as a "schoolgirl hairstyle," becoming associated with youth and innocence. By the 1960s, it had evolved into a "classic hairdo for the girl next door," and by the 1990s, it had transformed into a "powerhouse hairstyle" worn by successful women in various professions.',
        hasHeading: false
      },
      {
        id: 'section-5',
        number: 5,
        content: 'By 2012, the ponytail had even scored its own emoji, becoming one of the most recognizable hairstyles in digital communication. Today, it remains a versatile and practical choice for people of all ages and backgrounds, from athletes and dancers to business professionals and students. Its enduring popularity speaks to its perfect balance of functionality and style.',
        hasHeading: false
      }
    ],
    headings: [
      'A common hairstyle for school girls',
      'Cross-cultural introduction of ponytail',
      'Conquest of Northeast China',
      'A strange finding',
      'A symbol of masculinity',
      'An expectation for the future'
    ],
    correctAnswers: {
      'section-4': 'A common hairstyle for school girls',
      'section-5': 'An expectation for the future'
    }
  },
  {
    title: 'THE EVOLUTION OF URBAN TRANSPORTATION',
    sections: [
      {
        id: 'section-1',
        number: 1,
        content: 'The history of urban transportation began with the invention of the wheel around 3500 B.C.E. in Mesopotamia. Early wheeled vehicles were primarily used for agricultural purposes, but they soon found applications in urban settings. The development of paved roads in ancient Rome around 300 B.C.E. marked a significant milestone, enabling more efficient movement of goods and people within cities.',
        hasHeading: true,
        heading: 'Ancient foundations of city transport.'
      },
      {
        id: 'section-2',
        number: 2,
        content: 'The Industrial Revolution of the 18th and 19th centuries brought about revolutionary changes in urban transportation. The introduction of steam-powered trains and trams transformed how people moved within and between cities. These innovations not only increased the speed of travel but also made transportation more accessible to the general population, leading to the rapid expansion of urban areas.',
        hasHeading: true,
        heading: 'Industrial revolution transforms mobility.'
      },
      {
        id: 'section-3',
        number: 3,
        content: 'The 20th century saw the rise of the automobile as the dominant form of urban transportation. Henry Ford\'s assembly line production made cars affordable for middle-class families, fundamentally changing urban planning and development patterns. Cities began to sprawl outward, and the concept of suburban living became possible for millions of people.',
        hasHeading: false
      },
      {
        id: 'section-4',
        number: 4,
        content: 'As cities grew larger and more congested, the limitations of automobile-based transportation became apparent. Traffic jams, air pollution, and the need for vast amounts of parking space led urban planners to reconsider transportation strategies. This period saw the development of integrated public transportation systems, including subways, buses, and light rail networks.',
        hasHeading: false
      },
      {
        id: 'section-5',
        number: 5,
        content: 'The 21st century has brought about a new era of smart transportation solutions. Electric vehicles, bike-sharing programs, and ride-sharing services have emerged as sustainable alternatives to traditional car ownership. Cities are now investing in smart infrastructure, including connected traffic lights and autonomous vehicle testing, to create more efficient and environmentally friendly transportation systems.',
        hasHeading: false
      }
    ],
    headings: [
      'The rise of the automobile',
      'Challenges of car-dependent cities',
      'Smart solutions for modern cities',
      'The wheel changes everything',
      'Steam power revolutionizes travel',
      'Planning for the future'
    ],
    correctAnswers: {
      'section-3': 'The rise of the automobile',
      'section-4': 'Challenges of car-dependent cities',
      'section-5': 'Smart solutions for modern cities'
    }
  },
  {
    title: 'THE SCIENCE OF SLEEP',
    sections: [
      {
        id: 'section-1',
        number: 1,
        content: 'Sleep is a complex biological process that has fascinated scientists for centuries. Early theories suggested that sleep was simply a period of rest for the body, but modern research has revealed that sleep is an active state involving intricate brain processes. During sleep, the brain performs essential maintenance functions, including memory consolidation, toxin removal, and cellular repair.',
        hasHeading: true,
        heading: 'Understanding sleep as an active process.'
      },
      {
        id: 'section-2',
        number: 2,
        content: 'The sleep cycle consists of several distinct stages, each serving different purposes. Non-rapid eye movement (NREM) sleep includes three stages, with the deepest stage being crucial for physical restoration. Rapid eye movement (REM) sleep, which occurs several times throughout the night, is associated with dreaming and plays a vital role in emotional processing and memory formation.',
        hasHeading: true,
        heading: 'The stages of sleep explained.'
      },
      {
        id: 'section-3',
        number: 3,
        content: 'Sleep deprivation has serious consequences for both physical and mental health. Studies have shown that lack of sleep can impair cognitive function, weaken the immune system, and increase the risk of chronic diseases such as diabetes and heart disease. Even short-term sleep deprivation can significantly impact mood, decision-making abilities, and reaction times.',
        hasHeading: false
      },
      {
        id: 'section-4',
        number: 4,
        content: 'Modern lifestyle factors have created what some researchers call a "sleep crisis." The prevalence of electronic devices, irregular work schedules, and high levels of stress have disrupted natural sleep patterns for millions of people. This has led to increased awareness of the importance of sleep hygiene and the development of various tools and techniques to improve sleep quality.',
        hasHeading: false
      },
      {
        id: 'section-5',
        number: 5,
        content: 'The future of sleep research holds promise for better understanding and treatment of sleep disorders. Advances in technology, including wearable sleep trackers and brain imaging techniques, are providing new insights into sleep patterns and their relationship to health. Researchers are also exploring the potential of personalized sleep recommendations based on individual genetic and lifestyle factors.',
        hasHeading: false
      }
    ],
    headings: [
      'The hidden dangers of sleep loss',
      'Technology disrupts natural patterns',
      'Personalized sleep solutions ahead',
      'Sleep is more than just rest',
      'How sleep stages work',
      'A growing public health concern'
    ],
    correctAnswers: {
      'section-3': 'The hidden dangers of sleep loss',
      'section-4': 'Technology disrupts natural patterns',
      'section-5': 'Personalized sleep solutions ahead'
    }
  }
]

async function createSampleQuestions() {
  try {
    console.log('Creating sample matching headings questions...')

    // First, find an existing admin user or create one
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@system.com',
          name: 'System Admin',
          role: 'ADMIN',
          passwordHash: 'placeholder_hash'
        }
      })
      console.log('Created admin user for sample data')
    }

    for (const questionData of sampleQuestions) {
      const remedialTest = await prisma.remedialTestTemplate.create({
        data: {
          title: `Matching Headings: ${questionData.title}`,
          description: `Practice matching headings to reading passage sections with the topic: ${questionData.title}`,
          type: 'MATCHING_HEADINGS',
          module: 'READING',
          difficulty: 'INTERMEDIATE',
          duration: 20,
          questions: [
            {
              id: 'q1',
              passage: {
                title: questionData.title,
                sections: questionData.sections
              },
              headings: questionData.headings,
              correctAnswers: questionData.correctAnswers,
              instructions: 'Read the text below and answer questions 1-6. Choose the correct heading for each section and move it into the gap.'
            }
          ],
          isActive: true,
          createdBy: adminUser.id
        }
      })

      console.log(`Created remedial test: ${remedialTest.title}`)
    }

    console.log('Sample questions created successfully!')
  } catch (error) {
    console.error('Error creating sample questions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleQuestions()
