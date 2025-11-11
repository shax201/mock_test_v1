'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save } from 'lucide-react'
import BasicTestInfo from '@/components/admin/sections/basic-test-info'
import PassageSection from '@/components/admin/sections/passage-section'
import BandScoreSection from '@/components/admin/sections/band-score-section'
import PassageConfigSection from '@/components/admin/sections/passage-config-section'
import QuestionSection from '@/components/admin/sections/question-section'

export default function EditReadingTestPage() {
  const router = useRouter()
  const params = useParams()
  const [testData, setTestData] = useState({
    title: '',
    totalQuestions: 40,
    totalTimeMinutes: 60,
    isActive: true,
  })
  const [passages, setPassages] = useState<any[]>([])
  const [bandScores, setBandScores] = useState<any[]>([])
  const [passageConfigs, setPassageConfigs] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [activeSection, setActiveSection] = useState('basic')
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [originalData, setOriginalData] = useState<any>(null)

  useEffect(() => {
    if (params.id) {
      fetchTestData()
    }
  }, [params.id])

  const fetchTestData = async () => {
    try {
      const response = await fetch(`/api/admin/reading-tests/${params.id}`)
      const data = await response.json()

      if (response.ok && data.readingTest) {
        const test = data.readingTest
        
        // Set basic test data
        setTestData({
          title: test.title || '',
          totalQuestions: test.totalQuestions || 40,
          totalTimeMinutes: test.totalTimeMinutes || 60,
          isActive: test.isActive !== undefined ? test.isActive : true,
        })

        // Transform passages
        const transformedPassages = (test.passages || []).map((passage: any, index: number) => ({
          id: Date.now() + index,
          title: passage.title || '',
          order: passage.order || index + 1,
          contents: (passage.contents || []).map((content: any) => ({
            contentId: content.contentId || '',
            text: content.text || '',
            order: content.order || 0
          }))
        }))
        setPassages(transformedPassages)

        // Transform questions
        const transformedQuestions: any[] = []
        test.passages.forEach((passage: any, passageIndex: number) => {
          (passage.questions || []).forEach((question: any) => {
            transformedQuestions.push({
              id: Date.now() + transformedQuestions.length,
              passageId: String(transformedPassages[passageIndex].id),
              questionNumber: question.questionNumber || 0,
              type: question.type || 'multiple-choice',
              questionText: question.questionText || '',
              options: question.options || [],
              headingsList: question.headingsList || [],
              summaryText: question.summaryText || '',
              subQuestions: question.subQuestions || [],
              points: question.points || 1,
              correctAnswer: question.correctAnswer?.answer || ''
            })
          })
        })
        setQuestions(transformedQuestions)

        // Transform band scores
        const transformedBandScores = (test.bandScoreRanges || []).map((range: any, index: number) => ({
          id: Date.now() + index,
          minScore: range.minScore || 0,
          band: range.band || 0
        }))
        setBandScores(transformedBandScores)

        // Transform passage configs
        let transformedConfigs: any[] = []
        if (test.passageConfigs && test.passageConfigs.length > 0) {
          transformedConfigs = test.passageConfigs.map((config: any, index: number) => ({
            id: Date.now() + index,
            part: config.part ?? (index + 1),
            total: config.total ?? 0,
            start: config.start ?? 1
          }))
          setPassageConfigs(transformedConfigs)
        } else {
          // If no passage configs exist, don't set default ones with 0 values
          // Let the user add them manually
          setPassageConfigs([])
        }

        // Store original data for comparison
        setOriginalData({
          testData: {
            title: test.title || '',
            totalQuestions: test.totalQuestions || 40,
            totalTimeMinutes: test.totalTimeMinutes || 60,
            isActive: test.isActive !== undefined ? test.isActive : true,
          },
          passages: transformedPassages,
          questions: transformedQuestions,
          bandScores: transformedBandScores,
          passageConfigs: transformedConfigs
        })
      } else {
        setError(data.error || 'Failed to load test data')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBasicInfoChange = (field: string, value: any) => {
    setTestData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddPassage = (passage: any) => {
    setPassages([...passages, { ...passage, id: Date.now() }])
  }

  const handleRemovePassage = (id: number) => {
    setPassages(passages.filter((p) => p.id !== id))
    // Also remove questions associated with this passage
    setQuestions(questions.filter((q) => q.passageId !== String(id)))
  }

  const handleUpdatePassage = (id: number, updatedPassage: any) => {
    setPassages(passages.map((p) => (p.id === id ? { ...updatedPassage, id } : p)))
  }

  const handleAddBandScore = (score: any) => {
    setBandScores([...bandScores, { ...score, id: Date.now() }])
  }

  const handleRemoveBandScore = (id: number) => {
    setBandScores(bandScores.filter((b) => b.id !== id))
  }

  const handleAddPassageConfig = (config: any) => {
    setPassageConfigs([...passageConfigs, { ...config, id: Date.now() }])
  }

  const handleRemovePassageConfig = (id: number) => {
    setPassageConfigs(passageConfigs.filter((c) => c.id !== id))
  }

  const handleUpdatePassageConfig = (id: number, updatedConfig: any) => {
    setPassageConfigs(passageConfigs.map((c) => (c.id === id ? { ...updatedConfig, id } : c)))
  }

  const handleAddQuestion = (question: any) => {
    setQuestions([...questions, { ...question, id: Date.now() }])
  }

  const handleRemoveQuestion = (id: number) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleUpdateQuestion = (id: number, updatedQuestion: any) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...updatedQuestion, id } : q)))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')
    try {
      // Validate
      if (!testData.title) {
        setError('Please enter a test title')
        setIsLoading(false)
        return
      }

      if (passages.length === 0) {
        setError('Please add at least one passage')
        setIsLoading(false)
        return
      }

      if (bandScores.length === 0) {
        setError('Please add band score ranges')
        setIsLoading(false)
        return
      }

      if (questions.length === 0) {
        setError('Please add at least one question')
        setIsLoading(false)
        return
      }

      // Transform data for API
      const transformedPassages = passages.map((passage) => ({
        title: passage.title,
        order: passage.order,
        contents: {
          create: passage.contents?.map((content: any) => ({
            contentId: content.contentId,
            text: content.text,
            order: content.order
          })) || []
        },
        questions: {
          create: questions
            .filter((q) => q.passageId === String(passage.id))
            .map((question) => ({
              questionNumber: question.questionNumber,
              type: question.type,
              questionText: question.questionText,
              options: question.options,
              headingsList: question.headingsList,
              summaryText: question.summaryText,
              subQuestions: question.subQuestions,
              points: question.points || 1,
              correctAnswer: question.correctAnswer ? {
                create: {
                  answer: question.correctAnswer
                }
              } : undefined
            }))
        }
      }))

      const payload = {
        title: testData.title,
        totalQuestions: testData.totalQuestions,
        totalTimeMinutes: testData.totalTimeMinutes,
        passages: transformedPassages,
        bandScoreRanges: bandScores.map(({ id, ...b }) => b),
        passageConfigs: passageConfigs.map(({ id, ...c }) => c)
      }

      const response = await fetch(`/api/admin/reading-tests/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update test')
      }

      const result = await response.json()
      
      // Refresh data from response
      if (result.readingTest) {
        const test = result.readingTest
        
        // Update state with fresh data
        setTestData({
          title: test.title || '',
          totalQuestions: test.totalQuestions || 40,
          totalTimeMinutes: test.totalTimeMinutes || 60,
          isActive: test.isActive !== undefined ? test.isActive : true,
        })

        // Transform and update passages
        const transformedPassages = (test.passages || []).map((passage: any, index: number) => ({
          id: Date.now() + index,
          title: passage.title || '',
          order: passage.order || index + 1,
          contents: (passage.contents || []).map((content: any) => ({
            contentId: content.contentId || '',
            text: content.text || '',
            order: content.order || 0
          }))
        }))
        setPassages(transformedPassages)

        // Transform and update questions
        const transformedQuestions: any[] = []
        test.passages.forEach((passage: any, passageIndex: number) => {
          (passage.questions || []).forEach((question: any) => {
            transformedQuestions.push({
              id: Date.now() + transformedQuestions.length,
              passageId: String(transformedPassages[passageIndex].id),
              questionNumber: question.questionNumber || 0,
              type: question.type || 'multiple-choice',
              questionText: question.questionText || '',
              options: question.options || [],
              headingsList: question.headingsList || [],
              summaryText: question.summaryText || '',
              subQuestions: question.subQuestions || [],
              points: question.points || 1,
              correctAnswer: question.correctAnswer?.answer || ''
            })
          })
        })
        setQuestions(transformedQuestions)

        // Transform and update band scores
        const transformedBandScores = (test.bandScoreRanges || []).map((range: any, index: number) => ({
          id: Date.now() + index,
          minScore: range.minScore || 0,
          band: range.band || 0
        }))
        setBandScores(transformedBandScores)

        // Transform and update passage configs
        if (test.passageConfigs && test.passageConfigs.length > 0) {
          const transformedConfigs = test.passageConfigs.map((config: any, index: number) => ({
            id: Date.now() + index,
            part: config.part ?? (index + 1),
            total: config.total ?? 0,
            start: config.start ?? 1
          }))
          setPassageConfigs(transformedConfigs)
        } else {
          setPassageConfigs([])
        }

        // Update original data
        setOriginalData({
          testData: {
            title: test.title || '',
            totalQuestions: test.totalQuestions || 40,
            totalTimeMinutes: test.totalTimeMinutes || 60,
            isActive: test.isActive !== undefined ? test.isActive : true,
          },
          passages: transformedPassages,
          questions: transformedQuestions,
          bandScores: transformedBandScores,
          passageConfigs: test.passageConfigs || []
        })
      }

      // Show success message
      alert('Reading test updated successfully!')
      
      // Optionally redirect after a short delay, or let user stay on page
      // router.push('/admin/reading-tests')
    } catch (error) {
      setError('Error updating test: ' + (error as Error).message)
      console.error('Update error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
        <Link
          href="/admin/reading-tests"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Reading Tests
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Edit Reading Test
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Update the reading test details, passages, questions, and configurations.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/admin/reading-tests"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Reading Tests
          </Link>
        </div>
      </div>

      {/* Reading Test Form */}
      <Card className="p-6">
        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="passages">Passages</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="bands">Band Scores</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <BasicTestInfo testData={testData} onChange={handleBasicInfoChange} />
          </TabsContent>

          <TabsContent value="passages" className="space-y-4">
            <PassageSection 
              passages={passages} 
              onAdd={handleAddPassage} 
              onRemove={handleRemovePassage}
              onUpdate={handleUpdatePassage}
            />
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            <QuestionSection
              questions={questions}
              passages={passages}
              passageConfigs={passageConfigs}
              onAdd={handleAddQuestion}
              onRemove={handleRemoveQuestion}
              onUpdate={handleUpdateQuestion}
            />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <PassageConfigSection
              configs={passageConfigs}
              onAdd={handleAddPassageConfig}
              onRemove={handleRemovePassageConfig}
              onUpdate={handleUpdatePassageConfig}
            />
          </TabsContent>

          <TabsContent value="bands" className="space-y-4">
            <BandScoreSection scores={bandScores} onAdd={handleAddBandScore} onRemove={handleRemoveBandScore} />
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-8 pt-6 border-t">
          <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />
            {isLoading ? 'Updating...' : 'Update Reading Test'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

