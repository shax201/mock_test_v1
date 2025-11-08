'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, ChevronDown, ChevronUp, Edit2, X } from 'lucide-react'

interface WritingQuestionSectionProps {
  questions: any[]
  passages: any[]
  passageConfigs: any[]
  readingPassages?: any[]
  onAdd: (question: any) => void
  onRemove: (id: number | string) => void
  onUpdate?: (id: number | string, question: any) => void
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
  onRemove,
  onUpdate
}: WritingQuestionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [editingId, setEditingId] = useState<string | number | null>(null)
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

    const questionData = {
      passageId: formData.passageId,
      readingPassageId: formData.readingPassageId || null,
      questionNumber: formData.number,
      type: formData.questionType,
      questionText: formData.questionText
    }

    if (editingId !== null && onUpdate) {
      onUpdate(editingId, questionData)
      setEditingId(null)
    } else {
      onAdd(questionData)
    }

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

  const handleEditQuestion = (question: any) => {
    setEditingId(question.id)
    setFormData({
      passageId: String(question.passageId || ''),
      readingPassageId: question.readingPassageId || '',
      part: '1',
      number: question.questionNumber || 1,
      questionType: question.type || 'TASK_1',
      questionText: question.questionText || ''
    })
    setIsExpanded(true)
    // Scroll to form
    setTimeout(() => {
      const formElement = document.getElementById('question-text')
      formElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      passageId: '',
      readingPassageId: '',
      part: '1',
      number: questions.length + 1,
      questionType: 'TASK_1',
      questionText: ''
    })
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">
            {editingId !== null ? 'Edit Writing Question' : 'Add Writing Question'}
          </h3>
          <div className="flex items-center gap-2">
            {editingId !== null && (
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          </div>
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
                  value={formData.readingPassageId || 'none'}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, readingPassageId: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger id="reading-passage">
                    <SelectValue placeholder="Select reading passage (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
              {editingId !== null ? (
                <>
                  <Edit2 className="w-4 h-4" />
                  Update Question
                </>
              ) : (
                <>
              <Plus className="w-4 h-4" />
              Add Question
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {questions.length > 0 ? (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Added Questions ({questions.length})</h3>
          <div className="space-y-2">
            {questions.map((question, index) => {
              const passage = passages.find((p) => String(p.id) === String(question.passageId))
              const readingPassage = readingPassages.find((p) => p.id === question.readingPassageId)
              return (
                <div key={question.id || `question-${index}`} className="p-3 border rounded flex items-start justify-between bg-muted/30">
                  <div className="flex-1">
                    <p className="font-medium">
                      Question {question.questionNumber} - {question.type}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Writing Passage: {passage?.title || `Passage ID: ${question.passageId}`}
                    </p>
                    {readingPassage && (
                      <p className="text-sm text-blue-600">
                        Linked to Reading: {readingPassage.title}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">{question.questionText || '(No question text)'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {onUpdate && (
                      <Button variant="ghost" size="sm" onClick={() => handleEditQuestion(question)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  <Button variant="ghost" size="sm" onClick={() => onRemove(question.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No questions added yet.</p>
            <p className="text-xs mt-1">Use the form above to add questions to your writing test.</p>
          </div>
        </Card>
      )}
    </div>
  )
}

