'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import BasicTestInfo from './sections/basic-test-info'
import PassageSection from './sections/passage-section'
import PassageConfigSection from './sections/passage-config-section'
import WritingQuestionSection from './sections/writing-question-section'

interface WritingTestFormProps {
  testId?: string
  initialData?: any
  mode?: 'create' | 'edit'
}

export default function WritingTestForm({ testId, initialData, mode = 'create' }: WritingTestFormProps) {
  const router = useRouter()
  const [testData, setTestData] = useState({
    title: '',
    readingTestId: '',
    totalQuestions: 0, // Not used for writing but needed for BasicTestInfo
    totalTimeMinutes: 60,
    isActive: true
  })

  const [readingTests, setReadingTests] = useState<any[]>([])
  const [selectedReadingTest, setSelectedReadingTest] = useState<any>(null)
  const [passages, setPassages] = useState<any[]>([])
  const [passageConfigs, setPassageConfigs] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [activeSection, setActiveSection] = useState('basic')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Fetch reading tests
    fetch('/api/admin/reading-tests')
      .then((res) => res.json())
      .then((data) => {
        if (data.readingTests) {
          setReadingTests(data.readingTests)
        }
      })
      .catch((err) => console.error('Error fetching reading tests:', err))
  }, [])

  // Load initial data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTestData({
        title: initialData.title || '',
        readingTestId: initialData.readingTestId || '',
        totalQuestions: 0,
        totalTimeMinutes: initialData.totalTimeMinutes || 60,
        isActive: initialData.isActive !== undefined ? initialData.isActive : true
      })

      // Transform passages from database structure to form structure
      if (initialData.passages && Array.isArray(initialData.passages)) {
        const transformedPassages = initialData.passages.map((passage: any, index: number) => ({
          id: passage.id || Date.now() + index,
          title: passage.title || '',
          order: passage.order || index + 1,
          contents: (passage.contents || []).map((content: any) => ({
            contentId: content.contentId || '',
            text: content.text || ''
          }))
        }))
        setPassages(transformedPassages)

        // Transform questions - must be done after passages are set to ensure ID matching
        const allQuestions: any[] = []
        transformedPassages.forEach((transformedPassage: any) => {
          // Find the original passage to get its questions
          const originalPassage = initialData.passages.find((p: any) => p.id === transformedPassage.id)
          if (originalPassage && originalPassage.questions && Array.isArray(originalPassage.questions)) {
            originalPassage.questions.forEach((question: any) => {
              allQuestions.push({
                id: question.id || `q-${Date.now()}-${Math.random()}`,
                passageId: String(transformedPassage.id), // Use the transformed passage ID (ensure it's a string)
                questionNumber: question.questionNumber,
                type: question.type,
                questionText: question.questionText || '',
                readingPassageId: question.readingPassageId || null,
                points: question.points || 1
              })
            })
          }
        })
        setQuestions(allQuestions)
      }

      // Transform passage configs
      if (initialData.passageConfigs && Array.isArray(initialData.passageConfigs)) {
        const transformedConfigs = initialData.passageConfigs.map((config: any, index: number) => ({
          id: config.id || Date.now() + index,
          part: config.part,
          total: config.total,
          start: config.start
        }))
        setPassageConfigs(transformedConfigs)
      }
    }
  }, [mode, initialData])

  useEffect(() => {
    if (testData.readingTestId) {
      // Always fetch full reading test details with passages
      fetch(`/api/admin/reading-tests/${testData.readingTestId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.readingTest) {
            setSelectedReadingTest(data.readingTest)
          }
        })
        .catch((err) => console.error('Error fetching reading test details:', err))
    } else {
      setSelectedReadingTest(null)
    }
  }, [testData.readingTestId])

  const handleBasicInfoChange = (field: string, value: any) => {
    setTestData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddPassage = (passage: any) => {
    setPassages([...passages, { ...passage, id: Date.now() }])
  }

  const handleUpdatePassage = (id: number, passage: any) => {
    setPassages(passages.map((p) => p.id === id ? { ...p, ...passage } : p))
  }

  const handleRemovePassage = (id: number) => {
    setPassages(passages.filter((p) => p.id !== id))
  }

  const handleAddPassageConfig = (config: any) => {
    setPassageConfigs([...passageConfigs, { ...config, id: Date.now() }])
  }

  const handleUpdatePassageConfig = (id: number, config: any) => {
    setPassageConfigs(passageConfigs.map((c) => c.id === id ? { ...c, ...config } : c))
  }

  const handleRemovePassageConfig = (id: number) => {
    setPassageConfigs(passageConfigs.filter((c) => c.id !== id))
  }

  const handleAddQuestion = (question: any) => {
    setQuestions([...questions, { ...question, id: Date.now() }])
  }

  const handleUpdateQuestion = (id: number | string, question: any) => {
    setQuestions(questions.map((q) => q.id === id ? { ...q, ...question } : q))
  }

  const handleRemoveQuestion = (id: number | string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      // Validate
      if (!testData.title) {
        alert('Please enter a test title')
        return
      }

      if (!testData.readingTestId) {
        alert('Please select a reading test')
        return
      }

      if (passages.length === 0) {
        alert('Please add at least one passage')
        return
      }

      if (passageConfigs.length === 0) {
        alert('Please add passage configurations')
        return
      }

      if (questions.length === 0) {
        alert('Please add at least one question')
        return
      }

      // Build passages with their questions
      const passagesWithQuestions = passages.map((passage) => {
        const passageId = String(passage.id)
        const passageQuestions = questions
          .filter((q) => String(q.passageId) === passageId)
          .map(({ id: qId, passageId: pId, ...question }) => ({
            questionNumber: question.questionNumber,
            type: question.type,
            questionText: question.questionText || '',
            readingPassageId: question.readingPassageId || null,
            points: question.points || 1
          }))

        return {
          title: passage.title || '',
          order: passage.order || 1,
          contents: (passage.contents || []).map((content: any) => ({
            contentId: content.contentId || '',
            text: content.text || ''
          })),
          questions: passageQuestions
        }
      })

      const payload = {
        title: testData.title,
        readingTestId: testData.readingTestId, // Required, already validated above
        totalTimeMinutes: testData.totalTimeMinutes || 60,
        isActive: testData.isActive !== undefined ? testData.isActive : true,
        passages: passagesWithQuestions,
        passageConfigs: passageConfigs.map(({ id, ...config }) => ({
          part: config.part,
          total: config.total,
          start: config.start
        }))
      }

      const url = mode === 'edit' && testId 
        ? `/api/admin/writing-tests/${testId}`
        : '/api/admin/writing-tests'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      console.log('Submitting payload:', JSON.stringify(payload, null, 2))

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error('Error response:', errorData)
        const errorMessage = errorData.details || errorData.error || `Failed to ${mode === 'edit' ? 'update' : 'create'} test`
        throw new Error(errorMessage)
      }

      alert(`Writing test ${mode === 'edit' ? 'updated' : 'created'} successfully!`)
      router.push('/admin/writing-tests')
    } catch (error) {
      alert('Error creating test: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="passages">Passages</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reading-test">Base Reading Test *</Label>
              <Select
                value={testData.readingTestId}
                onValueChange={(value) => handleBasicInfoChange('readingTestId', value)}
              >
                <SelectTrigger id="reading-test">
                  <SelectValue placeholder="Select a reading test" />
                </SelectTrigger>
                <SelectContent>
                  {readingTests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedReadingTest && (
                <p className="text-sm text-gray-500">
                  Based on: {selectedReadingTest.title} ({selectedReadingTest._count?.passages || 0} passages)
                </p>
              )}
            </div>
            <BasicTestInfo testData={testData} onChange={handleBasicInfoChange} />
          </Card>
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
          <WritingQuestionSection
            questions={questions}
            passages={passages}
            passageConfigs={passageConfigs}
            readingPassages={selectedReadingTest?.passages || []}
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
      </Tabs>

      <div className="flex gap-3 mt-8 pt-6 border-t">
        <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
          {isLoading 
            ? (mode === 'edit' ? 'Updating...' : 'Creating...') 
            : (mode === 'edit' ? 'Update Writing Test' : 'Create Writing Test')
          }
        </Button>
      </div>
    </Card>
  )
}
