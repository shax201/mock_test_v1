'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import TestResultsAnalysis from '@/components/test/TestResultsAnalysis'
import StudentHeader from '@/components/student/StudentHeader'

export default function TestResultsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const testId = params?.testId as string
  const [initialTab, setInitialTab] = useState<'brief' | 'writing' | 'question-wise' | undefined>()
  
  useEffect(() => {
    // Get tab from URL query parameter
    const tab = searchParams?.get('tab')
    if (tab && ['brief', 'writing', 'question-wise'].includes(tab)) {
      setInitialTab(tab as 'brief' | 'writing' | 'question-wise')
    }
  }, [searchParams])
  
  return (
    <>
      <StudentHeader />
      <TestResultsAnalysis testId={testId} initialTab={initialTab} />
    </>
  )
}
