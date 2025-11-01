'use client'

import { useState } from 'react'

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
  type: 'NOTES_COMPLETION' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE_NOT_GIVEN' | 'TRUE_FALSE' | 'SUMMARY_COMPLETION' | 'FIB' | 'MATCHING'
  content: string
  options?: string[]
  correctAnswer: string | string[] | Record<string, string>
  points: number
  part: 1 | 2 | 3
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

interface IELTSQuestionRendererProps {
  question: IELTSQuestion
  questionNumber: number
  onAnswerChange: (questionId: string, answer: string | Record<string, string>) => void
  initialAnswer?: string | Record<string, string>
  disabled?: boolean
  showInstructions?: boolean
  partContent?: PartContent
}

export default function IELTSQuestionRenderer({
  question,
  questionNumber,
  onAnswerChange,
  initialAnswer,
  disabled = false,
  showInstructions = true,
  partContent
}: IELTSQuestionRendererProps) {
  const [localAnswer, setLocalAnswer] = useState<string | Record<string, string>>(initialAnswer || '')

  const handleAnswerChange = (answer: string | Record<string, string>) => {
    setLocalAnswer(answer)
    onAnswerChange(question.id, answer)
  }

  const renderNotesCompletion = () => {
    if (!question.notesCompletionData) return null

    return (
      <div className="space-y-4">
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-center mb-6 uppercase tracking-wide">
            {question.notesCompletionData.title}
          </h3>
          
          <div className="space-y-4">
            {question.notesCompletionData.notes.map((note, index) => (
              <div key={note.id} className="flex items-center space-x-2">
                <span className="text-sm">- {note.content}</span>
                {note.hasBlank && (
                  <input
                    type="text"
                    value={typeof localAnswer === 'string' ? localAnswer : ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    disabled={disabled}
                    className="w-24 h-8 border border-gray-300 rounded px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`${questionNumber}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderSummaryCompletion = () => {
    // Handle both structured data and simple content formats
    const content = question.summaryCompletionData?.content || question.content || ''
    const title = question.summaryCompletionData?.title || 'Summary Completion'
    
    if (!content) return null

    return (
      <div className="space-y-4">
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-center mb-6 uppercase tracking-wide">
            {title}
          </h3>
          
          <div className="text-sm leading-relaxed">
            {content.split(/(\[\d+\]|_____+)/).map((part, index) => {
              const blankMatch = part.match(/\[(\d+)\]/)
              const underscoreMatch = part.match(/^(_+)$/)
              
              if (blankMatch) {
                const blankNumber = parseInt(blankMatch[1])
                return (
                  <span key={index} className="inline-block">
                    <input
                      type="text"
                      value={typeof localAnswer === 'string' ? localAnswer : ''}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      disabled={disabled}
                      className="w-16 h-6 border border-gray-300 rounded px-1 text-xs mx-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`${blankNumber}`}
                    />
                  </span>
                )
              } else if (underscoreMatch) {
                return (
                  <span key={index} className="inline-block">
                    <input
                      type="text"
                      value={typeof localAnswer === 'string' ? localAnswer : ''}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      disabled={disabled}
                      className="w-16 h-6 border border-gray-300 rounded px-1 text-xs mx-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Answer"
                    />
                  </span>
                )
              }
              return <span key={index}>{part}</span>
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderTrueFalseNotGiven = () => {
    return (
      <div className="space-y-4">
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm mb-4">
            {question.trueFalseNotGivenData?.statement || question.content}
          </div>
          
          <div className="space-y-2">
            {(['TRUE', 'FALSE', 'NOT_GIVEN'] as const).map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={localAnswer === option}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  disabled={disabled}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderTrueFalse = () => {
    return (
      <div className="space-y-4">
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm mb-4">
            {question.content}
          </div>
          
          <div className="space-y-2">
            {(['TRUE', 'FALSE'] as const).map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={localAnswer === option}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  disabled={disabled}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderMultipleChoice = () => {
    return (
      <div className="space-y-4">
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm mb-4">
            {question.content}
          </div>
          
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={localAnswer === option}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  disabled={disabled}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderFillInTheBlank = () => {
    // Handle both fibData and simple content formats
    const content = question.fibData?.content || question.content || ''
    
    if (!content) return null

    return (
      <div className="space-y-4">
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm leading-relaxed">
            {content.split(/(\[BLANK_\d+\]|_____+)/).map((part, index) => {
              const blankMatch = part.match(/\[BLANK_(\d+)\]/)
              const underscoreMatch = part.match(/^(_+)$/)
              
              if (blankMatch || underscoreMatch) {
                return (
                  <span key={index} className="inline-block">
                    <input
                      type="text"
                      value={typeof localAnswer === 'string' ? localAnswer : ''}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      disabled={disabled}
                      className="inline-block border-2 border-dashed border-gray-400 bg-gray-50 px-3 py-2 rounded text-center min-w-24 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-500"
                      placeholder="Answer"
                      style={{
                        margin: '0 4px',
                        verticalAlign: 'middle',
                        fontFamily: 'inherit',
                        fontSize: 'inherit'
                      }}
                    />
                  </span>
                )
              }
              return <span key={index}>{part}</span>
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderMatching = () => {
    if (!question.matchingData) return null

    return (
      <div className="space-y-4">
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Column A</h4>
              <div className="space-y-2">
                {question.matchingData.leftItems.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm">{item.content}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Column B</h4>
              <div className="space-y-2">
                {question.matchingData.rightItems.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm">{item.content}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderPartContent = () => {
    if (!partContent) return null
    
    const partKey = `part${question.part || 1}` as keyof PartContent
    const content = partContent[partKey]
    
    if (!content) return null
    
    return (
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Part {question.part || 1} Content</h4>
        <div 
          className="text-sm text-blue-800 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    )
  }

  const renderQuestion = () => {
    switch (question.type) {
      case 'NOTES_COMPLETION':
        return renderNotesCompletion()
      case 'SUMMARY_COMPLETION':
        return renderSummaryCompletion()
      case 'TRUE_FALSE_NOT_GIVEN':
        return renderTrueFalseNotGiven()
      case 'TRUE_FALSE':
        return renderTrueFalse()
      case 'MULTIPLE_CHOICE':
        return renderMultipleChoice()
      case 'FIB':
        return renderFillInTheBlank()
      case 'MATCHING':
        return renderMatching()
      default:
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Unsupported question type: {question.type}
            </p>
          </div>
        )
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Question {questionNumber}
        </h3>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Part {question.part || 1}
          </span>
          <span className="text-sm text-gray-500">{question.points} points</span>
        </div>
      </div>
      
      {renderPartContent()}
      {renderQuestion()}
    </div>
  )
}
