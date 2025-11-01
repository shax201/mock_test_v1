import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSubmissions() {
  try {
    console.log('Checking submissions data...')

    const submissions = await prisma.submission.findMany({
      include: {
        module: true,
        assignment: {
          include: {
            student: true,
            mock: true
          }
        }
      }
    })

    console.log(`Found ${submissions.length} submissions:`)
    
    submissions.forEach((submission, index) => {
      console.log(`\nSubmission ${index + 1}:`)
      console.log(`  ID: ${submission.id}`)
      console.log(`  Assignment ID: ${submission.assignmentId}`)
      console.log(`  Module: ${submission.module.type}`)
      console.log(`  Auto Score: ${submission.autoScore}`)
      console.log(`  Submitted At: ${submission.submittedAt}`)
      console.log(`  Student: ${submission.assignment.student.name}`)
      console.log(`  Test: ${submission.assignment.mock.title}`)
    })

    // Check results
    const results = await prisma.result.findMany({
      include: {
        assignment: {
          include: {
            student: true,
            mock: true
          }
        }
      }
    })

    console.log(`\nFound ${results.length} results:`)
    
    results.forEach((result, index) => {
      console.log(`\nResult ${index + 1}:`)
      console.log(`  ID: ${result.id}`)
      console.log(`  Assignment ID: ${result.assignmentId}`)
      console.log(`  Listening: ${result.listeningBand}`)
      console.log(`  Reading: ${result.readingBand}`)
      console.log(`  Writing: ${result.writingBand}`)
      console.log(`  Speaking: ${result.speakingBand}`)
      console.log(`  Overall: ${result.overallBand}`)
      console.log(`  Student: ${result.assignment.student.name}`)
      console.log(`  Test: ${result.assignment.mock.title}`)
    })

  } catch (error) {
    console.error('Error checking submissions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSubmissions()
