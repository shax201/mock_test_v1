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

export default function WritingTestForm() {
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

  useEffect(() => {
    if (testData.readingTestId) {
      const readingTest = readingTests.find((rt) => rt.id === testData.readingTestId)
      if (readingTest) {
        // Fetch full reading test details with passages
        fetch(`/api/admin/reading-tests/${testData.readingTestId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.readingTest) {
              setSelectedReadingTest(data.readingTest)
            }
          })
          .catch((err) => console.error('Error fetching reading test details:', err))
      }
    } else {
      setSelectedReadingTest(null)
    }
  }, [testData.readingTestId, readingTests])

  const handleBasicInfoChange = (field: string, value: any) => {
    setTestData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddPassage = (passage: any) => {
    setPassages([...passages, { ...passage, id: Date.now() }])
  }

  const handleRemovePassage = (id: number) => {
    setPassages(passages.filter((p) => p.id !== id))
  }

  const handleAddPassageConfig = (config: any) => {
    setPassageConfigs([...passageConfigs, { ...config, id: Date.now() }])
  }

  const handleRemovePassageConfig = (id: number) => {
    setPassageConfigs(passageConfigs.filter((c) => c.id !== id))
  }

  const handleAddQuestion = (question: any) => {
    setQuestions([...questions, { ...question, id: Date.now() }])
  }

  const handleRemoveQuestion = (id: number) => {
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

      const payload = {
        title: testData.title,
        readingTestId: testData.readingTestId,
        totalTimeMinutes: testData.totalTimeMinutes,
        passages: passages.map(({ id, ...p }) => ({
          ...p,
          questions: questions.filter((q) => q.passageId === String(id)).map(({ id: qId, passageId, ...q }) => q)
        })),
        passageConfigs: passageConfigs.map(({ id, ...c }) => c)
      }

      const response = await fetch('/api/admin/writing-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create test')
      }

      alert('Writing test created successfully!')
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
          <PassageSection passages={passages} onAdd={handleAddPassage} onRemove={handleRemovePassage} />
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <WritingQuestionSection
            questions={questions}
            passages={passages}
            passageConfigs={passageConfigs}
            readingPassages={selectedReadingTest?.passages || []}
            onAdd={handleAddQuestion}
            onRemove={handleRemoveQuestion}
          />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <PassageConfigSection
            configs={passageConfigs}
            onAdd={handleAddPassageConfig}
            onRemove={handleRemovePassageConfig}
          />
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 mt-8 pt-6 border-t">
        <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
          {isLoading ? 'Creating...' : 'Create Writing Test'}
        </Button>
      </div>
    </Card>
  )
}
