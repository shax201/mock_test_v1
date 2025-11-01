'use client'

import { useState, useEffect } from 'react'

interface PassageSection {
  id: string
  number: number
  content: string
  hasHeading?: boolean
  heading?: string
}

interface MatchingHeadingsQuestionProps {
  question: {
    id: string
    passage: {
      title: string
      sections: PassageSection[]
    }
    headings: string[]
    correctAnswers: Record<string, string>
    instructions: string
  }
  onAnswerChange: (answers: Record<string, string>) => void
  initialAnswers?: Record<string, string>
  disabled?: boolean
}

export default function MatchingHeadingsQuestion({
  question,
  onAnswerChange,
  initialAnswers = {},
  disabled = false
}: MatchingHeadingsQuestionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers)
  const [draggedHeading, setDraggedHeading] = useState<string | null>(null)
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(65)
  const [isResizing, setIsResizing] = useState<boolean>(false)

  useEffect(() => {
    setAnswers(initialAnswers)
  }, [initialAnswers])

  const handleDragStart = (e: React.DragEvent, heading: string, isFromGap: boolean = false, sectionId?: string) => {
    if (!disabled) {
      console.log('Drag started:', { heading, isFromGap, sectionId })
      setDraggedHeading(heading)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', heading)
      if (isFromGap && sectionId) {
        e.dataTransfer.setData('application/json', JSON.stringify({ isFromGap, sectionId }))
      }
      // Prevent default to allow drag
      e.stopPropagation()
    }
  }

  const handleDragEnd = () => {
    setDraggedHeading(null)
  }

  const handleDrop = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const heading = e.dataTransfer.getData('text/plain')
    console.log('Drop event:', { heading, sectionId, disabled, dataTransfer: e.dataTransfer })
    
    if (heading && !disabled) {
      // Check if this is from a gap
      const dragData = e.dataTransfer.getData('application/json')
      let sourceSectionId = null
      
      if (dragData) {
        try {
          const { isFromGap, sectionId: sourceId } = JSON.parse(dragData)
          if (isFromGap) {
            sourceSectionId = sourceId
          }
        } catch (error) {
          console.log('Error parsing drag data:', error)
        }
      }
      
      const newAnswers = { ...answers }
      
      // If moving from one gap to another, remove from source first
      if (sourceSectionId && sourceSectionId !== sectionId) {
        delete newAnswers[sourceSectionId]
      }
      
      // Add to target gap
      newAnswers[sectionId] = heading
      setAnswers(newAnswers)
      onAnswerChange(newAnswers)
      setDraggedHeading(null)
      console.log('Answer updated:', newAnswers)
    }
  }

  const handleDropToHeadings = (e: React.DragEvent) => {
    e.preventDefault()
    const heading = e.dataTransfer.getData('text/plain')
    const dragData = e.dataTransfer.getData('application/json')
    
    console.log('Drop to headings:', { heading, dragData })
    
    if (heading && !disabled && dragData) {
      try {
        const { isFromGap, sectionId } = JSON.parse(dragData)
        
        if (isFromGap && sectionId) {
          // Remove from gap
          const newAnswers = { ...answers }
          delete newAnswers[sectionId]
          setAnswers(newAnswers)
          onAnswerChange(newAnswers)
          setDraggedHeading(null)
          console.log('Answer removed from gap:', sectionId)
        }
      } catch (error) {
        console.log('Error parsing drag data:', error)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Resizable divider handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    const containerWidth = window.innerWidth
    const newLeft = (e.clientX / containerWidth) * 100
    const constrained = Math.min(Math.max(newLeft, 20), 80)
    setLeftPanelWidth(constrained)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  const getAnswerForSection = (sectionId: string) => {
    return answers[sectionId] || ''
  }

  const isHeadingUsed = (heading: string) => {
    return Object.values(answers).includes(heading)
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with IELTS branding and timer */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-red-600">IELTS</div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Rem Candidate - 284262</span>
              <span className="ml-4">00 minute, 31 seconds remaining</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 select-none">
        {/* Left Panel - Reading Passage */}
        <div
          className="overflow-y-auto border-r border-gray-200"
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* Part 1 Header */}
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Part 1</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Read the text below and answer questions 1 - {question.passage.sections.length}
                </p>
              </div>
              <button className="flex items-center space-x-1 px-3 py-1 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Help</span>
              </button>
            </div>
          </div>
          
          {/* Reading Passage Content */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              {question.passage.title}
            </h2>
            
            <div className="space-y-6">
              {question.passage.sections.map((section, index) => {
                const answer = getAnswerForSection(section.id)
                const isGap = !section.hasHeading
                
                return (
                  <div key={section.id} className="space-y-3">
                    {/* Section heading or gap */}
                    {isGap ? (
                      <div className="flex items-start space-x-4">
                        {/* <span className="flex-shrink-0 w-8 h-8 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-lg font-bold">
                          {index + 1}
                        </span> */}
                        <div className="flex-1">
                          <p className="text-gray-900 leading-relaxed text-sm text-justify">
                            {section.content.split(' ').map((word, wordIndex) => {
                              // Insert gap after first few words
                              if (wordIndex === 3) {
                                return (
                                  <span key={wordIndex}>
                                    <span
                                      className={`inline-block min-w-[150px] border-2 border-dashed border-gray-400 rounded px-2 py-1 mx-2 transition-colors ${
                                        answer
                                          ? 'border-green-400 bg-green-50'
                                          : 'border-gray-400 hover:border-blue-500'
                                      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                      onDrop={(e) => {
                                        console.log('Drop triggered on gap')
                                        handleDrop(e, section.id)
                                      }}
                                      onDragOver={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleDragOver(e)
                                      }}
                                      onDragEnter={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        e.currentTarget.classList.add('border-blue-500', 'bg-blue-50')
                                      }}
                                      onDragLeave={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
                                      }}
                                      onClick={() => {
                                        if (!disabled && draggedHeading) {
                                          console.log('Click to place:', draggedHeading, section.id)
                                          const newAnswers = { ...answers, [section.id]: draggedHeading }
                                          setAnswers(newAnswers)
                                          onAnswerChange(newAnswers)
                                          setDraggedHeading(null)
                                        }
                                      }}
                                    >
                                      {answer ? (
                                        <span 
                                          className="text-sm font-medium text-green-800 cursor-move select-none"
                                          draggable={!disabled}
                                          onDragStart={(e) => handleDragStart(e, answer, true, section.id)}
                                          onDragEnd={handleDragEnd}
                                        >
                                          {answer}
                                          {!disabled && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                const newAnswers = { ...answers }
                                                delete newAnswers[section.id]
                                                setAnswers(newAnswers)
                                                onAnswerChange(newAnswers)
                                              }}
                                              className="text-red-500 hover:text-red-700 text-xs ml-1"
                                            >
                                              ✕
                                            </button>
                                          )}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-xs font-bold">{index + 1}</span>
                                      )}
                                    </span>
                                    {word}
                                  </span>
                                )
                              }
                              return <span key={wordIndex}>{word} </span>
                            })}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-4">
                        {/* <span className="flex-shrink-0 w-8 h-8 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-lg font-bold">
                          {index + 1}
                        </span> */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {section.heading}
                          </h3>
                          <p className="text-gray-900 leading-relaxed text-sm text-justify">
                            {section.content}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          className={`w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize flex items-center justify-center transition-colors ${
            isResizing ? 'bg-gray-500' : ''
          }`}
          onMouseDown={handleMouseDown}
        >
          <div className="w-0.5 h-8 bg-gray-500 rounded-full" />
        </div>

        {/* Right Panel - Headings List */}
        <div 
          className="bg-gray-50 p-6"
          style={{ width: `${100 - leftPanelWidth}%` }}
          onDrop={handleDropToHeadings}
          onDragOver={handleDragOver}
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Questions 1-{question.passage.sections.length}
            </h3>
            <p className="text-sm text-gray-600">
              Choose the correct heading for each section and move it into the gap.
            </p>
          </div>

          {/* Arrow pointing left */}
          <div className="flex justify-center mb-6">
            <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </div>

          {/* Headings List */}
          <div className="space-y-3">
            {question.headings
              .filter((heading) => !isHeadingUsed(heading))
              .map((heading) => {
                const isDragging = draggedHeading === heading
                
                return (
                  <div
                    key={heading}
                    draggable={!disabled}
                    onDragStart={(e) => {
                      console.log('Heading drag start:', heading)
                      handleDragStart(e, heading)
                    }}
                    onDragEnd={() => {
                      console.log('Heading drag end:', heading)
                      handleDragEnd()
                    }}
                    className={`p-4 rounded-lg border-2 cursor-move transition-all select-none ${
                      isDragging
                        ? 'bg-blue-100 border-blue-300 shadow-lg transform scale-105'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                    } ${disabled ? 'cursor-not-allowed' : ''}`}
                  >
                    <span className="text-sm font-medium">{heading}</span>
                  </div>
                )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="text-sm font-medium text-gray-700">Part 1</span>
            <div className="flex space-x-2">
              {question.passage.sections.map((_, index) => (
                <button
                  key={index}
                  className={`w-8 h-8 rounded text-sm font-medium ${
                    answers[question.passage.sections[index].id]
                      ? 'bg-green-100 text-green-800'
                      : index === 5
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <span className="text-sm text-gray-600">Part 2 0 of 4</span>
            <span className="text-sm text-gray-600">12:35</span>
            <button className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700">
              Exit
            </button>
            <div className="flex space-x-2">
              <button className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center hover:bg-gray-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center hover:bg-gray-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to validate answers
export function validateMatchingHeadingsAnswers(
  userAnswers: Record<string, string>,
  correctAnswers: Record<string, string>
): { score: number; total: number; feedback: Record<string, { correct: boolean; message: string }> } {
  let score = 0
  const total = Object.keys(correctAnswers).length
  const feedback: Record<string, { correct: boolean; message: string }> = {}

  Object.keys(correctAnswers).forEach(sectionId => {
    const userAnswer = userAnswers[sectionId]
    const correctAnswer = correctAnswers[sectionId]
    const isCorrect = userAnswer === correctAnswer

    if (isCorrect) {
      score++
    }

    feedback[sectionId] = {
      correct: isCorrect,
      message: isCorrect 
        ? 'Correct heading!' 
        : `Incorrect. The correct heading is: ${correctAnswer}`
    }
  })

  return { score, total, feedback }
}
