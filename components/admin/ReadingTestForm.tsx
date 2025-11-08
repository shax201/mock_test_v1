"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save } from "lucide-react"
import BasicTestInfo from "./sections/basic-test-info"
import PassageSection from "./sections/passage-section"
import BandScoreSection from "./sections/band-score-section"
import PassageConfigSection from "./sections/passage-config-section"
import QuestionSection from "./sections/question-section"

interface ReadingTestFormProps {
  apiEndpoint?: string
  onSuccess?: () => void
}

export default function ReadingTestForm({ apiEndpoint = "/api/admin/reading-tests", onSuccess }: ReadingTestFormProps = {}) {
  const [testData, setTestData] = useState({
    title: "",
    totalQuestions: 40,
    totalTimeMinutes: 60,
    isActive: true,
  })

  const [passages, setPassages] = useState<any[]>([])
  const [bandScores, setBandScores] = useState<any[]>([])
  const [passageConfigs, setPassageConfigs] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [activeSection, setActiveSection] = useState("basic")
  const [isLoading, setIsLoading] = useState(false)

  const handleBasicInfoChange = (field: string, value: any) => {
    setTestData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddPassage = (passage: any) => {
    setPassages([...passages, { ...passage, id: Date.now() }])
  }

  const handleRemovePassage = (id: number) => {
    setPassages(passages.filter((p) => p.id !== id))
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
        alert("Please enter a test title")
        return
      }

      if (passages.length === 0) {
        alert("Please add at least one passage")
        return
      }

      if (bandScores.length === 0) {
        alert("Please add band score ranges")
        return
      }

      if (passageConfigs.length === 0) {
        alert("Please add passage configurations")
        return
      }

      if (questions.length === 0) {
        alert("Please add at least one question")
        return
      }

      const payload = {
        test: testData,
        passages: passages.map(({ id, ...p }) => ({
          ...p,
          questions: questions.filter((q) => q.passageId === String(id)).map(({ id: qId, passageId, ...q }) => q),
        })),
        bandScores: bandScores.map(({ id, ...b }) => b),
        passageConfigs: passageConfigs.map(({ id, ...c }) => c),
      }

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create test")
      }

      alert("Reading test created successfully!")
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      } else {
        // Reset form
        setTestData({ title: "", totalQuestions: 40, totalTimeMinutes: 60, isActive: true })
        setPassages([])
        setBandScores([])
        setPassageConfigs([])
        setQuestions([])
      }
    } catch (error) {
      alert("Error creating test: " + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
          <PassageSection passages={passages} onAdd={handleAddPassage} onRemove={handleRemovePassage} />
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <QuestionSection
            questions={questions}
            passages={passages}
            passageConfigs={passageConfigs}
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

        <TabsContent value="bands" className="space-y-4">
          <BandScoreSection scores={bandScores} onAdd={handleAddBandScore} onRemove={handleRemoveBandScore} />
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 mt-8 pt-6 border-t">
        <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
          <Save className="w-4 h-4" />
          {isLoading ? "Creating..." : "Create Reading Test"}
        </Button>
      </div>
    </Card>
  )
}
