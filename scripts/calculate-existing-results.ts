import { PrismaClient } from '@prisma/client'
import { calculateAndStoreResults } from '../lib/scoring/result-calculator'

const prisma = new PrismaClient()

async function calculateExistingResults() {
  try {
    console.log('Starting to calculate results for existing assignments...')

    // Find all assignments that have submissions but no results
    const assignmentsWithoutResults = await prisma.assignment.findMany({
      where: {
        result: null,
        submissions: {
          some: {
            submittedAt: {
              not: null
            }
          }
        }
      },
      include: {
        submissions: {
          include: {
            module: true
          }
        }
      }
    })

    console.log(`Found ${assignmentsWithoutResults.length} assignments without results`)

    for (const assignment of assignmentsWithoutResults) {
      try {
        console.log(`Processing assignment ${assignment.id}...`)
        const result = await calculateAndStoreResults(assignment.id)
        if (result) {
          console.log(`✅ Created result for assignment ${assignment.id}`)
        } else {
          console.log(`⚠️ No result created for assignment ${assignment.id}`)
        }
      } catch (error) {
        console.error(`❌ Error processing assignment ${assignment.id}:`, error)
      }
    }

    console.log('Finished calculating results for existing assignments')
  } catch (error) {
    console.error('Error in calculateExistingResults:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
calculateExistingResults()
