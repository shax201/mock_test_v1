'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import FullscreenGuard from '@/components/test/FullscreenGuard'
import IELTSQuestionRenderer from '@/components/test/IELTSQuestionRenderer'

// Dynamic imports to avoid SSR issues
const DragDropBuilder = dynamic(() => import('@/components/admin/DragDropBuilder'), { ssr: false })
const IELTSQuestionBuilder = dynamic(() => import('@/components/admin/IELTSQuestionBuilder'), { ssr: false })
const IELTSListeningBuilder = dynamic(() => import('@/components/admin/IELTSListeningBuilder'), { ssr: false })

interface Question {
  id: string
  type: 'MCQ' | 'FIB' | 'MATCHING' | 'TRUE_FALSE' | 'NOT_GIVEN' | 'NOTES_COMPLETION' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE_NOT_GIVEN' | 'SUMMARY_COMPLETION'
  content: string
  options?: string[]
  correctAnswer: string | string[] | Record<string, string>
  points: number
  part?: 1 | 2 | 3
  fibData?: {
    content: string
    blanks: Array<{
      id: string
      position: number
      correctAnswer: string
      alternatives?: string[]
      caseSensitive: boolean
    }>
    instructions: string
  }
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
  matchingData?: {
    leftItems: Array<{
      id: string
      label: string
      content: string
    }>
    rightItems: Array<{
      id: string
      label: string
      content: string
    }>
  }
  instructions?: string
}

interface PartContent {
  part1: string
  part2: string
  part3: string
}

interface MockTestData {
  title: string
  description: string
  modules: {
    type: 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING'
    duration: number
    audioUrl?: string
    instructions: string
    questions: Question[]
    partContent?: PartContent
    passageContent?: {
      part1: string
      part2: string
      part3: string
    }
    readingPassage?: {
      title: string
      content: Array<{
        paragraph: string
        text: string
      }>
    }
  }[]
}

