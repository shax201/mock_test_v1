import { prisma } from '@/lib/db'
import { calculateListeningBand, calculateReadingBand, calculateWritingBand } from './band-calculator'

export async function calculateAndStoreResults(assignmentId: string) {
  try {
    // Get all submissions for this assignment
    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: {
        module: true
      }
    })

    if (submissions.length === 0) {
      console.log('No submissions found for assignment:', assignmentId)
      return null
    }

    // Calculate band scores for each module
    let listeningBand = 0
    let readingBand = 0
    let writingBand = 0
    let speakingBand = 0

    submissions.forEach(submission => {
      const moduleType = submission.module.type
      const autoScore = submission.autoScore || 0

      switch (moduleType) {
        case 'LISTENING':
          listeningBand = calculateListeningBand(autoScore)
          break
        case 'READING':
          readingBand = calculateReadingBand(autoScore)
          break
        case 'WRITING':
          writingBand = autoScore // Writing is manually graded, so autoScore is already the band
          break
        case 'SPEAKING':
          speakingBand = autoScore // Speaking is manually graded, so autoScore is already the band
          break
      }
    })

    // Calculate overall band (average of available modules)
    const availableBands = [listeningBand, readingBand, writingBand, speakingBand].filter(band => band > 0)
    const overallBand = availableBands.length > 0 
      ? Math.round((availableBands.reduce((sum, band) => sum + band, 0) / availableBands.length) * 10) / 10
      : 0

    console.log('Calculated bands:', {
      listening: listeningBand,
      reading: readingBand,
      writing: writingBand,
      speaking: speakingBand,
      overall: overallBand
    })

    // Check if result already exists
    const existingResult = await prisma.result.findUnique({
      where: { assignmentId }
    })

    let result
    if (existingResult) {
      // Update existing result
      result = await prisma.result.update({
        where: { assignmentId },
        data: {
          listeningBand,
          readingBand,
          writingBand,
          speakingBand,
          overallBand,
          generatedAt: new Date()
        }
      })
    } else {
      // Create new result
      result = await prisma.result.create({
        data: {
          assignmentId,
          listeningBand,
          readingBand,
          writingBand,
          speakingBand,
          overallBand,
          generatedAt: new Date()
        }
      })
    }

    // Update assignment status to COMPLETED if all modules are submitted
    const allModulesSubmitted = submissions.every(submission => submission.submittedAt !== null)
    if (allModulesSubmitted) {
      await prisma.assignment.update({
        where: { id: assignmentId },
        data: { status: 'COMPLETED' }
      })
    }

    console.log('Result created/updated:', result.id)
    return result

  } catch (error) {
    console.error('Error calculating and storing results:', error)
    throw error
  }
}
