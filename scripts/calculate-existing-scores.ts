#!/usr/bin/env tsx

import { prisma } from '../lib/db'
import { scoreReading, scoreListening } from '../lib/scoring/auto-scorer'
import { calculateReadingBand, calculateListeningBand, calculateOverallBand } from '../lib/scoring/band-calculator'

async function calculateExistingScores() {
  console.log('🔄 Calculating scores for existing submissions...\n')

  try {
    // Get all assignments with submissions
    const assignments = await prisma.assignment.findMany({
      include: {
        submissions: {
          include: {
            module: {
              include: {
                questions: {
                  include: {
                    questionBank: true
                  }
                }
              }
            }
          }
        },
        result: true
      }
    })

    console.log(`Found ${assignments.length} assignments to process\n`)

    for (const assignment of assignments) {
      console.log(`📝 Processing Assignment: ${assignment.id}`)
      console.log(`   Status: ${assignment.status}`)
      console.log(`   Submissions: ${assignment.submissions.length}`)

      let hasUpdates = false

      // Process each submission
      for (const submission of assignment.submissions) {
        console.log(`   📊 Processing ${submission.module.type} submission...`)

        // Only calculate auto-scores for listening and reading
        if ((submission.module.type === 'LISTENING' || submission.module.type === 'READING') && 
            submission.autoScore === null && 
            submission.answersJson) {
          
          try {
            const answers = submission.answersJson as Record<string, any>
            
            // Convert answers to the format expected by scoring functions
            const studentAnswers = Object.entries(answers).map(([questionId, answer]) => ({
              questionId,
              answer: String(answer)
            }))

            // Get correct answers from questions
            const correctAnswers = submission.module.questions.map(q => {
              // Map Prisma QuestionType to the supported types in auto-scorer
              let mappedType: string = q.questionBank.type
              switch (q.questionBank.type) {
                case 'TRUE_FALSE_NOT_GIVEN':
                  mappedType = 'NOT_GIVEN' // Map to the closest equivalent
                  break
                case 'MULTIPLE_CHOICE':
                  mappedType = 'MCQ' // Map to the closest equivalent
                  break
                case 'NOTES_COMPLETION':
                case 'SUMMARY_COMPLETION':
                  mappedType = 'FIB' // Map to the closest equivalent
                  break
                default:
                  mappedType = q.questionBank.type
                  break
              }
              
              return {
                questionId: q.id,
                answer: (q.questionBank.contentJson as any)?.correctAnswer || '',
                type: mappedType as 'MCQ' | 'FIB' | 'MATCHING' | 'TRUE_FALSE' | 'NOT_GIVEN'
              }
            })

            // Calculate score
            let scoreResult
            let bandScore

            if (submission.module.type === 'READING') {
              scoreResult = scoreReading(studentAnswers, correctAnswers)
              bandScore = calculateReadingBand(scoreResult.correctCount)
            } else if (submission.module.type === 'LISTENING') {
              scoreResult = scoreListening(studentAnswers, correctAnswers)
              bandScore = calculateListeningBand(scoreResult.correctCount)
            }

            if (bandScore !== undefined) {
              // Update submission with auto-score
              await prisma.submission.update({
                where: { id: submission.id },
                data: { autoScore: bandScore }
              })

              console.log(`     ✅ Calculated ${submission.module.type} band: ${bandScore}`)
              hasUpdates = true
            }

          } catch (error: any) {
            console.log(`     ❌ Error calculating ${submission.module.type} score:`, error.message)
          }
        } else {
          console.log(`     ⏭️  Skipping ${submission.module.type} (${submission.autoScore !== null ? 'already scored' : 'no answers'})`)
        }
      }

      // Check if we can create a result now
      if (hasUpdates) {
        console.log(`   🔍 Checking if result can be created...`)
        
        const updatedSubmissions = await prisma.submission.findMany({
          where: { assignmentId: assignment.id },
          include: { 
            module: true,
            instructorMarks: true
          }
        })

        const listeningSubmission = updatedSubmissions.find(s => s.module.type === 'LISTENING')
        const readingSubmission = updatedSubmissions.find(s => s.module.type === 'READING')
        const writingSubmission = updatedSubmissions.find(s => s.module.type === 'WRITING')
        const speakingSubmission = updatedSubmissions.find(s => s.module.type === 'SPEAKING')

        // Check if we have auto-scores for listening and reading
        if (listeningSubmission?.autoScore !== null && readingSubmission?.autoScore !== null) {
          console.log(`   📈 Creating result with auto-scores...`)
          
          const listeningBand = listeningSubmission?.autoScore || 0
          const readingBand = readingSubmission?.autoScore || 0
          
          // For writing and speaking, use 0 if no instructor marks
          const writingBand = writingSubmission?.instructorMarks?.[0]?.overallBand || 0
          const speakingBand = speakingSubmission?.instructorMarks?.[0]?.overallBand || 0

          const overallBand = calculateOverallBand({
            listening: listeningBand,
            reading: readingBand,
            writing: writingBand,
            speaking: speakingBand
          })

          // Create or update result
          await prisma.result.upsert({
            where: { assignmentId: assignment.id },
            update: {
              listeningBand,
              readingBand,
              writingBand,
              speakingBand,
              overallBand
            },
            create: {
              assignmentId: assignment.id,
              listeningBand,
              readingBand,
              writingBand,
              speakingBand,
              overallBand
            }
          })

          console.log(`   ✅ Result created with bands: L:${listeningBand} R:${readingBand} W:${writingBand} S:${speakingBand} Overall:${overallBand}`)
        }
      }

      console.log()
    }

    console.log('✅ Score calculation completed!')

  } catch (error) {
    console.error('❌ Error calculating scores:', error)
  } finally {
    await prisma.$disconnect()
  }
}

calculateExistingScores()