export default function CreateMockTest() {
  const [currentStep, setCurrentStep] = useState(1)
  const [mockData, setMockData] = useState<MockTestData>({
    title: '',
    description: '',
    modules: []
  })
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [currentModule, setCurrentModule] = useState<'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING'>('READING')
  const [partContent, setPartContent] = useState<PartContent>({ part1: '', part2: '', part3: '' })
  const [passageContent, setPassageContent] = useState<{
    part1: string
    part2: string
    part3: string
  }>({
    part1: '',
    part2: '',
    part3: ''
  })
  const [audioUrl, setAudioUrl] = useState('')
  const router = useRouter()

  // Preview mode state
  const [timeRemaining, setTimeRemaining] = useState(45 * 60)
  const [currentPart, setCurrentPart] = useState(1)
  const [previewCurrentPart, setPreviewCurrentPart] = useState(1)
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set())

  const handleSave = async (isDraft = false) => {
    setLoading(true)
    try {
      // Debug logging for audioUrl
      console.log('Saving mock test with data:', {
        title: mockData.title,
        modulesCount: mockData.modules.length,
        modules: mockData.modules.map(m => ({
          type: m.type,
          audioUrl: m.audioUrl,
          hasAudioUrl: !!m.audioUrl,
          audioUrlLength: m.audioUrl?.length || 0
        }))
      })
      
      const response = await fetch('/api/admin/mocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...mockData,
          isDraft
        }),
      })

      if (response.ok) {
        router.push('/admin/mocks')
      } else {
        console.error('Failed to save mock test')
      }
    } catch (error) {
      console.error('Error saving mock test:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionsChange = (moduleType: 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING', questions: Question[]) => {
    setMockData(prev => ({
      ...prev,
      modules: [
        ...prev.modules.filter(m => m.type !== moduleType),
        {
          type: moduleType,
          duration: moduleType === 'LISTENING' ? 40 : moduleType === 'READING' ? 60 : moduleType === 'WRITING' ? 60 : 15,
          instructions: getDefaultInstructions(moduleType),
          questions,
          partContent: moduleType === 'READING' ? partContent : undefined,
        }
      ]
    }))
  }

  const handlePartContentChange = (content: PartContent) => {
    setPartContent(content)
    // Update the current module's part content
    setMockData(prev => ({
      ...prev,
      modules: prev.modules.map(m => 
        m.type === currentModule 
          ? { ...m, partContent: content }
          : m
      )
    }))
  }

  const handlePassageContentChange = (content: { part1: string; part2: string; part3: string }) => {
    setPassageContent(content)
    // Update the current module's passage content
    setMockData(prev => ({
      ...prev,
      modules: prev.modules.map(m => 
        m.type === currentModule 
          ? { ...m, passageContent: content }
          : m
      )
    }))
  }

  const handleAudioUrlChange = (url: string) => {
    console.log('Create page: Audio URL changed:', {
      url,
      urlLength: url?.length || 0,
      hasUrl: !!url,
      currentModule
    })
    setAudioUrl(url)
    // Update the current module's audio URL
    setMockData(prev => ({
      ...prev,
      modules: prev.modules.map(m => 
        m.type === 'LISTENING' 
          ? { ...m, audioUrl: url }
          : m
      )
    }))
  }

  const getDefaultInstructions = (moduleType: string) => {
    switch (moduleType) {
      case 'LISTENING':
        return 'You will hear a number of different recordings and you will have to answer questions on what you hear.'
      case 'READING':
        return 'You should spend about 20 minutes on each passage.'
      case 'WRITING':
        return 'You will be given two writing tasks to complete.'
      case 'SPEAKING':
        return 'You will have a conversation with an examiner about familiar topics.'
      default:
        return ''
    }
  }

  const steps = [
    { id: 1, name: 'Basic Info', description: 'Test title and description' },
    { id: 2, name: 'Listening', description: 'Listening module setup' },
    { id: 3, name: 'Reading', description: 'Reading module setup' },
  ]

  // Preview mode functions
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const toggleBookmark = (questionId: number) => {
    setBookmarkedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const navigateToQuestion = (questionNumber: number) => {
    setCurrentQuestion(questionNumber)
  }

  const navigateToPart = (partNumber: number) => {
    setCurrentPart(partNumber)
  }

  // Timer effect for preview
  useEffect(() => {
    if (!previewMode) return
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [previewMode])

  const getCurrentModule = () => {
    return mockData.modules.find(m => m.type === currentModule)
  }

  const getReadingQuestions = () => {
    const readingModule = mockData.modules.find(m => m.type === 'READING')
    return readingModule?.questions || []
  }

  const getQuestionsForPart = (part: number) => {
    const allQuestions = getReadingQuestions()
    return allQuestions.filter(q => q.part === part)
  }

  const getTotalParts = () => {
    const allQuestions = getReadingQuestions()
    const parts = new Set(allQuestions.map(q => q.part || 1))
    return Math.max(...parts, 1)
  }

  // Render preview mode
  const renderPreviewMode = () => {
    const currentModuleData = getCurrentModule()
    if (!currentModuleData) {
      return (
        <div className="h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Module Found</h2>
            <p className="text-gray-600 mb-4">Please add a {currentModule} module before previewing.</p>
            <button 
              onClick={() => setPreviewMode(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Editor
            </button>
          </div>
        </div>
      )
    }

    // Handle different module types
    if (currentModule === 'LISTENING') {
      return renderListeningPreview(currentModuleData)
    } else if (currentModule === 'READING') {
      return renderReadingPreview(currentModuleData)
    } else if (currentModule === 'WRITING') {
      return renderWritingPreview(currentModuleData)
    }

    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Preview Not Available</h2>
          <p className="text-gray-600 mb-4">Preview mode is not yet implemented for {currentModule} modules.</p>
          <button 
            onClick={() => setPreviewMode(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Editor
          </button>
        </div>
      </div>
    )
  }

  // Render reading preview
  const renderReadingPreview = (readingModule: any) => {
    const currentPartQuestions = getQuestionsForPart(previewCurrentPart)
    const totalParts = getTotalParts()
    
    console.log('Reading preview mode debug:', {
      readingModule,
      currentPartQuestions,
      totalParts,
      previewCurrentPart,
      mockData
    })

    return (
      <FullscreenGuard>
        <div className="h-screen flex flex-col bg-white">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">IELTS</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Rem Candidate - 278228</span>
                  <span className="ml-2">{formatTime(timeRemaining)} remaining</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setPreviewMode(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Exit Preview
              </button>
            </div>
          </header>

          {/* Main Content - Split Pane Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Pane - Reading Text */}
            <div className="w-1/2 border-r border-gray-200 flex flex-col">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-700">
                  <span className="font-bold">Part {previewCurrentPart}</span> Reading Passage
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {/* Passage Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-bold text-blue-900 mb-2">Instructions</h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>• Read the passage below carefully</p>
                    <p>• Answer the questions on the right based on the information in the passage</p>
                    <p>• You can refer back to the passage while answering questions</p>
                    <p>• Choose the best answer for each question</p>
                    {previewCurrentPart === 1 && (
                      <p>• This is Part 1 - typically contains factual information and details</p>
                    )}
                    {previewCurrentPart === 2 && (
                      <p>• This is Part 2 - usually contains descriptive or explanatory text</p>
                    )}
                    {previewCurrentPart === 3 && (
                      <p>• This is Part 3 - often contains more complex, analytical content</p>
                    )}
                  </div>
                </div>

                {/* Reading Passage Content */}
                <div className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-4">Reading Passage - Part {previewCurrentPart}</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      {readingModule.passageContent ? (
                        <div className="space-y-4">
                          {(() => {
                            const partKey = `part${previewCurrentPart}` as keyof typeof readingModule.passageContent
                            const currentPassage = readingModule.passageContent[partKey]
                            
                            if (currentPassage) {
                              return (
                                <div className="text-justify leading-relaxed">
                                  <div 
                                    className="text-sm"
                                    style={{
                                      lineHeight: '1.6',
                                      fontSize: '14px',
                                      fontFamily: 'system-ui, -apple-system, sans-serif'
                                    }}
                                    dangerouslySetInnerHTML={{ 
                                      __html: currentPassage
                                        .replace(/<p>/g, '<p class="mb-4" style="margin-bottom: 1rem;">')
                                        .replace(/<p[^>]*><strong>([A-Z])\.<\/strong>/g, '<p class="mb-4" style="margin-bottom: 1rem;"><strong style="font-weight: bold; color: #111827;">$1.</strong>')
                                        .replace(/<p[^>]*>([^<]*[A-Z]\.)/g, '<p class="mb-4" style="margin-bottom: 1rem;"><strong style="font-weight: bold; color: #111827;">$1</strong>')
                                    }}
                                  />
                                </div>
                              )
                            } else {
                              return (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                  <p className="text-sm text-yellow-800">
                                    No passage content available for Part {previewCurrentPart}
                                  </p>
                                </div>
                              )
                            }
                          })()}
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="text-sm font-bold text-yellow-900 mb-2">No Reading Passage</h4>
                          <p className="text-sm text-yellow-800">
                            Reading passages have not been added to this module yet.
                          </p>
                          <p className="text-sm text-yellow-700 mt-2">
                            To add reading content, please exit preview mode and use the Reading module editor.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Pane - Answer Sheet for Current Part */}
            <div className="w-1/2 flex flex-col">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Part {previewCurrentPart} - Answer Sheet
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Questions 1-{currentPartQuestions.length}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewCurrentPart(Math.max(1, previewCurrentPart - 1))}
                      disabled={previewCurrentPart <= 1}
                      className="px-2 py-1 text-xs bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                      ← Prev
                    </button>
                    <span className="text-xs text-gray-600">
                      {previewCurrentPart} of {totalParts}
                    </span>
                    <button
                      onClick={() => setPreviewCurrentPart(Math.min(totalParts, previewCurrentPart + 1))}
                      disabled={previewCurrentPart >= totalParts}
                      className="px-2 py-1 text-xs bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {currentPartQuestions.length > 0 ? (
                  <div className="space-y-6">
                    {currentPartQuestions.map((question, index) => (
                    <div key={question.id} className="relative">
                      <IELTSQuestionRenderer
                        question={{
                          ...question,
                          id: question.id,
                          type: question.type as any,
                          content: question.content,
                          options: question.options,
                          correctAnswer: question.correctAnswer,
                          points: question.points,
                          part: question.part || 1,
                          fibData: question.fibData,
                          matchingData: question.matchingData,
                          notesCompletionData: question.notesCompletionData,
                          summaryCompletionData: question.summaryCompletionData,
                          trueFalseNotGivenData: question.trueFalseNotGivenData,
                          instructions: question.instructions
                        }}
                        questionNumber={index + 1}
                        onAnswerChange={(questionId, answer) => {
                          console.log('Preview answer change:', { questionId, answer })
                          handleAnswerChange(index + 1, typeof answer === 'string' ? answer : JSON.stringify(answer))
                        }}
                        initialAnswer={answers[index + 1] || ''}
                        disabled={false}
                        showInstructions={false}
                      />
                      <button
                        onClick={() => toggleBookmark(index + 1)}
                        className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
                      >
                        <svg className={`w-4 h-4 ${bookmarkedQuestions.has(index + 1) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-gray-500 text-lg mb-2">No Questions</div>
                      <div className="text-gray-400 text-sm">
                        No questions found for Part {previewCurrentPart}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <footer className="border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm">Part {previewCurrentPart}</span>
                  <span className="text-xs text-gray-500">
                    ({currentPartQuestions.length} questions)
                  </span>
                  {currentPartQuestions.length > 0 && (
                    <div className="flex space-x-1">
                      {Array.from({ length: currentPartQuestions.length }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          onClick={() => setCurrentQuestion(num)}
                          className={`w-8 h-8 text-sm rounded ${
                            num === currentQuestion 
                              ? 'bg-blue-200 text-blue-900 border border-blue-300' 
                              : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-4">
                  {Array.from({ length: totalParts }, (_, i) => i + 1).map((partNum) => {
                    const partQuestions = getQuestionsForPart(partNum)
                    return (
                      <div key={partNum} className="text-sm">
                        <span className={`font-medium ${partNum === previewCurrentPart ? 'text-blue-600' : 'text-gray-600'}`}>
                          Part {partNum}
                        </span> 
                        <span className="text-gray-500">
                          {partQuestions.length} question{partQuestions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-600">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-xs text-gray-400">
                    remaining
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewCurrentPart(Math.max(1, previewCurrentPart - 1))}
                    disabled={previewCurrentPart <= 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous Part"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-xs text-gray-500">
                    {previewCurrentPart} of {totalParts}
                  </span>
                  <button
                    onClick={() => setPreviewCurrentPart(Math.min(totalParts, previewCurrentPart + 1))}
                    disabled={previewCurrentPart >= totalParts}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next Part"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <button 
                  onClick={() => setPreviewMode(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Exit Preview
                </button>
              </div>
            </div>
          </footer>
        </div>
      </FullscreenGuard>
    )
  }

  // Render listening preview
  const renderListeningPreview = (listeningModule: any) => {
    const currentPartQuestions = getQuestionsForPart(previewCurrentPart)
    const totalParts = getTotalParts()
    
    return (
      <FullscreenGuard>
        <div className="h-screen flex flex-col bg-white">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">IELTS</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Rem Candidate - 278228</span>
                  <span className="ml-2">{formatTime(timeRemaining)} remaining</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setPreviewMode(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Exit Preview
              </button>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Pane - Audio Player */}
            <div className="w-1/2 border-r border-gray-200 flex flex-col">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-700">
                  <span className="font-bold">Part {previewCurrentPart}</span> Listening Audio
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-bold text-blue-900 mb-2">Instructions</h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>• Listen to the audio recording carefully</p>
                    <p>• Answer the questions on the right as you listen</p>
                    <p>• You will hear the recording only once</p>
                    <p>• Choose the best answer for each question</p>
                  </div>
                </div>

                {/* Audio Player */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  {listeningModule.audioUrl ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold mb-4">Listening Audio - Part {previewCurrentPart}</h3>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <audio controls className="w-full">
                          <source src={listeningModule.audioUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                        <p className="text-sm text-gray-600 mt-2">
                          Audio file: {listeningModule.audioUrl.split('/').pop()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-yellow-900 mb-2">No Audio File</h4>
                      <p className="text-sm text-yellow-800">
                        No audio file has been uploaded for this listening module.
                      </p>
                      <p className="text-sm text-yellow-700 mt-2">
                        To add audio content, please exit preview mode and use the Listening module editor.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Pane - Answer Sheet */}
            <div className="w-1/2 flex flex-col">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Part {previewCurrentPart} - Answer Sheet
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Questions 1-{currentPartQuestions.length}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewCurrentPart(Math.max(1, previewCurrentPart - 1))}
                      disabled={previewCurrentPart <= 1}
                      className="px-2 py-1 text-xs bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                      ← Prev
                    </button>
                    <span className="text-xs text-gray-600">
                      {previewCurrentPart} of {totalParts}
                    </span>
                    <button
                      onClick={() => setPreviewCurrentPart(Math.min(totalParts, previewCurrentPart + 1))}
                      disabled={previewCurrentPart >= totalParts}
                      className="px-2 py-1 text-xs bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {currentPartQuestions.length > 0 ? (
                  <div className="space-y-6">
                    {currentPartQuestions.map((question, index) => (
                      <div key={question.id} className="relative">
                        <IELTSQuestionRenderer
                          question={{
                            ...question,
                            id: question.id,
                            type: question.type as any,
                            content: question.content,
                            options: question.options,
                            correctAnswer: question.correctAnswer,
                            points: question.points,
                            part: question.part || 1,
                            fibData: question.fibData,
                            matchingData: question.matchingData,
                            notesCompletionData: question.notesCompletionData,
                            summaryCompletionData: question.summaryCompletionData,
                            trueFalseNotGivenData: question.trueFalseNotGivenData,
                            instructions: question.instructions
                          }}
                          questionNumber={index + 1}
                          onAnswerChange={(questionId, answer) => {
                            console.log('Preview answer change:', { questionId, answer })
                            handleAnswerChange(index + 1, typeof answer === 'string' ? answer : JSON.stringify(answer))
                          }}
                          initialAnswer={answers[index + 1] || ''}
                          disabled={false}
                          showInstructions={false}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-gray-500 text-lg mb-2">No Questions</div>
                      <div className="text-gray-400 text-sm">
                        No questions found for Part {previewCurrentPart}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <footer className="border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm">Part {previewCurrentPart}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-sm text-gray-600">
                    {currentPartQuestions.length} questions
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {formatTime(timeRemaining)} remaining
                </div>
                <button
                  onClick={() => setPreviewMode(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Exit Preview
                </button>
              </div>
            </div>
          </footer>
        </div>
      </FullscreenGuard>
    )
  }

  // Render writing preview
  const renderWritingPreview = (writingModule: any) => {
    return (
      <FullscreenGuard>
        <div className="h-screen flex flex-col bg-white">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">IELTS</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Rem Candidate - 278228</span>
                  <span className="ml-2">{formatTime(timeRemaining)} remaining</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setPreviewMode(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Exit Preview
              </button>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Writing Task Instructions</h3>
                <div className="text-sm text-blue-800 space-y-3">
                  <p>• You will be given two writing tasks to complete</p>
                  <p>• Task 1: Write at least 150 words (20 minutes recommended)</p>
                  <p>• Task 2: Write at least 250 words (40 minutes recommended)</p>
                  <p>• Use formal academic language</p>
                  <p>• Organize your ideas clearly with paragraphs</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Task 1 */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">Writing Task 1</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Sample Task 1:</strong> The chart below shows the percentage of households with internet access in different countries from 2000 to 2010. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> This is a preview. Actual writing tasks will be provided when students take the test.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Task 2 */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">Writing Task 2</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Sample Task 2:</strong> Some people believe that technology has made our lives more complicated, while others think it has made life easier. Discuss both views and give your own opinion.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> This is a preview. Actual writing tasks will be provided when students take the test.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Writing Module - Manual Assessment Required
              </div>
              <button
                onClick={() => setPreviewMode(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Exit Preview
              </button>
            </div>
          </footer>
        </div>
      </FullscreenGuard>
    )
  }

  if (previewMode) {
    return renderPreviewMode()
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Mock Test</h1>
            <p className="mt-2 text-gray-600">Build a comprehensive IELTS mock test</p>
          </div>
          <div className="flex space-x-3">
            {/* Debug info */}
            <div className="text-xs text-gray-500">
              Title: {mockData.title ? '✓' : '✗'} | Modules: {mockData.modules.length}
            </div>
            <button
              onClick={() => {
                console.log('Preview button clicked:', {
                  mockData,
                  title: mockData.title,
                  modulesLength: mockData.modules.length,
                  modules: mockData.modules
                })
                setPreviewMode(true)
              }}
              disabled={!mockData.title || mockData.modules.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Test
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li key={step.id} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                {currentStep > step.id ? (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-blue-600" />
                    </div>
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </>
                ) : currentStep === step.id ? (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-gray-200" />
                    </div>
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-gray-200" />
                    </div>
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                      <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                    </div>
                  </>
                )}
                <div className="ml-4 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{step.name}</p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Test Title
                </label>
                <input
                  type="text"
                  id="title"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={mockData.title}
                  onChange={(e) => setMockData({ ...mockData, title: e.target.value })}
                  placeholder="e.g., IELTS Academic Mock Test 1"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={mockData.description}
                  onChange={(e) => setMockData({ ...mockData, description: e.target.value })}
                  placeholder="Brief description of this mock test..."
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Listening Module - IELTS Format</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentModule('LISTENING')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      currentModule === 'LISTENING' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    IELTS Listening Questions
                  </button>
                </div>
              </div>
              
              <IELTSListeningBuilder
                moduleType="LISTENING"
                onQuestionsChange={(questions) => handleQuestionsChange('LISTENING', questions as any)}
                onAudioFileChange={handleAudioUrlChange}
                initialQuestions={mockData.modules.find(m => m.type === 'LISTENING')?.questions || []}
                initialAudioUrl={mockData.modules.find(m => m.type === 'LISTENING')?.audioUrl || ''}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Reading Module - IELTS Format</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentModule('READING')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      currentModule === 'READING' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    IELTS Reading Questions
                  </button>
                </div>
              </div>
              
              <IELTSQuestionBuilder
                moduleType="READING"
                onQuestionsChange={(questions) => handleQuestionsChange('READING', questions as any)}
                onPartContentChange={handlePartContentChange}
                onPassageContentChange={handlePassageContentChange}
                initialQuestions={mockData.modules.find(m => m.type === 'READING')?.questions || []}
                initialPartContent={mockData.modules.find(m => m.type === 'READING')?.partContent || { part1: '', part2: '', part3: '' }}
                initialPassageContent={mockData.modules.find(m => m.type === 'READING')?.passageContent || { part1: '', part2: '', part3: '' }}
              />
            </div>
          )}


          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Save Draft
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? 'Publishing...' : 'Publish Test'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
