'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import TestResultsAnalysis from '@/components/test/TestResultsAnalysis'
import StudentHeader from '@/components/student/StudentHeader'

interface WritingNote {
  id: string
  start: number
  end: number
  text: string
  category: string
  comment: string
}

type ModuleType = 'LISTENING' | 'READING' | 'WRITING'

interface TestResultsData {
  testTitle: string
  testDate: string
  candidateNumber: string
  studentName: string
  mockTestId: string
  testType: ModuleType
  itemWiseModuleType?: ModuleType | null
  bandScores: {
    listening: number
    reading: number
    writing: number
    speaking?: number
  }
  overallBand?: number
  detailedScores?: any
  questionDetails?: {
    reading?: Array<{
      id: string
      question: string
      type: string
      part: number
      options?: string[]
      studentAnswer: string
      correctAnswer: string
      isCorrect: boolean
      explanation?: string
    }>
    listening?: Array<{
      id: string
      question: string
      type: string
      part: number
      options?: string[]
      studentAnswer: string
      correctAnswer: string
      isCorrect: boolean
      explanation?: string
    }>
    writing?: Array<{
      id: string
      question: string
      type: string
      part: number
      studentAnswer: string
      notes?: WritingNote[]
      correctAnswer: string
      isCorrect: boolean | null
      explanation?: string
      wordCount?: number
    }>
  }
  feedback?: {
    writing: Array<{
      questionId: string
      category: string
      text: string
      comment: string
      range: [number, number]
    }>
  }
  generatedAt: string
  status: string
}

interface TestResultsDetailClientProps {
  testId: string
  initialResults: TestResultsData | null
  initialError: string | null
  initialTab?: 'brief' | 'writing' | 'question-wise'
}

export default function TestResultsDetailClient({
  testId,
  initialResults,
  initialError,
  initialTab
}: TestResultsDetailClientProps) {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'brief' | 'writing' | 'question-wise' | undefined>(initialTab)
  
  useEffect(() => {
    // Get tab from URL query parameter
    const urlTab = searchParams?.get('tab')
    if (urlTab && ['brief', 'writing', 'question-wise'].includes(urlTab)) {
      setTab(urlTab as 'brief' | 'writing' | 'question-wise')
    } else {
      setTab(initialTab)
    }
  }, [searchParams, initialTab])

  // If we have initial results, pass them to TestResultsAnalysis
  // TestResultsAnalysis will still handle client-side polling for updates
  return (
    <>
      <StudentHeader />
      <TestResultsAnalysis 
        testId={testId} 
        initialTab={tab}
        initialResults={initialResults}
        initialError={initialError}
      />
    </>
  )
}

