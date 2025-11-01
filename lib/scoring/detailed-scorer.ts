import { prisma } from '@/lib/db'
import { scoreListening, scoreReading } from './auto-scorer'
import { calculateListeningBand, calculateReadingBand } from './band-calculator'

export interface DetailedScoreResult {
  moduleType: 'READING' | 'LISTENING' | 'WRITING'
  bandScore: number
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  partScores: {
    part1: { score: number; total: number; correct: number; bandScore: number }
    part2: { score: number; total: number; correct: number; bandScore: number }
    part3: { score: number; total: number; correct: number; bandScore: number }
  }
  questionTypeScores: {
    type: string
    correct: number
    total: number
    accuracy: number
    bandScore: number
  }[]
  submissionDetails: {
    submissionId: string
    submittedAt: Date
    timeSpent?: number
  }
}

export interface StudentAnswer {
  questionId: string
  answer: string
}

export interface CorrectAnswer {
  questionId: string
  answer: string | string[]
  type: 'MCQ' | 'FIB' | 'MATCHING' | 'TRUE_FALSE' | 'NOT_GIVEN'
  part?: number
}

export async function calculateDetailedScore(
  submissionId: string,
  moduleType: 'READING' | 'LISTENING'
): Promise<DetailedScoreResult> {
  // Get submission with questions
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      module: {
        include: {
          questions: {
            include: {
              questionBank: true
            },
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  })

  if (!submission) {
    throw new Error('Submission not found')
  }

  const studentAnswers: StudentAnswer[] = Object.entries(submission.answersJson as Record<string, any>).map(
    ([questionId, answer]) => ({
      questionId,
      answer: String(answer || '')
    })
  )

  const correctAnswers: CorrectAnswer[] = submission.module.questions.map(q => {
    const contentJson = q.questionBank.contentJson as any
    const part = contentJson.part || 1
    
    // Map question types
    let mappedType: 'MCQ' | 'FIB' | 'MATCHING' | 'TRUE_FALSE' | 'NOT_GIVEN' = 'MCQ'
    switch (q.questionBank.type) {
      case 'TRUE_FALSE_NOT_GIVEN':
        mappedType = 'NOT_GIVEN'
        break
      case 'MULTIPLE_CHOICE':
        mappedType = 'MCQ'
        break
      case 'NOTES_COMPLETION':
      case 'SUMMARY_COMPLETION':
      case 'FIB':
        mappedType = 'FIB'
        break
      default:
        mappedType = 'MCQ'
        break
    }

    return {
      questionId: q.id,
      answer: typeof q.correctAnswerJson === 'string' ? q.correctAnswerJson : 
              Array.isArray(q.correctAnswerJson) ? q.correctAnswerJson.map(String) : 
              String(q.correctAnswerJson || ''),
      type: mappedType,
      part
    }
  })

  // Calculate overall score
  const overallScore = moduleType === 'READING' 
    ? scoreReading(studentAnswers, correctAnswers)
    : scoreListening(studentAnswers, correctAnswers)

  const bandScore = moduleType === 'READING'
    ? calculateReadingBand(overallScore.correctCount)
    : calculateListeningBand(overallScore.correctCount)

  // Calculate part-wise scores
  const partScores = calculatePartScores(studentAnswers, correctAnswers, moduleType)

  // Calculate question type scores
  const questionTypeScores = calculateQuestionTypeScores(studentAnswers, correctAnswers, moduleType)

  return {
    moduleType,
    bandScore,
    totalQuestions: overallScore.totalQuestions,
    correctAnswers: overallScore.correctCount,
    accuracy: Math.round((overallScore.correctCount / overallScore.totalQuestions) * 100),
    partScores,
    questionTypeScores,
    submissionDetails: {
      submissionId: submission.id,
      submittedAt: submission.submittedAt || submission.startedAt,
      timeSpent: undefined // Could be calculated from start/end times
    }
  }
}

function calculatePartScores(
  studentAnswers: StudentAnswer[],
  correctAnswers: CorrectAnswer[],
  moduleType: 'READING' | 'LISTENING'
) {
  const parts = [1, 2, 3]
  const partScores: any = {}

  for (const part of parts) {
    const partQuestions = correctAnswers.filter(q => q.part === part)
    const partStudentAnswers = studentAnswers.filter(sa => 
      partQuestions.some(pq => pq.questionId === sa.questionId)
    )

    const partScore = moduleType === 'READING'
      ? scoreReading(partStudentAnswers, partQuestions)
      : scoreListening(partStudentAnswers, partQuestions)

    const partBandScore = moduleType === 'READING'
      ? calculateReadingBand(partScore.correctCount)
      : calculateListeningBand(partScore.correctCount)

    partScores[`part${part}`] = {
      score: Math.round((partScore.correctCount / partScore.totalQuestions) * 100),
      total: partScore.totalQuestions,
      correct: partScore.correctCount,
      bandScore: partBandScore
    }
  }

  return partScores
}

function calculateQuestionTypeScores(
  studentAnswers: StudentAnswer[],
  correctAnswers: CorrectAnswer[],
  moduleType: 'READING' | 'LISTENING'
) {
  const questionTypes = ['MCQ', 'FIB', 'MATCHING', 'TRUE_FALSE', 'NOT_GIVEN']
  const typeScores: any[] = []

  for (const type of questionTypes) {
    const typeQuestions = correctAnswers.filter(q => q.type === type)
    if (typeQuestions.length === 0) continue

    const typeStudentAnswers = studentAnswers.filter(sa => 
      typeQuestions.some(tq => tq.questionId === sa.questionId)
    )

    const typeScore = moduleType === 'READING'
      ? scoreReading(typeStudentAnswers, typeQuestions)
      : scoreListening(typeStudentAnswers, typeQuestions)

    const typeBandScore = moduleType === 'READING'
      ? calculateReadingBand(typeScore.correctCount)
      : calculateListeningBand(typeScore.correctCount)

    typeScores.push({
      type: getQuestionTypeDisplayName(type),
      correct: typeScore.correctCount,
      total: typeScore.totalQuestions,
      accuracy: Math.round((typeScore.correctCount / typeScore.totalQuestions) * 100),
      bandScore: typeBandScore
    })
  }

  return typeScores
}

function getQuestionTypeDisplayName(type: string): string {
  switch (type) {
    case 'MCQ':
      return 'Multiple Choice'
    case 'FIB':
      return 'Fill in the Blank'
    case 'MATCHING':
      return 'Matching'
    case 'TRUE_FALSE':
      return 'True/False'
    case 'NOT_GIVEN':
      return 'True/False/Not Given'
    default:
      return type
  }
}

export async function calculateAllModuleScores(assignmentId: string): Promise<{
  reading?: DetailedScoreResult
  listening?: DetailedScoreResult
  writing?: any // Writing scoring is more complex and manual
}> {
  const submissions = await prisma.submission.findMany({
    where: { assignmentId },
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
  })

  const results: any = {}

  for (const submission of submissions) {
    const moduleType = submission.module.type as 'READING' | 'LISTENING' | 'WRITING'
    
    if (moduleType === 'READING' || moduleType === 'LISTENING') {
      results[moduleType.toLowerCase()] = await calculateDetailedScore(submission.id, moduleType)
    } else if (moduleType === 'WRITING') {
      // Writing scoring is typically manual, but we can provide basic metrics
      results.writing = {
        moduleType: 'WRITING',
        bandScore: submission.autoScore || 0,
        totalQuestions: 2, // Writing typically has 2 tasks
        correctAnswers: 0, // Not applicable for writing
        accuracy: 0,
        partScores: {
          part1: { score: 0, total: 1, correct: 0, bandScore: 0 },
          part2: { score: 0, total: 1, correct: 0, bandScore: 0 }
        },
        questionTypeScores: [],
        submissionDetails: {
          submissionId: submission.id,
          submittedAt: submission.submittedAt || submission.startedAt
        }
      }
    }
  }

  return results
}
