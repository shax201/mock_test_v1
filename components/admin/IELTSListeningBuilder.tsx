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
import QuestionCreationModal from './QuestionCreationModal'
import AudioFileUpload from './AudioFileUpload'

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

interface IELTSListeningBuilderProps {
  moduleType: 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING'
  onQuestionsChange: (questions: IELTSQuestion[]) => void
  onAudioFileChange?: (audioUrl: string, publicId?: string) => void
  initialQuestions?: IELTSQuestion[]
  initialAudioUrl?: string
  initialPublicId?: string
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
      className={`bg-white border border-gray-200 rounded-lg p-4 mb-4 ${
        isDragging ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {getQuestionTypeLabel(question.type)}
            </span>
            {question.part && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Part {question.part}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdate(question.id, {})}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(question.id)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-700">
        <div className="font-medium mb-2">Question Content:</div>
        <div className="bg-gray-50 p-3 rounded border">
          {question.content ? (
            <div dangerouslySetInnerHTML={{ __html: question.content }} />
          ) : (
            <span className="text-gray-400 italic">No content</span>
          )}
        </div>
        
        {question.instructions && (
          <div className="mt-2">
            <div className="font-medium mb-1">Instructions:</div>
            <div className="bg-gray-50 p-2 rounded border text-xs">
              {question.instructions}
            </div>
          </div>
        )}

        {question.options && question.options.length > 0 && (
          <div className="mt-2">
            <div className="font-medium mb-1">Options:</div>
            <div className="bg-gray-50 p-2 rounded border text-xs">
              {question.options.map((option, index) => (
                <div key={index} className="mb-1">
                  {String.fromCharCode(65 + index)}. {option}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2 text-xs text-gray-500">
          Points: {question.points}
        </div>
      </div>
    </div>
  )
}

export default function IELTSListeningBuilder({ 
  moduleType, 
  onQuestionsChange, 
  onAudioFileChange,
  initialQuestions = [], 
  initialAudioUrl = '',
  initialPublicId = ''
}: IELTSListeningBuilderProps) {
  const [questions, setQuestions] = useState<IELTSQuestion[]>(initialQuestions)
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl)
  const [publicId, setPublicId] = useState(initialPublicId)
  const [newQuestionType, setNewQuestionType] = useState<IELTSQuestion['type']>('NOTES_COMPLETION')
  const [newQuestionPart, setNewQuestionPart] = useState<1 | 2 | 3>(1)
  
  // Modal state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [currentQuestionPart, setCurrentQuestionPart] = useState<1 | 2 | 3>(1)

  // Update questions when initialQuestions change
  useEffect(() => {
    if (initialQuestions.length > 0) {
      setQuestions(initialQuestions)
    }
  }, [initialQuestions])

  // Update audio URL when initialAudioUrl changes
  useEffect(() => {
    if (initialAudioUrl) {
      setAudioUrl(initialAudioUrl)
    }
  }, [initialAudioUrl])

  const handleAudioFileChange = (url: string, newPublicId?: string) => {
    console.log('IELTSListeningBuilder: Audio file changed:', {
      url,
      publicId: newPublicId,
      urlLength: url?.length || 0,
      hasUrl: !!url
    })
    setAudioUrl(url)
    setPublicId(newPublicId || '')
    onAudioFileChange?.(url, newPublicId)
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

        const newQuestions = arrayMove(items, oldIndex, newIndex)
        onQuestionsChange(newQuestions)
        return newQuestions
      })
    }
  }

  const addQuestion = () => {
    const newQuestion: IELTSQuestion = {
      id: `question-${Date.now()}`,
      type: newQuestionType,
      content: '',
      correctAnswer: '',
      points: 1,
      part: newQuestionPart,
      instructions: ''
    }

    const newQuestions = [...questions, newQuestion]
    setQuestions(newQuestions)
    onQuestionsChange(newQuestions)
  }

  const updateQuestion = (id: string, updates: Partial<IELTSQuestion>) => {
    const newQuestions = questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    )
    setQuestions(newQuestions)
    onQuestionsChange(newQuestions)
  }

  const deleteQuestion = (id: string) => {
    const newQuestions = questions.filter(q => q.id !== id)
    setQuestions(newQuestions)
    onQuestionsChange(newQuestions)
  }

  const openQuestionModal = (part: 1 | 2 | 3) => {
    setCurrentQuestionPart(part)
    setIsQuestionModalOpen(true)
  }

  const closeQuestionModal = () => {
    setIsQuestionModalOpen(false)
  }

  const saveQuestion = (questionData: any) => {
    const newQuestion: IELTSQuestion = {
      id: `question-${Date.now()}`,
      type: questionData.type,
      content: questionData.content,
      correctAnswer: questionData.correctAnswer,
      points: questionData.points,
      part: currentQuestionPart,
      instructions: questionData.instructions,
      ...questionData
    }

    const newQuestions = [...questions, newQuestion]
    setQuestions(newQuestions)
    onQuestionsChange(newQuestions)
  }

  const getQuestionsForPart = (part: number) => {
    return questions.filter(q => q.part === part)
  }

  const getTotalParts = () => {
    const parts = new Set(questions.map(q => q.part || 1))
    return Math.max(...parts, 1)
  }

  return (
    <div className="space-y-6">
      {/* Audio File Upload Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Audio File</h3>
        <AudioFileUpload
          onFileChange={(file, url, publicId) => {
            if (url) {
              handleAudioFileChange(url, publicId)
            }
          }}
          initialUrl={audioUrl}
          initialPublicId={publicId}
          maxSize={25}
        />
      </div>

      {/* Questions Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Listening Questions</h3>
          <div className="flex items-center space-x-4">
            <select
              value={newQuestionType}
              onChange={(e) => setNewQuestionType(e.target.value as IELTSQuestion['type'])}
              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="NOTES_COMPLETION">Notes Completion</option>
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              <option value="TRUE_FALSE_NOT_GIVEN">True/False/Not Given</option>
              <option value="SUMMARY_COMPLETION">Summary Completion</option>
              <option value="FIB">Fill in the Blank</option>
              <option value="MATCHING">Matching</option>
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

        {/* Part Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1">
            {Array.from({ length: getTotalParts() }, (_, i) => i + 1).map((partNum) => {
              const partQuestions = getQuestionsForPart(partNum)
              return (
                <button
                  key={partNum}
                  onClick={() => openQuestionModal(partNum as 1 | 2 | 3)}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Part {partNum} ({partQuestions.length} questions)
                </button>
              )
            })}
          </div>
        </div>

        {/* Questions List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No questions</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new question.</p>
              </div>
            ) : (
              questions.map((question) => (
                <SortableIELTSQuestion
                  key={question.id}
                  question={question}
                  onUpdate={updateQuestion}
                  onDelete={deleteQuestion}
                />
              ))
            )}
          </SortableContext>
        </DndContext>
      </div>

      {/* Question Creation Modal */}
      <QuestionCreationModal
        isOpen={isQuestionModalOpen}
        onClose={closeQuestionModal}
        onSave={saveQuestion}
        part={currentQuestionPart}
      />
    </div>
  )
}
