'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface WritingQuestionSectionProps {
  questions: any[]
  passages: any[]
  passageConfigs: any[]
  readingPassages?: any[]
  onAdd: (question: any) => void
  onRemove: (id: number) => void
}

const WRITING_QUESTION_TYPES = [
  { value: 'TASK_1', label: 'Task 1 (Academic/General)' },
  { value: 'TASK_2', label: 'Task 2 (Essay)' }
]

export default function WritingQuestionSection({
  questions,
  passages,
  passageConfigs,
  readingPassages = [],
  onAdd,
  onRemove
}: WritingQuestionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [formData, setFormData] = useState({
    passageId: '',
    readingPassageId: '',
    part: '1',
    number: 1,
    questionType: 'TASK_1',
    questionText: ''
  })

  const handleAddQuestion = () => {
    if (!formData.passageId) {
      alert('Please select a passage')
      return
    }

    if (!formData.questionText.trim()) {
      alert('Please enter question text')
      return
    }

    onAdd({
      passageId: formData.passageId,
      readingPassageId: formData.readingPassageId || null,
      questionNumber: formData.number,
      type: formData.questionType,
      questionText: formData.questionText
    })

    // Reset form
    setFormData({
      passageId: formData.passageId,
      readingPassageId: '',
      part: formData.part,
      number: formData.number + 1,
      questionType: formData.questionType,
      questionText: ''
    })
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Add Writing Question</h3>
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passage">Passage</Label>
                <Select
                  value={formData.passageId}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, passageId: v }))}
                >
                  <SelectTrigger id="passage">
                    <SelectValue placeholder="Select passage" />
                  </SelectTrigger>
                  <SelectContent>
                    {passages.map((passage) => (
                      <SelectItem key={passage.id} value={String(passage.id)}>
                        {passage.title || `Passage ${passage.order || ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question-number">Question Number</Label>
                <Input
                  id="question-number"
                  type="number"
                  min="1"
                  value={formData.number}
                  onChange={(e) => setFormData((prev) => ({ ...prev, number: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="question-type">Question Type</Label>
                <Select
                  value={formData.questionType}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, questionType: v }))}
                >
                  <SelectTrigger id="question-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WRITING_QUESTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {readingPassages.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="reading-passage">Link to Reading Passage (Optional)</Label>
                <Select
                  value={formData.readingPassageId}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, readingPassageId: v }))}
                >
                  <SelectTrigger id="reading-passage">
                    <SelectValue placeholder="Select reading passage (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {readingPassages.map((passage) => (
                      <SelectItem key={passage.id} value={passage.id}>
                        {passage.title || `Passage ${passage.order || ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="question-text">Question Text</Label>
              <Textarea
                id="question-text"
                placeholder="Enter the writing question/prompt..."
                value={formData.questionText}
                onChange={(e) => setFormData((prev) => ({ ...prev, questionText: e.target.value }))}
                rows={6}
              />
            </div>

            <Button onClick={handleAddQuestion} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Add Question
            </Button>
          </div>
        )}
      </Card>

      {questions.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Added Questions ({questions.length})</h3>
          <div className="space-y-2">
            {questions.map((question) => {
              const passage = passages.find((p) => String(p.id) === question.passageId)
              const readingPassage = readingPassages.find((p) => p.id === question.readingPassageId)
              return (
                <div key={question.id} className="p-3 border rounded flex items-start justify-between bg-muted/30">
                  <div className="flex-1">
                    <p className="font-medium">
                      Question {question.questionNumber} - {question.type}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Writing Passage: {passage?.title || 'Unknown'}
                    </p>
                    {readingPassage && (
                      <p className="text-sm text-blue-600">
                        Linked to Reading: {readingPassage.title}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">{question.questionText}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onRemove(question.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

