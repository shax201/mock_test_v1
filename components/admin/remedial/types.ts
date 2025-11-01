export interface PassageSection {
  id: string
  number: number
  content: string
  hasHeading?: boolean
  heading?: string
}

export interface QuestionData {
  id: string
  passage?: {
    title: string
    sections: PassageSection[]
  }
  headings?: string[]
  questions?: string[]
  options?: string[]
  questionAudios?: Array<{ url: string; publicId?: string }>
  correctAnswers: Record<string, string>
  correctAnswer?: string
  instructions: string
}

export interface MockTest {
  id: string
  title: string
  description: string | null
  modules: Array<{ type: string }>
}

export interface RemedialTestData {
  title: string
  description: string
  type: string
  module: string
  difficulty: string
  duration: number
  audioUrl?: string
  audioPublicId?: string
  mockTestId?: string
  questions: QuestionData[]
}


