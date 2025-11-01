'use client'

import TestResultsAnalysis from '@/components/test/TestResultsAnalysis'

interface TestResultsPageProps {
  params: Promise<{ testId: string }>
}

export default async function TestResultsPage({ params }: TestResultsPageProps) {
  const { testId } = await params
  
  return <TestResultsAnalysis testId={testId} />
}
