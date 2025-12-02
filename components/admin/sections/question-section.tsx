"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import ImageChartEditor, { ChartField } from "@/components/admin/ImageChartEditor"

interface QuestionSectionProps {
  questions: any[]
  passages: any[]
  passageConfigs: any[]
  onAdd: (question: any) => void
  onRemove: (id: number) => void
  onUpdate?: (id: number, question: any) => void
}

const QUESTION_TYPES = [
  { value: "MCQ", label: "Multiple Choice Question" },
  { value: "FIB", label: "Fill In The Blank" },
  { value: "MATCHING", label: "Matching" },
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "NOT_GIVEN", label: "Not Given" },
  { value: "TRUE_FALSE_NOT_GIVEN", label: "True / False / Not Given" },
  { value: "NOTES_COMPLETION", label: "Notes Completion" },
  { value: "SUMMARY_COMPLETION", label: "Summary Completion" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  // New reading question type similar to listening flow chart questions
  { value: "FLOW_CHART", label: "Flow Chart" },
]

export default function QuestionSection({
  questions,
  passages,
  passageConfigs,
  onAdd,
  onRemove,
  onUpdate,
}: QuestionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    passageId: "",
    part: "1",
    number: 1,
    questionType: "MCQ",
    text: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    subQuestions: [] as Array<{ number: string; answer: string }>,
    // Flow chart specific fields
    imageUrl: "",
    fields: [] as ChartField[],
  })

  const handleAddOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }))
  }

  const handleRemoveOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  const handleOptionChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newOptions = [...prev.options]
      newOptions[index] = value
      return { ...prev, options: newOptions }
    })
  }

  const handleAddSubQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      subQuestions: [...prev.subQuestions, { number: "", answer: "" }],
    }))
  }

  const handleRemoveSubQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subQuestions: prev.subQuestions.filter((_, i) => i !== index),
    }))
  }

  const handleSubQuestionChange = (index: number, field: "number" | "answer", value: string) => {
    setFormData((prev) => {
      const newSubQuestions = [...prev.subQuestions]
      newSubQuestions[index] = {
        ...newSubQuestions[index],
        [field]: value,
      }
      return { ...prev, subQuestions: newSubQuestions }
    })
  }

  const handleAddQuestion = () => {
    if (!formData.passageId) {
      alert("Please select a passage")
      return
    }

    // For flow chart questions, each field becomes a separate question
    if (formData.questionType === "FLOW_CHART") {
      if (!formData.imageUrl.trim()) {
        alert("Please upload a flow chart image")
        return
      }
      if (formData.fields.length === 0) {
        alert("Please create at least one input field on the flow chart image")
        return
      }

      // Get the starting question number (use formData.number as base, or calculate from existing questions)
      const startQuestionNumber = formData.number || (questions.length > 0 ? Math.max(...questions.map((q) => q.number || q.questionNumber || 0)) + 1 : 1)

      // For updates, replace the entire flow chart question group with a single entry
      // The actual flattening into individual questions happens in handleSubmit
      if (editingId !== null && onUpdate) {
        const updatedQuestionData = {
          passageId: formData.passageId,
          part: formData.part,
          number: startQuestionNumber,
          questionNumber: startQuestionNumber,
          questionType: "FLOW_CHART",
          type: "FLOW_CHART",
          text: formData.text || "Complete the flow chart below.",
          questionText: formData.text || "Complete the flow chart below.",
          imageUrl: formData.imageUrl,
          fields: formData.fields, // All fields stored together
          points: 1,
        }

        onUpdate(editingId, updatedQuestionData)
        setEditingId(null)
      } else {
        // For new flow chart questions, create a single grouped entry
        // The flattening will happen when saving to the database
        const questionData = {
          passageId: formData.passageId,
          part: formData.part,
          number: startQuestionNumber,
          questionNumber: startQuestionNumber,
          questionType: "FLOW_CHART",
          type: "FLOW_CHART",
          text: formData.text || "Complete the flow chart below.",
          questionText: formData.text || "Complete the flow chart below.",
          imageUrl: formData.imageUrl,
          fields: formData.fields, // All fields stored together
          points: 1,
        }

        onAdd(questionData)
      }

      // Reset form - calculate next starting question number
      // The next starting number should be after all fields in this flow chart
      const nextStartingNumber = startQuestionNumber + formData.fields.length
      
      setFormData({
        passageId: "",
        part: "1",
        number: nextStartingNumber,
        questionType: "MCQ",
        text: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        subQuestions: [],
        imageUrl: "",
        fields: [],
      })
      return
    }

    // For non-flow-chart questions, use the original logic
    if (!formData.text.trim()) {
      alert("Please enter the question text")
      return
    }
    if (!formData.correctAnswer.trim()) {
      alert("Please enter the correct answer")
      return
    }

    // For question types that need options
    const typesWithOptions = ["MCQ", "MATCHING", "MULTIPLE_CHOICE"]
    if (typesWithOptions.includes(formData.questionType)) {
      if (formData.options.some((opt) => !opt.trim())) {
        alert("Please fill in all options")
        return
      }
    }

    if (formData.subQuestions.length > 0) {
      if (formData.subQuestions.some((sq) => !sq.number.trim() || !sq.answer.trim())) {
        alert("Please fill in all sub-question numbers and answers")
        return
      }
    }

    const questionData = {
      ...formData,
      questionNumber: formData.number,
      subQuestions:
        formData.subQuestions.length > 0
          ? formData.subQuestions.map((sq) => ({ number: sq.number, answer: sq.answer }))
          : undefined,
    }

    if (editingId !== null && onUpdate) {
      onUpdate(editingId, questionData)
      setEditingId(null)
    } else {
      onAdd(questionData)
    }

    // Reset form
    setFormData({
      passageId: "",
      part: "1",
      number: questions.length + 1,
      questionType: "MCQ",
      text: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      subQuestions: [],
      imageUrl: "",
      fields: [],
    })
  }

  const handleEditQuestion = (question: any) => {
    setEditingId(question.id)
    setFormData({
      passageId: question.passageId || "",
      part: question.part || "1",
      number: question.questionNumber || question.number || 1,
      questionType: question.type || question.questionType || "MCQ",
      text: question.questionText || question.text || "",
      options: question.options && Array.isArray(question.options) 
        ? question.options.length > 0 
          ? question.options 
          : ["", "", "", ""]
        : ["", "", "", ""],
      correctAnswer: question.correctAnswer || "",
      subQuestions: question.subQuestions && Array.isArray(question.subQuestions)
        ? question.subQuestions.map((sq: any) => ({
            number: String(sq.number || sq.questionNumber || ""),
            answer: sq.answer || ""
          }))
        : [],
      // Flow chart fields
      imageUrl: question.imageUrl || "",
      fields: question.fields && Array.isArray(question.fields)
        ? question.fields
        : question.field
        ? [question.field]
        : [],
    })
    setIsExpanded(true)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      passageId: "",
      part: "1",
      number: questions.length + 1,
      questionType: "MCQ",
      text: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      subQuestions: [],
      imageUrl: "",
      fields: [],
    })
  }

  const needsOptions = (type: string) => {
    return ["MCQ", "MATCHING", "MULTIPLE_CHOICE"].includes(type)
  }

  const supportsSubQuestions = (type: string) => {
    // Flow chart questions can also have multiple numbered blanks
    return ["NOTES_COMPLETION", "SUMMARY_COMPLETION", "FIB", "FLOW_CHART"].includes(type)
  }

  const getNextQuestionNumber = () => {
    if (questions.length === 0) return 1
    return Math.max(...questions.map((q) => q.number || 0)) + 1
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">
            {editingId !== null ? "Edit Question" : "Add New Question"}
          </h3>
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passage-select">Passage</Label>
                <Select
                  value={formData.passageId}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, passageId: v }))}
                >
                  <SelectTrigger id="passage-select">
                    <SelectValue placeholder="Select a passage" />
                  </SelectTrigger>
                  <SelectContent>
                    {passages.map((passage, index) => (
                      <SelectItem key={passage.id} value={String(passage.id)}>
                        {passage.title || `Passage ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="part-select">Part</Label>
                <Select value={formData.part} onValueChange={(v) => setFormData((prev) => ({ ...prev, part: v }))}>
                  <SelectTrigger id="part-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Part 1</SelectItem>
                    <SelectItem value="2">Part 2</SelectItem>
                    <SelectItem value="3">Part 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question-type">Question Type</Label>
                <Select
                  value={formData.questionType}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      questionType: v,
                      options: needsOptions(v) ? ["", "", "", ""] : [],
                      subQuestions: [],
                      // Reset flow chart fields when switching away
                      imageUrl: v === "FLOW_CHART" ? prev.imageUrl : "",
                      fields: v === "FLOW_CHART" ? prev.fields : [],
                    }))
                  }
                >
                  <SelectTrigger id="question-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Question Number - for FLOW_CHART this is the starting question number */}
              <div className="space-y-2">
                <Label htmlFor="question-number">
                  {formData.questionType === "FLOW_CHART" ? "Starting Question Number" : "Question Number"}
                </Label>
                <Input
                  id="question-number"
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData((prev) => ({ ...prev, number: Number.parseInt(e.target.value) }))}
                  min="1"
                />
                {formData.questionType === "FLOW_CHART" && (
                  <p className="text-xs text-muted-foreground">
                    This is the first question number. Each input field will be numbered sequentially (e.g., {formData.number}, {formData.number + 1}, {formData.number + 2}...)
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question-text">Question Text</Label>
              <Textarea
                id="question-text"
                placeholder={
                  formData.questionType === "MCQ" || formData.questionType === "MULTIPLE_CHOICE"
                    ? "e.g., What is the main purpose of the passage?\nOr: According to the text, which of the following..."
                    : formData.questionType === "FIB"
                      ? "e.g., The author believes that climate change is [question number] to human survival."
                      : formData.questionType === "MATCHING"
                        ? "e.g., Match the following terms with their definitions..."
                        : formData.questionType === "TRUE_FALSE"
                          ? "e.g., The study was conducted over a period of five years."
                          : formData.questionType === "NOT_GIVEN"
                            ? "e.g., The researcher was born in London."
                            : formData.questionType === "TRUE_FALSE_NOT_GIVEN"
                              ? "e.g., All participants completed the survey."
                              : ["NOTES_COMPLETION", "SUMMARY_COMPLETION"].includes(formData.questionType)
                                ? "e.g., Complete the summary:\nThe new technology offers several advantages including [question number] efficiency and [question number] cost."
                                : "Enter the question text..."
                }
                value={formData.text}
                onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
                rows={3}
              />
            </div>

            {needsOptions(formData.questionType) && (
              <div className="space-y-2">
                <Label>Options</Label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={
                        formData.questionType === "MATCHING"
                          ? `Option ${String.fromCharCode(65 + index)}: e.g., Definition or item to match`
                          : `Option ${String.fromCharCode(65 + index)}: e.g., Sample answer choice`
                      }
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                    />
                    {formData.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            options: prev.options.filter((_, i) => i !== index),
                          }))
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {formData.options.length < 6 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        options: [...prev.options, ""],
                      }))
                    }}
                    className="gap-2 bg-transparent"
                  >
                    <Plus className="w-4 h-4" />
                    Add Option
                  </Button>
                )}
              </div>
            )}

            {/* Hide Correct Answer for FLOW_CHART - answers come from field values */}
            {formData.questionType !== "FLOW_CHART" && (
              <div className="space-y-2">
                <Label htmlFor="correct-answer">Correct Answer</Label>
                <Textarea
                  id="correct-answer"
                  placeholder={
                    formData.questionType === "MCQ" || formData.questionType === "MULTIPLE_CHOICE"
                      ? "e.g., A"
                      : formData.questionType === "FIB"
                        ? "e.g., critical"
                        : formData.questionType === "MATCHING"
                          ? "e.g., 1-C, 2-A, 3-D, 4-B"
                          : formData.questionType === "TRUE_FALSE"
                            ? "e.g., True or False"
                            : formData.questionType === "NOT_GIVEN"
                              ? "e.g., Yes / No / Not Given"
                              : formData.questionType === "TRUE_FALSE_NOT_GIVEN"
                                ? "e.g., True / False / Not Given"
                                : ["NOTES_COMPLETION", "SUMMARY_COMPLETION"].includes(formData.questionType)
                                  ? "e.g., increased / reduced"
                                  : "Enter the correct answer..."
                  }
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData((prev) => ({ ...prev, correctAnswer: e.target.value }))}
                  rows={2}
                />
              </div>
            )}

            {/* Flow Chart Image Editor */}
            {formData.questionType === "FLOW_CHART" && (
              <div className="space-y-3 border-t pt-4">
                <Label>Flow Chart Image</Label>
                <ImageChartEditor
                  defaultFieldWidth={140}
                  defaultFieldHeight={32}
                  initialImageUrl={formData.imageUrl}
                  initialFields={formData.fields}
                  startingQuestionNumber={formData.number}
                  onImageChange={(newImageUrl) => {
                    setFormData((prev) => ({ ...prev, imageUrl: newImageUrl }))
                  }}
                  onSave={(newFields) => {
                    // Store fields - each will become a separate question when submitted
                    setFormData((prev) => ({
                      ...prev,
                      fields: newFields,
                    }))
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Upload an image, then click on it to create input fields. <strong>Each field you create will automatically become a separate question</strong> with its own question number (starting from {formData.number}) and correct answer (from the field value). Enter the correct answer in each field, then click "Save Fields" to save the positions. When you click "Add Question", each field will be created as an individual question.
                </p>
              </div>
            )}

            {supportsSubQuestions(formData.questionType) && formData.questionType !== "FLOW_CHART" && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label>Sub-Questions (For Multi-Blank Items)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSubQuestion}
                    className="gap-2 bg-transparent"
                  >
                    <Plus className="w-4 h-4" />
                    Add Sub-Question
                  </Button>
                </div>

                {formData.subQuestions.length > 0 && (
                  <div className="space-y-2">
                    {formData.subQuestions.map((subQ, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Question number (e.g., 27)"
                            value={subQ.number}
                            onChange={(e) => handleSubQuestionChange(index, "number", e.target.value)}
                            type="number"
                            min="1"
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder={
                              formData.questionType === "FIB"
                                ? "e.g., innovation"
                                : formData.questionType === "SUMMARY_COMPLETION"
                                  ? "e.g., sustainable"
                                  : "e.g., Answer for this blank"
                            }
                            value={subQ.answer}
                            onChange={(e) => handleSubQuestionChange(index, "answer", e.target.value)}
                          />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveSubQuestion(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Use this for questions with multiple blanks. Each sub-question has its own question number and answer.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {editingId !== null && (
                <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button onClick={handleAddQuestion} className={editingId !== null ? "flex-1 gap-2" : "w-full gap-2"}>
                <Plus className="w-4 h-4" />
                {editingId !== null ? "Update Question" : "Add Question"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {questions.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Added Questions ({questions.length})</h3>
          <div className="space-y-3">
            {questions.map((question) => {
              const questionType = question.type || question.questionType || "MCQ"
              const questionNumber = question.questionNumber || question.number || 0
              const questionText = question.questionText || question.text || ""
              const passage = passages.find((p) => String(p.id) === String(question.passageId))
              
              return (
                <div key={question.id} className="p-3 border rounded bg-muted/30">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium">
                        Q{questionNumber} - {questionType}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {passage ? `Passage: ${passage.title}` : ""} • Part {question.part || "1"}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {onUpdate && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditQuestion(question)}
                          disabled={editingId === question.id}
                        >
                          Edit
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => onRemove(question.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm mb-2 line-clamp-2">{questionText}</p>
                  {question.options && Array.isArray(question.options) && question.options.length > 0 && (
                    <div className="text-xs text-muted-foreground mb-2">
                      <strong>Options:</strong> {question.options.slice(0, 2).join(", ")}
                      {question.options.length > 2 && ` (+${question.options.length - 2} more)`}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      <strong>Answer:</strong> {question.correctAnswer || "N/A"}
                    </p>
                    {question.subQuestions && Array.isArray(question.subQuestions) && question.subQuestions.length > 0 && (
                      <div className="mt-2 pl-2 border-l-2 border-muted-foreground/50">
                        <p className="font-medium">Sub-Questions:</p>
                        {question.subQuestions.map((subQ: any, idx: number) => (
                          <p key={idx} className="text-xs">
                            Q{subQ.number || subQ.questionNumber}: {subQ.answer}
                          </p>
                        ))}
                      </div>
                    )}
                    {question.imageUrl && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          <strong>Flow Chart Image:</strong> {question.imageUrl.substring(0, 50)}...
                        </p>
                        {question.fields && Array.isArray(question.fields) && question.fields.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            <strong>Fields:</strong> {question.fields.length} input field(s)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
