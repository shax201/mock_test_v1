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
import NotesCompletionEditor from './NotesCompletionEditor'
import SummaryCompletionEditor from './SummaryCompletionEditor'
import TrueFalseNotGivenEditor from './TrueFalseNotGivenEditor'
import FillInTheBlankEditor from './FillInTheBlankEditor'
import MatchingQuestionEditor from './MatchingQuestionEditor'
import SimpleRichEditor from './SimpleRichEditor'
import PartContentModal from './PartContentModal'
import QuestionCreationModal from './QuestionCreationModal'

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

interface NotesCompletionData {
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

interface SummaryCompletionData {
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

interface TrueFalseNotGivenData {
  statement: string
  correctAnswer: 'TRUE' | 'FALSE' | 'NOT_GIVEN'
  explanation?: string
}

interface IELTSQuestion {
  id: string
  type: 'NOTES_COMPLETION' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE_NOT_GIVEN' | 'SUMMARY_COMPLETION' | 'FIB' | 'MATCHING' | 'MCQ' | 'TRUE_FALSE' | 'NOT_GIVEN'
  content: string
  options?: string[]
  correctAnswer: string | string[] | Record<string, string>
  points: number
  part?: 1 | 2 | 3
  fibData?: FillInTheBlankData
  matchingData?: MatchingData
  notesCompletionData?: NotesCompletionData
  summaryCompletionData?: SummaryCompletionData
  trueFalseNotGivenData?: TrueFalseNotGivenData
  instructions?: string
}

interface PartContent {
  part1: string
  part2: string
  part3: string
}

interface IELTSQuestionBuilderProps {
  moduleType: 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING'
  onQuestionsChange: (questions: IELTSQuestion[]) => void
  onPartContentChange?: (content: PartContent) => void
  onPassageContentChange?: (content: { part1: string; part2: string; part3: string }) => void
  initialQuestions?: IELTSQuestion[]
  initialPartContent?: PartContent
  initialPassageContent?: { part1: string; part2: string; part3: string }
}

function SortableIELTSQuestion({ question, onUpdate, onDelete }: {
  question: IELTSQuestion
  onUpdate: (id: string, updates: Partial<IELTSQuestion>) => void
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

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'NOTES_COMPLETION': return 'Notes Completion'
      case 'MULTIPLE_CHOICE': return 'Multiple Choice'
      case 'TRUE_FALSE_NOT_GIVEN': return 'True/False/Not Given'
      case 'SUMMARY_COMPLETION': return 'Summary Completion'
      case 'FIB': return 'Fill in the Blank'
      case 'MATCHING': return 'Matching'
      default: return type
    }
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
              Part {question.part || 1}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {getQuestionTypeLabel(question.type)}
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

          {question.type === 'MULTIPLE_CHOICE' && (
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

          {question.type === 'NOTES_COMPLETION' && (
            <div className="mb-3">
              <NotesCompletionEditor
                data={question.notesCompletionData || { title: '', instructions: '', notes: [] }}
                onChange={(notesCompletionData) => onUpdate(question.id, { notesCompletionData })}
              />
            </div>
          )}

          {question.type === 'SUMMARY_COMPLETION' && (
            <div className="mb-3">
              <SummaryCompletionEditor
                data={question.summaryCompletionData || { title: '', instructions: '', content: '', blanks: [] }}
                onChange={(summaryCompletionData) => onUpdate(question.id, { summaryCompletionData })}
              />
            </div>
          )}

          {question.type === 'TRUE_FALSE_NOT_GIVEN' && (
            <div className="mb-3">
              <TrueFalseNotGivenEditor
                data={question.trueFalseNotGivenData || { statement: '', correctAnswer: 'TRUE' }}
                onChange={(trueFalseNotGivenData) => onUpdate(question.id, { trueFalseNotGivenData })}
              />
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Part
              </label>
              <select
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={question.part}
                onChange={(e) => onUpdate(question.id, { part: parseInt(e.target.value) as 1 | 2 | 3 })}
              >
                <option value={1}>Part 1</option>
                <option value={2}>Part 2</option>
                <option value={3}>Part 3</option>
              </select>
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

export default function IELTSQuestionBuilder({ moduleType, onQuestionsChange, onPartContentChange, onPassageContentChange, initialQuestions = [], initialPartContent, initialPassageContent }: IELTSQuestionBuilderProps) {
  const [questions, setQuestions] = useState<IELTSQuestion[]>(initialQuestions)
  const [part1Content, setPart1Content] = useState(initialPartContent?.part1 || '')
  const [part2Content, setPart2Content] = useState(initialPartContent?.part2 || '')
  const [part3Content, setPart3Content] = useState(initialPartContent?.part3 || '')
  const [passage1Content, setPassage1Content] = useState(initialPassageContent?.part1 || '')
  const [passage2Content, setPassage2Content] = useState(initialPassageContent?.part2 || '')
  const [passage3Content, setPassage3Content] = useState(initialPassageContent?.part3 || '')
  const [newQuestionType, setNewQuestionType] = useState<IELTSQuestion['type']>('NOTES_COMPLETION')
  const [newQuestionPart, setNewQuestionPart] = useState<1 | 2 | 3>(1)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentEditingPart, setCurrentEditingPart] = useState<1 | 2 | 3>(1)
  
  // Passage modal state
  const [isPassageModalOpen, setIsPassageModalOpen] = useState(false)
  const [currentEditingPassage, setCurrentEditingPassage] = useState<1 | 2 | 3>(1)
  
  // Question creation modal state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [currentQuestionPart, setCurrentQuestionPart] = useState<1 | 2 | 3>(1)

  // Update questions when initialQuestions change
  useEffect(() => {
    if (initialQuestions.length > 0) {
      setQuestions(initialQuestions)
    }
  }, [initialQuestions])

  // Update part content when initialPartContent changes
  useEffect(() => {
    if (initialPartContent) {
      setPart1Content(initialPartContent.part1 || '')
      setPart2Content(initialPartContent.part2 || '')
      setPart3Content(initialPartContent.part3 || '')
    }
  }, [initialPartContent])

  // Load content from API when component mounts
  useEffect(() => {
    const loadContentFromAPI = async () => {
      try {
        // Load content for all parts
        for (const part of [1, 2, 3] as const) {
          const response = await fetch(`/api/admin/mocks/part-content?moduleType=${moduleType}&partNumber=${part}`)
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data.content) {
              console.log(`Loaded content for Part ${part}:`, result.data.content)
              switch (part) {
                case 1:
                  setPart1Content(result.data.content)
                  break
                case 2:
                  setPart2Content(result.data.content)
                  break
                case 3:
                  setPart3Content(result.data.content)
                  break
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading content from API:', error)
      }
    }

    loadContentFromAPI()
  }, [moduleType])

  const handlePart1ContentChange = (content: string) => {
    console.log('handlePart1ContentChange called with:', content)
    setPart1Content(content)
    const newPartContent = { part1: content, part2: part2Content, part3: part3Content }
    console.log('Calling onPartContentChange with:', newPartContent)
    onPartContentChange?.(newPartContent)
  }

  const handlePart2ContentChange = (content: string) => {
    setPart2Content(content)
    const newPartContent = { part1: part1Content, part2: content, part3: part3Content }
    onPartContentChange?.(newPartContent)
  }

  const handlePart3ContentChange = (content: string) => {
    setPart3Content(content)
    const newPartContent = { part1: part1Content, part2: part2Content, part3: content }
    onPartContentChange?.(newPartContent)
  }

  // Passage content handlers
  const handlePassage1ContentChange = (content: string) => {
    setPassage1Content(content)
    const newPassageContent = { part1: content, part2: passage2Content, part3: passage3Content }
    onPassageContentChange?.(newPassageContent)
  }

  const handlePassage2ContentChange = (content: string) => {
    setPassage2Content(content)
    const newPassageContent = { part1: passage1Content, part2: content, part3: passage3Content }
    onPassageContentChange?.(newPassageContent)
  }

  const handlePassage3ContentChange = (content: string) => {
    setPassage3Content(content)
    const newPassageContent = { part1: passage1Content, part2: passage2Content, part3: content }
    onPassageContentChange?.(newPassageContent)
  }

  // Modal handlers
  const openModal = async (part: 1 | 2 | 3) => {
    setCurrentEditingPart(part)
    setIsModalOpen(true)
    
    // Fetch content from API when opening modal
    try {
      const response = await fetch(`/api/admin/mocks/part-content?moduleType=${moduleType}&partNumber=${part}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.content) {
          console.log('Fetched content from API:', result.data.content)
          // Update the local state with the fetched content
          switch (part) {
            case 1:
              setPart1Content(result.data.content)
              break
            case 2:
              setPart2Content(result.data.content)
              break
            case 3:
              setPart3Content(result.data.content)
              break
          }
        }
      }
    } catch (error) {
      console.error('Error fetching content from API:', error)
      // Continue with local state if API fails
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  // Passage modal handlers
  const openPassageModal = async (part: 1 | 2 | 3) => {
    setCurrentEditingPassage(part)
    setIsPassageModalOpen(true)
  }

  const closePassageModal = () => {
    setIsPassageModalOpen(false)
  }

  const handlePassageModalSave = async (content: string) => {
    console.log('handlePassageModalSave called with content:', content)
    console.log('currentEditingPassage:', currentEditingPassage)
    
    if (currentEditingPassage === 1) {
      handlePassage1ContentChange(content)
    } else if (currentEditingPassage === 2) {
      handlePassage2ContentChange(content)
    } else if (currentEditingPassage === 3) {
      handlePassage3ContentChange(content)
    }
    
    setIsPassageModalOpen(false)
  }

  const getCurrentPassageContent = () => {
    if (currentEditingPassage === 1) return passage1Content
    if (currentEditingPassage === 2) return passage2Content
    return passage3Content
  }

  const handleModalSave = async (content: string) => {
    console.log('handleModalSave called with content:', content)
    console.log('currentEditingPart:', currentEditingPart)
    
    try {
      // Call the appropriate part content change handler first
      switch (currentEditingPart) {
        case 1:
          console.log('Calling handlePart1ContentChange')
          handlePart1ContentChange(content)
          break
        case 2:
          console.log('Calling handlePart2ContentChange')
          handlePart2ContentChange(content)
          break
        case 3:
          console.log('Calling handlePart3ContentChange')
          handlePart3ContentChange(content)
          break
      }

      // Call API to save content
      const response = await fetch('/api/admin/mocks/part-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleType,
          partNumber: currentEditingPart,
          content: content
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to save content: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Content saved to API:', result)
      
      // Refresh the content preview after saving
      setTimeout(() => {
        const refreshContent = async () => {
          try {
            const refreshResponse = await fetch(`/api/admin/mocks/part-content?moduleType=${moduleType}&partNumber=${currentEditingPart}`)
            if (refreshResponse.ok) {
              const refreshResult = await refreshResponse.json()
              if (refreshResult.success && refreshResult.data.content) {
                console.log('Refreshed content after save:', refreshResult.data.content)
                switch (currentEditingPart) {
                  case 1:
                    setPart1Content(refreshResult.data.content)
                    break
                  case 2:
                    setPart2Content(refreshResult.data.content)
                    break
                  case 3:
                    setPart3Content(refreshResult.data.content)
                    break
                }
              }
            }
          } catch (error) {
            console.error('Error refreshing content:', error)
          }
        }
        refreshContent()
      }, 100)
      
    } catch (error) {
      console.error('Error saving content to API:', error)
      // Still call the local state update even if API fails
      switch (currentEditingPart) {
        case 1:
          handlePart1ContentChange(content)
          break
        case 2:
          handlePart2ContentChange(content)
          break
        case 3:
          handlePart3ContentChange(content)
          break
      }
    }
  }

  const getCurrentPartContent = () => {
    switch (currentEditingPart) {
      case 1:
        return part1Content
      case 2:
        return part2Content
      case 3:
        return part3Content
      default:
        return ''
    }
  }

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
    const newQuestion: IELTSQuestion = {
      id: `question-${Date.now()}`,
      type: newQuestionType,
      content: '',
      options: newQuestionType === 'MULTIPLE_CHOICE' ? ['', '', '', ''] : undefined,
      correctAnswer: newQuestionType === 'MATCHING' ? {} : '',
      points: 1,
      part: newQuestionPart,
      fibData: newQuestionType === 'FIB' ? {
        content: '',
        blanks: [],
        instructions: ''
      } : undefined,
      matchingData: newQuestionType === 'MATCHING' ? {
        leftItems: [],
        rightItems: []
      } : undefined,
      notesCompletionData: newQuestionType === 'NOTES_COMPLETION' ? {
        title: '',
        instructions: '',
        notes: []
      } : undefined,
      summaryCompletionData: newQuestionType === 'SUMMARY_COMPLETION' ? {
        title: '',
        instructions: '',
        content: '',
        blanks: []
      } : undefined,
      trueFalseNotGivenData: newQuestionType === 'TRUE_FALSE_NOT_GIVEN' ? {
        statement: '',
        correctAnswer: 'TRUE'
      } : undefined,
      instructions: ''
    }
    const newQuestions = [...questions, newQuestion]
    setQuestions(newQuestions)
    onQuestionsChange(newQuestions)
  }

  const updateQuestion = (id: string, updates: Partial<IELTSQuestion>) => {
    const newQuestions = questions.map(q => q.id === id ? { ...q, ...updates } : q)
    setQuestions(newQuestions)
    onQuestionsChange(newQuestions)
  }

  const deleteQuestion = (id: string) => {
    const newQuestions = questions.filter(q => q.id !== id)
    setQuestions(newQuestions)
    onQuestionsChange(newQuestions)
  }

  const getPartQuestions = (part: 1 | 2 | 3) => {
    return questions.filter(q => (q.part || 1) === part)
  }

  // Question creation modal handlers
  const openQuestionModal = (part: 1 | 2 | 3) => {
    setCurrentQuestionPart(part)
    setIsQuestionModalOpen(true)
  }

  const closeQuestionModal = () => {
    setIsQuestionModalOpen(false)
  }

  const handleQuestionSave = (questionData: any) => {
    const newQuestion: IELTSQuestion = {
      id: `question-${Date.now()}`,
      type: questionData.type as IELTSQuestion['type'],
      content: questionData.content,
      points: questionData.points,
      part: questionData.part,
      correctAnswer: questionData.correctAnswer,
      ...(questionData.options && { options: questionData.options }),
      ...(questionData.instructions && { instructions: questionData.instructions })
    }
    
    const newQuestions = [...questions, newQuestion]
    setQuestions(newQuestions)
    onQuestionsChange(newQuestions)
  }

  const getQuestionTypeOptions = () => {
    const baseOptions = [
      { value: 'NOTES_COMPLETION', label: 'Notes Completion' },
      { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
      { value: 'TRUE_FALSE_NOT_GIVEN', label: 'True/False/Not Given' },
      { value: 'SUMMARY_COMPLETION', label: 'Summary Completion' },
      { value: 'FIB', label: 'Fill in the Blank' },
      { value: 'MATCHING', label: 'Matching' }
    ]

    return baseOptions
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {moduleType} Module Questions - IELTS Format
        </h3>
        
        <div className="flex items-center space-x-4 mb-6">
          <select
            value={newQuestionType}
            onChange={(e) => setNewQuestionType(e.target.value as IELTSQuestion['type'])}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {getQuestionTypeOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={newQuestionPart}
            onChange={(e) => setNewQuestionPart(parseInt(e.target.value) as 1 | 2 | 3)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value={1}>Part 1</option>
            <option value={2}>Part 2</option>
            <option value={3}>Part 3</option>
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
        </div>
      </div>

      {/* Part-wise Question Organization */}
      {[1, 2, 3].map(part => {
        const partQuestions = getPartQuestions(part as 1 | 2 | 3)
        return (
          <div key={part} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                Part {part} ({partQuestions.length} questions)
              </h4>
              <div className="text-sm text-gray-500">
                {part === 1 && 'Notes completion, multiple choice'}
                {part === 2 && 'Multiple choice, matching'}
                {part === 3 && 'Multiple choice, true/false/not given, summary completion'}
              </div>
            </div>

            {/* Part Content Editor */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Part {part} Content
                </label>
                <button
                  type="button"
                  onClick={() => openModal(part as 1 | 2 | 3)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Content
                </button>
              </div>
              
              {/* Content Preview */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[100px]">
                {(() => {
                  const content = part === 1 ? part1Content : part === 2 ? part2Content : part3Content
                  if (!content.trim()) {
                    return (
                      <div className="text-gray-500 italic">
                        No content added yet. Click "Edit Content" to add content for Part {part}.
                      </div>
                    )
                  }
                  return (
                    <div 
                      className="text-justify leading-relaxed"
                      style={{
                        lineHeight: '1.6',
                        fontSize: '14px',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/__(.*?)__/g, '<u>$1</u>')
                          .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold">$1</h1>')
                          .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold">$1</h2>')
                          .replace(/<div style="text-align: (left|center|right|justify);">(.*?)<\/div>/g, '<div style="text-align: $1;" class="my-2">$2</div>')
                          .replace(/\n/g, '<br>')
                          // Apply the same formatting as in the preview
                          .replace(/<p>/g, '<p class="mb-4" style="margin-bottom: 1rem;">')
                          .replace(/<p[^>]*><strong>([A-Z])\.<\/strong>/g, '<p class="mb-4" style="margin-bottom: 1rem;"><strong style="font-weight: bold; color: #111827;">$1.</strong>')
                          .replace(/<p[^>]*>([^<]*[A-Z]\.)/g, '<p class="mb-4" style="margin-bottom: 1rem;"><strong style="font-weight: bold; color: #111827;">$1</strong>')
                      }}
                    />
                  )
                })()}
              </div>
              
              <p className="mt-1 text-xs text-gray-500">
                This content will be displayed at the top of Part {part} for students.
              </p>
            </div>

            {/* Passage Content Editor - Only for Reading modules */}
            {moduleType === 'READING' && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Part {part} Reading Passage
                  </label>
                  <button
                    type="button"
                    onClick={() => openPassageModal(part as 1 | 2 | 3)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Edit Passage
                  </button>
                </div>
                
                {/* Passage Preview */}
                <div className="border border-gray-200 rounded-lg p-4 bg-green-50 min-h-[100px]">
                  {(() => {
                    const passageContent = part === 1 ? passage1Content : part === 2 ? passage2Content : passage3Content
                    if (!passageContent.trim()) {
                      return (
                        <div className="text-gray-500 italic">
                          No reading passage added yet. Click "Edit Passage" to add the reading passage for Part {part}.
                        </div>
                      )
                    }
                    return (
                      <div className="text-sm text-gray-700">
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: passageContent
                              .replace(/<p>/g, '<p class="mb-2">')
                              .substring(0, 200) + (passageContent.length > 200 ? '...' : '')
                          }}
                        />
                      </div>
                    )
                  })()}
                </div>
                
                <p className="mt-1 text-xs text-gray-500">
                  This reading passage will be displayed for Part {part} questions.
                </p>
              </div>
            )}

            {/* Create Question Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => openQuestionModal(part as 1 | 2 | 3)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Question for Part {part}
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={partQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {partQuestions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No questions in Part {part} yet.</p>
                      <p className="text-sm">Add questions to this part using the controls above.</p>
                    </div>
                  ) : (
                    partQuestions.map((question) => (
                      <SortableIELTSQuestion
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
          </div>
        )
      })}

      {questions.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No questions</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first question.          </p>
        </div>
      )}

      {/* Part Content Modal */}
      <PartContentModal
        key={`part-${currentEditingPart}-${isModalOpen}`}
        isOpen={isModalOpen}
        onClose={closeModal}
        partNumber={currentEditingPart}
        content={getCurrentPartContent()}
        onSave={handleModalSave}
        title={`Edit Part ${currentEditingPart} Content`}
      />

      {/* Passage Content Modal - Only for Reading modules */}
      {moduleType === 'READING' && (
        <PartContentModal
          key={`passage-${currentEditingPassage}-${isPassageModalOpen}`}
          isOpen={isPassageModalOpen}
          onClose={closePassageModal}
          partNumber={currentEditingPassage}
          content={getCurrentPassageContent()}
          onSave={handlePassageModalSave}
          title={`Edit Part ${currentEditingPassage} Reading Passage`}
        />
      )}

      {/* Question Creation Modal */}
      <QuestionCreationModal
        isOpen={isQuestionModalOpen}
        onClose={closeQuestionModal}
        onSave={handleQuestionSave}
        part={currentQuestionPart}
      />
    </div>
  )
}
