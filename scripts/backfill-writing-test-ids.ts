import { prisma } from '../lib/db'

async function backfillWritingTestIds() {
  try {
    console.log('Starting backfill of writing test IDs in reading tests...')

    // Get all reading tests
    const readingTests = await prisma.readingTest.findMany({
      include: {
        writingTests: {
          select: {
            id: true
          },
          take: 1 // Get the first writing test
        }
      }
    })

    let updated = 0
    for (const readingTest of readingTests) {
      if (readingTest.writingTests.length > 0 && !readingTest.writingTestId) {
        await prisma.readingTest.update({
          where: { id: readingTest.id },
          data: { writingTestId: readingTest.writingTests[0].id }
        })
        updated++
        console.log(`Updated reading test "${readingTest.title}" with writing test ID: ${readingTest.writingTests[0].id}`)
      }
    }

    console.log(`✅ Backfill completed. Updated ${updated} reading tests.`)
  } catch (error) {
    console.error('Error during backfill:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

backfillWritingTestIds()

