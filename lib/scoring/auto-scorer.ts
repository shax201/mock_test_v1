interface StudentAnswer {
  questionId: string
  answer: string
}

interface CorrectAnswer {
  questionId: string
  answer: string | string[]
  type: 'MCQ' | 'FIB' | 'MATCHING' | 'TRUE_FALSE' | 'NOT_GIVEN'
}

export function scoreListening(
  studentAnswers: StudentAnswer[],
  correctAnswers: CorrectAnswer[]
): { correctCount: number; totalQuestions: number; score: number } {
  let correctCount = 0
  const totalQuestions = correctAnswers.length

  for (const correctAnswer of correctAnswers) {
    const studentAnswer = studentAnswers.find(sa => sa.questionId === correctAnswer.questionId)
    
    if (!studentAnswer) continue

    const isCorrect = checkAnswerCorrectness(
      studentAnswer.answer,
      correctAnswer.answer,
      correctAnswer.type
    )

    if (isCorrect) {
      correctCount++
    }
  }

  return {
    correctCount,
    totalQuestions,
    score: correctCount
  }
}

export function scoreReading(
  studentAnswers: StudentAnswer[],
  correctAnswers: CorrectAnswer[]
): { correctCount: number; totalQuestions: number; score: number } {
  // Same logic as listening
  return scoreListening(studentAnswers, correctAnswers)
}

function checkAnswerCorrectness(
  studentAnswer: string,
  correctAnswer: string | string[],
  type: string
): boolean {
  // Normalize answers (trim, lowercase)
  let normalizedStudent = studentAnswer.trim().toLowerCase()
  
  // For multiple choice questions, extract the letter if the answer is in format "A) Option text"
  if (type === 'MCQ' || type === 'MULTIPLE_CHOICE') {
    const letterMatch = normalizedStudent.match(/^([a-d])\)/)
    if (letterMatch) {
      normalizedStudent = letterMatch[1]
    }
  }
  
  if (Array.isArray(correctAnswer)) {
    // Multiple correct answers (e.g., for fill-in-blanks)
    return correctAnswer.some(ca => 
      ca.trim().toLowerCase() === normalizedStudent
    )
  } else {
    // Single correct answer
    return correctAnswer.trim().toLowerCase() === normalizedStudent
  }
}

export function calculateModuleScore(
  correctCount: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0
  return (correctCount / totalQuestions) * 100
}

export function validateAnswerFormat(
  answer: string,
  type: string
): boolean {
  switch (type) {
    case 'MCQ':
      // Should be single letter (A, B, C, D) or option text
      return /^[A-D]$/i.test(answer.trim()) || answer.trim().length > 0
    case 'FIB':
      // Should be non-empty text
      return answer.trim().length > 0
    case 'TRUE_FALSE':
    case 'NOT_GIVEN':
      // Should be True, False, or Not Given
      return /^(true|false|not given)$/i.test(answer.trim())
    case 'MATCHING':
      // Should be non-empty
      return answer.trim().length > 0
    default:
      return true
  }
}

export function getScoreFeedback(score: number): string {
  if (score >= 90) return 'Excellent work!'
  if (score >= 80) return 'Very good performance.'
  if (score >= 70) return 'Good work, keep practicing.'
  if (score >= 60) return 'Satisfactory, room for improvement.'
  if (score >= 50) return 'Needs more practice.'
  return 'Consider reviewing the material and practicing more.'
}
