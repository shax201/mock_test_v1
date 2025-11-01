'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import FillInTheBlankEditor from './FillInTheBlankEditor'
import MatchingQuestionEditor from './MatchingQuestionEditor'

interface BlankField {
  id: string
  position: number
  correctAnswer: string
  alternatives?: string[]
  caseSensitive: boolean
}

interface FillInTheBlankData {
  content: string
  blanks: BlankField[]
  instructions: string
}

interface MatchingItem {
  id: string
  label: string
  content: string
}

interface MatchingData {
  leftItems: MatchingItem[]
  rightItems: MatchingItem[]
}

interface Question {
  id: string
  type: 'MCQ' | 'FIB' | 'MATCHING' | 'TRUE_FALSE' | 'NOT_GIVEN' | 'NOTES_COMPLETION' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE_NOT_GIVEN' | 'SUMMARY_COMPLETION'
  content: string
  options?: string[]
  correctAnswer: string | string[] | Record<string, string>
  points: number
  part?: 1 | 2 | 3
  fibData?: FillInTheBlankData
  matchingData?: MatchingData
  notesCompletionData?: {
    title: string
    instructions: string
    notes: Array<{
      id: string
      content: string
      hasBlank: boolean
      blankAnswer?: string
      blankPosition?: number
    }>
  }
  summaryCompletionData?: {
    title: string
    instructions: string
    content: string
    blanks: Array<{
      id: string
      position: number
      correctAnswer: string
      alternatives?: string[]
    }>
  }
  trueFalseNotGivenData?: {
    statement: string
    correctAnswer: 'TRUE' | 'FALSE' | 'NOT_GIVEN'
    explanation?: string
  }
  instructions?: string
}

interface DragDropBuilderProps {
  moduleType: 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING'
  onQuestionsChange: (questions: Question[]) => void
  initialQuestions?: Question[]
}

