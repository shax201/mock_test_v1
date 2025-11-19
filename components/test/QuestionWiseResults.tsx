'use client'

import { useState, useEffect, useRef } from 'react'
import DynamicTableEditor, { TableStructure } from '@/components/admin/DynamicTableEditor'

interface WritingNote {
  id: string
  start: number
  end: number
  text: string
  category: string
  comment: string
}

interface Question {
  id: string
  questionNumber?: number
  question: string
  type: string
  part: number
  options?: string[]
  studentAnswer: string
  notes?: WritingNote[]
  correctAnswer: string
  isCorrect: boolean | null
  explanation?: string
  moduleType: 'reading' | 'listening' | 'writing'
  wordCount?: number
  tableStructure?: TableStructure | null
  tableAnswers?: Record<number, string> | null
  tableQuestionNumbers?: Record<number, number> | null
  flowChartDiagram?: FlowChartDiagram | null
}

interface FlowChartField {
  x: number
  y: number
  width?: number
  height?: number
  label?: string
}

interface FlowChartDiagram {
  imageUrl: string | null
  nodes: {
    questionNumber: number
    field?: FlowChartField | null
    studentAnswer: string
  }[]
}

function FlowChartPreview({
  diagram,
  activeQuestionNumber
}: {
  diagram: FlowChartDiagram
  activeQuestionNumber?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState({ x: 1, y: 1 })

  const updateScale = () => {
    if (!imageRef.current) return
    const img = imageRef.current
    if (!img.naturalWidth || !img.naturalHeight) return
    setScale({
      x: img.clientWidth / img.naturalWidth,
      y: img.clientHeight / img.naturalHeight
    })
  }

  useEffect(() => {
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  const nodes = Array.isArray(diagram.nodes) ? diagram.nodes : []

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white max-w-3xl mx-auto">
      <div ref={containerRef} className="relative w-full">
        {diagram.imageUrl ? (
          <img
            ref={imageRef}
            src={diagram.imageUrl}
            alt="Flow chart"
            className="w-full h-auto block"
            onLoad={updateScale}
          />
        ) : (
          <div className="w-full h-64 flex items-center justify-center text-sm text-gray-500">
            Flow chart image unavailable
          </div>
        )}
        {nodes.map((node) => {
          const field = node.field
          if (!field || typeof field.x !== 'number' || typeof field.y !== 'number') return null
          const scaledX = field.x * scale.x
          const scaledY = field.y * scale.y
          const scaledWidth = (field.width || 140) * scale.x
          const scaledHeight = (field.height || 36) * scale.y
          const displayStudentAnswer =
            node.studentAnswer && node.studentAnswer !== 'Unattempted' ? node.studentAnswer : '—'
          const isActive = node.questionNumber === activeQuestionNumber

          return (
            <div
              key={node.questionNumber}
              className={`absolute rounded border-2 bg-white/95 shadow-sm flex items-center justify-center px-3 text-sm font-semibold ${
                isActive ? 'border-blue-500 text-blue-700' : 'border-gray-300 text-gray-800'
              }`}
              style={{
                left: `${scaledX}px`,
                top: `${scaledY}px`,
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`
              }}
            >
              {displayStudentAnswer}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface QuestionWiseResultsProps {
  testId: string
  questions: Question[]
  totalQuestions: number
}

export default function QuestionWiseResults({ testId, questions, totalQuestions }: QuestionWiseResultsProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [filterType, setFilterType] = useState<'all' | 'reading' | 'listening' | 'writing'>('all')
  const [isBookmarked, setIsBookmarked] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Filter questions based on type
  const filteredQuestions = questions.filter(q => 
    filterType === 'all' || q.moduleType === filterType
  )

  const renderAnnotatedText = (text: string, notes?: WritingNote[]) => {
    if (!text) {
      return <span className="text-gray-400 italic">No answer provided</span>
    }

    if (!notes || !notes.length) {
      return <>{text}</>
    }

    const sorted = [...notes].sort((a, b) => a.start - b.start)
    const segments: JSX.Element[] = []
    let cursor = 0

    sorted.forEach((note, index) => {
      const safeStart = Math.max(0, Math.min(note.start, text.length))
      const safeEnd = Math.max(safeStart, Math.min(note.end, text.length))

      if (cursor < safeStart) {
        segments.push(
          <span key={`plain-${index}`}>{text.slice(cursor, safeStart)}</span>
        )
      }

      segments.push(
        <mark
          key={`note-${note.id}`}
          className="rounded bg-yellow-200/70 px-0.5 py-0.5 text-slate-900"
          title={`${note.category}: ${note.comment}`}
        >
          {text.slice(safeStart, safeEnd)}
        </mark>
      )

      cursor = safeEnd
    })

    if (cursor < text.length) {
      segments.push(
        <span key="plain-tail">{text.slice(cursor)}</span>
      )
    }

    return segments
  }

  // Set initial question
  useEffect(() => {
    if (filteredQuestions.length > 0 && !selectedQuestion) {
      setSelectedQuestion(filteredQuestions[0])
      setCurrentQuestionIndex(0)
    }
  }, [filteredQuestions, selectedQuestion])

  // Handle question selection
  const handleQuestionSelect = (question: Question, index: number) => {
    setSelectedQuestion(question)
    setCurrentQuestionIndex(index)
  }

  // Navigate to previous question
  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1
      setCurrentQuestionIndex(newIndex)
      setSelectedQuestion(filteredQuestions[newIndex])
    }
  }

  // Navigate to next question
  const goToNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      const newIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(newIndex)
      setSelectedQuestion(filteredQuestions[newIndex])
    }
  }

  // Scroll to question in navigation
  const scrollToQuestion = (index: number) => {
    if (scrollContainerRef.current) {
      const questionElement = scrollContainerRef.current.children[index] as HTMLElement
      if (questionElement) {
        questionElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'center'
        })
      }
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentQuestionIndex, filteredQuestions.length])

  if (!selectedQuestion) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">No Questions Available</h3>
        <p className="text-gray-600">Question details are not available for this test.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Check answers with explanation for all {totalQuestions} questions
        </h2>
        <div className="flex items-center space-x-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Questions</option>
            <option value="reading">Reading Questions</option>
            <option value="listening">Listening Questions</option>
            <option value="writing">Writing Questions</option>
          </select>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="space-y-4">
        {/* Question Numbers */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2" ref={scrollContainerRef}>
          {filteredQuestions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => {
                handleQuestionSelect(question, index)
                scrollToQuestion(index)
              }}
              className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                selectedQuestion?.id === question.id
                  ? 'bg-gray-800 text-white border-gray-800'
                  : question.isCorrect === true
                  ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                  : question.isCorrect === false
                  ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {filteredQuestions.length}
            </span>
          </div>

          <button
            onClick={goToNext}
            disabled={currentQuestionIndex === filteredQuestions.length - 1}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        {/* Question Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-2xl font-bold text-gray-900">
              Question {currentQuestionIndex + 1}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-2 rounded-full transition-colors ${
                  isBookmarked 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'text-gray-400 hover:text-yellow-500'
                }`}
              >
                <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Question Tags */}
        <div className="flex items-center space-x-3 mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedQuestion.moduleType === 'reading' 
              ? 'bg-blue-100 text-blue-800' 
              : selectedQuestion.moduleType === 'listening'
              ? 'bg-green-100 text-green-800'
              : 'bg-purple-100 text-purple-800'
          }`}>
            {selectedQuestion.moduleType.charAt(0).toUpperCase() + selectedQuestion.moduleType.slice(1)}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Part {selectedQuestion.part}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            {selectedQuestion.type}
          </span>
          {selectedQuestion.isCorrect !== null && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedQuestion.isCorrect 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {selectedQuestion.isCorrect ? 'Correct' : 'Incorrect'}
            </span>
          )}
          {selectedQuestion.isCorrect === null && selectedQuestion.moduleType === 'writing' && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              Pending Evaluation
            </span>
          )}
          {selectedQuestion.wordCount !== undefined && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              {selectedQuestion.wordCount} words
            </span>
          )}
        </div>

        {/* Question Content */}
        <div className="space-y-6">
          {/* Question Text */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Question:</h4>
            <p className="text-gray-800 leading-relaxed">{selectedQuestion.question}</p>
          </div>

          {/* Flow Chart Preview */}
          {selectedQuestion.type === 'FLOW_CHART' &&
            selectedQuestion.flowChartDiagram && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Flow Chart:</h4>
                <FlowChartPreview
                  diagram={selectedQuestion.flowChartDiagram}
                  activeQuestionNumber={selectedQuestion.questionNumber}
                />
              </div>
            )}

          {/* Table Preview for Table Completion */}
          {selectedQuestion.type === 'TABLE_COMPLETION' && selectedQuestion.tableStructure && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Table Context:</h4>
              <DynamicTableEditor
                structure={selectedQuestion.tableStructure}
                onStructureChange={() => {}}
                initialAnswers={selectedQuestion.tableAnswers || {}}
                readOnly
                questionNumbers={selectedQuestion.tableQuestionNumbers || undefined}
              />
            </div>
          )}

          {/* Options (if available) */}
          {selectedQuestion.options && selectedQuestion.options.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Options:</h4>
              <div className="space-y-2">
                {selectedQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-gray-800">{option}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answer Comparison */}
          {selectedQuestion.moduleType === 'writing' ? (
            /* Writing Answer Display - Full text response */
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Your Answer:</h4>
                  {selectedQuestion.wordCount !== undefined && (
                    <span className="text-sm text-gray-600">
                      Word Count: {selectedQuestion.wordCount}
                    </span>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-white border border-gray-200 min-h-[200px]">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {renderAnnotatedText(selectedQuestion.studentAnswer, selectedQuestion.notes)}
                  </p>
                </div>
              </div>
              {selectedQuestion.notes && selectedQuestion.notes.length > 0 && (
                <div className="bg-white border border-dashed border-blue-200 rounded-lg p-6">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3 uppercase tracking-wide">Instructor Notes</h4>
                  <div className="space-y-3">
                    {selectedQuestion.notes.map((note) => (
                      <div key={note.id} className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-left">
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                            {note.category}
                          </span>
                          <span className="text-xs text-blue-700">
                            Characters {note.start + 1}–{note.end}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-blue-900 italic">“{note.text}”</p>
                        <p className="mt-2 text-sm text-blue-900">{note.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedQuestion.correctAnswer && selectedQuestion.correctAnswer !== 'Evaluation pending' && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Evaluation:</h4>
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-gray-800">{selectedQuestion.correctAnswer}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Reading/Listening Answer Display - Side by side comparison */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Answer:</h4>
                <div className={`p-4 rounded-lg ${
                  selectedQuestion.isCorrect === true
                    ? 'bg-green-100 text-green-800' 
                    : selectedQuestion.isCorrect === false
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="font-medium">
                    {selectedQuestion.studentAnswer || 'No answer provided'}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Correct Answer:</h4>
                <div className="p-4 rounded-lg bg-green-100 text-green-800">
                  <p className="font-medium">{selectedQuestion.correctAnswer}</p>
                </div>
              </div>
            </div>
          )}

          {/* Explanation */}
          {selectedQuestion.explanation && (
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-4">Explanation:</h4>
              <p className="text-blue-800 leading-relaxed">{selectedQuestion.explanation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="text-center text-sm text-gray-500">
        <p>Use ← → arrow keys to navigate between questions</p>
      </div>
    </div>
  )
}
