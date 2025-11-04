'use client'

import { useParams } from 'next/navigation'
import TestResultsAnalysis from '@/components/test/TestResultsAnalysis'
import StudentHeader from '@/components/student/StudentHeader'

export default function TestResultsPage() {
  const params = useParams()
  const testId = params?.testId as string
  
  return (
    <>
      <StudentHeader />
      <TestResultsAnalysis testId={testId} />
    </>
  )
}
