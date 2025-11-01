import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createMatchingHeadingsTest() {
  try {
    console.log('Creating matching headings test...')

    // First, find or create an admin user
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
      console.log('Created admin user for test data')
    }

    // Create a mock test
    const mock = await prisma.mock.create({
      data: {
        title: 'IELTS Matching Headings Practice Test',
        description: 'A practice test focusing on matching headings questions',
        createdBy: adminUser.id
      }
    })

    // Create the matching headings module
    const mockModule = await prisma.mockModule.create({
      data: {
        mockId: mock.id,
        type: 'READING', // Use READING as the base type since MATCHING_HEADINGS is not in ModuleType enum
        durationMinutes: 20,
        instructions: 'Read the passage and match the headings to the correct sections. Drag headings from the right panel to the gaps in the text.',
        order: 1
      }
    })

    // Create the question bank entry
    const questionBank = await prisma.questionBank.create({
      data: {
        type: 'MATCHING',
        contentJson: {
          passage: {
            title: 'THE TALE OF THE PONYTAIL',
            sections: [
              {
                id: 'section-1',
                number: 1,
                content: 'The ponytail hairstyle has been a popular choice for women and girls for centuries. Its simple yet elegant design makes it both practical and fashionable.',
                hasHeading: true,
                heading: 'A timeless hairstyle'
              },
              {
                id: 'section-2',
                number: 2,
                content: 'In ancient times, the ponytail was often associated with warriors and athletes. Greek and Roman women would tie their hair back during physical activities to keep it out of their way.',
                hasHeading: true,
                heading: 'Historical origins'
              },
              {
                id: 'section-3',
                number: 3,
                content: 'During the 18th and 19th centuries, the ponytail became a symbol of youth and innocence. Young girls would often wear their hair in ponytails as a sign of their unmarried status.',
                hasHeading: true,
                heading: 'Symbol of youth'
              },
              {
                id: 'section-4',
                number: 4,
                content: 'In modern times, the ponytail has evolved into a versatile hairstyle that can be worn in many different ways. From high ponytails to low ponytails, from sleek to messy, there is a ponytail style for every occasion.',
                hasHeading: false
              },
              {
                id: 'section-5',
                number: 5,
                content: 'The ponytail continues to be a popular choice for women of all ages. Its simplicity and elegance make it a timeless hairstyle that will never go out of fashion.',
                hasHeading: false
              }
            ]
          },
          headings: [
            'A timeless hairstyle',
            'Historical origins',
            'Symbol of youth',
            'A common hairstyle for school girls',
            'An expectation for the future'
          ],
          correctAnswers: {
            'section-4': 'A common hairstyle for school girls',
            'section-5': 'An expectation for the future'
          },
          instructions: 'Read the text below and answer questions 1-2. Choose the correct heading for each section and move it into the gap.'
        }
      }
    })

    // Create the question
    const mockQuestion = await prisma.mockQuestion.create({
      data: {
        moduleId: mockModule.id,
        questionBankId: questionBank.id,
        order: 1,
        points: 10,
        correctAnswerJson: {
          'section-4': 'A common hairstyle for school girls',
          'section-5': 'An expectation for the future'
        }
      }
    })

    console.log('Created mock test:', mock.id)

    // Create a test assignment for a student
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' }
    })

    if (!student) {
      console.log('No student found. Please create a student first.')
      return
    }

    const assignment = await prisma.assignment.create({
      data: {
        studentId: student.id,
        mockId: mock.id,
        candidateNumber: 'CAND001',
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        tokenHash: 'test-token-123',
        status: 'ACTIVE'
      }
    })

    console.log('Created assignment:', assignment.id)
    console.log('Test token:', assignment.tokenHash)
    console.log('You can access the test at: http://localhost:3000/test/test-token-123')

  } catch (error) {
    console.error('Error creating matching headings test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMatchingHeadingsTest()