function SortableQuestion({ question, onUpdate, onDelete }: {
  question: Question
  onUpdate: (id: string, updates: Partial<Question>) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg p-4 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {question.type}
            </span>
            <span className="text-sm text-gray-500">{question.points} points</span>
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Content
            </label>
            <textarea
              rows={2}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={question.content}
              onChange={(e) => onUpdate(question.id, { content: e.target.value })}
              placeholder="Enter your question here..."
            />
          </div>

          {question.type === 'MCQ' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options
              </label>
              <div className="space-y-2">
                {question.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(question.options || [])]
                        newOptions[index] = e.target.value
                        onUpdate(question.id, { options: newOptions })
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = question.options?.filter((_, i) => i !== index)
                        onUpdate(question.id, { options: newOptions })
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = [...(question.options || []), '']
                    onUpdate(question.id, { options: newOptions })
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}

          {question.type === 'FIB' && (
            <div className="mb-3">
              <FillInTheBlankEditor
                data={question.fibData || { content: '', blanks: [], instructions: '' }}
                onChange={(fibData) => onUpdate(question.id, { fibData })}
              />
            </div>
          )}

          {question.type === 'MATCHING' && (
            <div className="mb-3">
              <MatchingQuestionEditor
                data={question.matchingData || { leftItems: [], rightItems: [] }}
                onChange={(matchingData) => onUpdate(question.id, { matchingData })}
              />
            </div>
          )}

          {(question.type === 'TRUE_FALSE' || question.type === 'NOT_GIVEN') && (
            <div className="mb-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>True/False Question:</strong> Students will select True, False{question.type === 'NOT_GIVEN' ? ', or Not Given' : ''}.
                </p>
              </div>
            </div>
          )}

          {question.type === 'NOTES_COMPLETION' && (
            <div className="mb-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Notes Completion Question:</strong> Students will complete notes with one word only.
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Configure notes and blanks in the IELTS Question Builder for full functionality.
                </p>
              </div>
            </div>
          )}

          {question.type === 'MULTIPLE_CHOICE' && (
            <div className="mb-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>IELTS Multiple Choice Question:</strong> Students will choose the correct answer from options.
                </p>
              </div>
            </div>
          )}

          {question.type === 'TRUE_FALSE_NOT_GIVEN' && (
            <div className="mb-3">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800">
                  <strong>True/False/Not Given Question:</strong> Students will select TRUE, FALSE, or NOT GIVEN.
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Configure statement and correct answer in the IELTS Question Builder for full functionality.
                </p>
              </div>
            </div>
          )}

          {question.type === 'SUMMARY_COMPLETION' && (
            <div className="mb-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Summary Completion Question:</strong> Students will complete a summary with one word only.
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Configure summary and blanks in the IELTS Question Builder for full functionality.
                </p>
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correct Answer
            </label>
            {question.type === 'MATCHING' ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  For matching questions, specify the correct matches in the format: leftItemId:rightItemId
                </p>
                <textarea
                  rows={3}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={typeof question.correctAnswer === 'object' && !Array.isArray(question.correctAnswer) 
                    ? Object.entries(question.correctAnswer).map(([key, value]) => `${key}:${value}`).join('\n')
                    : ''
                  }
                  onChange={(e) => {
                    const lines = e.target.value.split('\n')
                    const matches: Record<string, string> = {}
                    lines.forEach(line => {
                      const [left, right] = line.split(':')
                      if (left && right) {
                        matches[left.trim()] = right.trim()
                      }
                    })
                    onUpdate(question.id, { correctAnswer: matches })
                  }}
                  placeholder="leftItemId:rightItemId&#10;leftItemId2:rightItemId2"
                />
              </div>
            ) : (
              <input
                type="text"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : String(question.correctAnswer)}
                onChange={(e) => onUpdate(question.id, { correctAnswer: e.target.value })}
                placeholder="Enter correct answer(s)"
              />
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points
              </label>
              <input
                type="number"
                min="1"
                className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={question.points}
                onChange={(e) => onUpdate(question.id, { points: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <button
            {...attributes}
            {...listeners}
            className="p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(question.id)}
            className="p-2 text-red-400 hover:text-red-600"
            title="Delete question"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DragDropBuilder({ moduleType, onQuestionsChange, initialQuestions = [] }: DragDropBuilderProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [newQuestionType, setNewQuestionType] = useState<Question['type']>('MCQ')
  const [showMultipleFIBModal, setShowMultipleFIBModal] = useState(false)
  const [multipleFIBCount, setMultipleFIBCount] = useState(3)

  // Update questions when initialQuestions change
  useEffect(() => {
    if (initialQuestions.length > 0) {
      setQuestions(initialQuestions)
    }
  }, [initialQuestions])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        onQuestionsChange(newItems)
        return newItems
      })
    }
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      type: newQuestionType,
      content: '',
      options: newQuestionType === 'MCQ' ? ['', '', '', ''] : undefined,
      correctAnswer: newQuestionType === 'MATCHING' ? {} : '',
      points: 1,
      fibData: newQuestionType === 'FIB' ? {
        content: '',
        blanks: [],
        instructions: ''
      } : undefined,
      matchingData: newQuestionType === 'MATCHING' ? {
        leftItems: [],
        rightItems: []
      } : undefined,
      instructions: ''
    }
    const newQuestions = [...questions, newQuestion]
    setQuestions(newQuestions)
    onQuestionsChange(newQuestions)
  }

  const addMultipleFIBQuestions = () => {
    setShowMultipleFIBModal(true)
  }

  const handleAddMultipleFIB = () => {
    if (multipleFIBCount < 1 || multipleFIBCount > 20) return
    
    const newQuestions: Question[] = []
    for (let i = 0; i < multipleFIBCount; i++) {
      newQuestions.push({
        id: `question-${Date.now()}-${i}`,
        type: 'FIB',
        content: '',
        correctAnswer: '',
        points: 1,
        fibData: {
          content: '',
          blanks: [],
          instructions: ''
        }
      })
    }
    
    const updatedQuestions = [...questions, ...newQuestions]
    setQuestions(updatedQuestions)
    onQuestionsChange(updatedQuestions)
    setShowMultipleFIBModal(false)
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    const newQuestions = questions.map(q => q.id === id ? { ...q, ...updates } : q)
    setQuestions(newQuestions)
    onQuestionsChange(newQuestions)
  }

  const deleteQuestion = (id: string) => {
    const newQuestions = questions.filter(q => q.id !== id)
    setQuestions(newQuestions)
    onQuestionsChange(newQuestions)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {moduleType} Module Questions
        </h3>
        
        <div className="flex items-center space-x-4 mb-6">
          <select
            value={newQuestionType}
            onChange={(e) => setNewQuestionType(e.target.value as Question['type'])}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="MCQ">Multiple Choice</option>
            <option value="FIB">Fill in the Blank</option>
            <option value="MATCHING">Matching</option>
            <option value="TRUE_FALSE">True/False</option>
            <option value="NOT_GIVEN">True/False/Not Given</option>
            <option value="NOTES_COMPLETION">Notes Completion</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice (IELTS)</option>
            <option value="TRUE_FALSE_NOT_GIVEN">True/False/Not Given (IELTS)</option>
            <option value="SUMMARY_COMPLETION">Summary Completion</option>
          </select>
          
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Question
          </button>

          {newQuestionType === 'FIB' && (
            <button
              type="button"
              onClick={addMultipleFIBQuestions}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Multiple FIB Questions
            </button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No questions</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding your first question.</p>
              </div>
            ) : (
              questions.map((question) => (
                <SortableQuestion
                  key={question.id}
                  question={question}
                  onUpdate={updateQuestion}
                  onDelete={deleteQuestion}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Multiple FIB Questions Modal */}
      {showMultipleFIBModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Add Multiple Fill-in-the-Blank Questions
                </h3>
                <button
                  onClick={() => setShowMultipleFIBModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <label htmlFor="fibCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of questions to add:
                </label>
                <input
                  type="number"
                  id="fibCount"
                  min="1"
                  max="20"
                  value={multipleFIBCount}
                  onChange={(e) => setMultipleFIBCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  You can add between 1 and 20 questions at once.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowMultipleFIBModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMultipleFIB}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  Add {multipleFIBCount} Questions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
