import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyPartStorage() {
  try {
    console.log('🔍 Verifying part-wise data storage...')
    
    // Get the latest mock test
    const mockTest = await prisma.mock.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        modules: {
          include: {
            questions: {
              include: {
                questionBank: true
              }
            }
          }
        }
      }
    })

    if (!mockTest) {
      console.log('❌ No mock test found')
      return
    }

    console.log(`📊 Mock Test: ${mockTest.title}`)
    console.log(`📅 Created: ${mockTest.createdAt}`)
    console.log(`📝 Modules: ${mockTest.modules.length}`)

    // Check each module
    for (const module of mockTest.modules) {
      console.log(`\n🎯 Module: ${module.type}`)
      console.log(`📋 Questions: ${module.questions.length}`)
      
      // Group questions by part
      const questionsByPart: { [key: number]: any[] } = {}
      
      for (const question of module.questions) {
        const content = question.questionBank.contentJson as any
        const part = content.part || 1
        
        if (!questionsByPart[part]) {
          questionsByPart[part] = []
        }
        questionsByPart[part].push({
          id: question.id,
          type: question.questionBank.type,
          content: content.content,
          part: part
        })
      }
      
      // Display questions by part
      for (const [part, questions] of Object.entries(questionsByPart)) {
        console.log(`  📖 Part ${part}: ${questions.length} questions`)
        for (const q of questions) {
          console.log(`    - ${q.type}: ${q.content.substring(0, 50)}...`)
        }
      }
    }

    console.log('\n✅ Part-wise data verification completed!')
    
  } catch (error) {
    console.error('❌ Error verifying part storage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the verification
verifyPartStorage()
