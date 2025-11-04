'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReadingQuestionModal from '@/components/admin/ReadingQuestionModal'
import SectionContentModal from '@/components/admin/SectionContentModal'

interface Passage {
  id: string
  title: string
  contents: Array<{
    contentId: string
    text: string
  }>
  questions: Array<{
    questionNumber: number
    type: 'MATCHING_HEADINGS' | 'TRUE_FALSE_NOT_GIVEN' | 'SUMMARY_COMPLETION' | 'MULTIPLE_CHOICE'
    questionText: string
    options?: string[]
    headingsList?: string[]
    summaryText?: string
    subQuestions?: string[]
    correctAnswer: string
  }>
}

interface ReadingTestData {
  title: string
  totalQuestions: number
  totalTimeMinutes: number
  passages: Passage[]
  bandScoreRanges: Array<{
    minScore: number
    band: number
  }>
}

export default function CreateReadingTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ReadingTestData>({
    title: '',
    totalQuestions: 40,
    totalTimeMinutes: 60,
    passages: [],
    bandScoreRanges: [
      { minScore: 39, band: 9.0 },
      { minScore: 37, band: 8.5 },
      { minScore: 35, band: 8.0 },
      { minScore: 33, band: 7.5 },
      { minScore: 30, band: 7.0 },
      { minScore: 27, band: 6.5 },
      { minScore: 23, band: 6.0 },
      { minScore: 19, band: 5.5 },
      { minScore: 15, band: 5.0 },
      { minScore: 13, band: 4.5 },
      { minScore: 10, band: 4.0 },
      { minScore: 7, band: 3.5 },
      { minScore: 4, band: 3.0 },
      { minScore: 3, band: 2.5 },
      { minScore: 1, band: 2.0 },
      { minScore: 0, band: 0.0 }
    ]
  })

  // Modal states
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
  const [currentPassageIndex, setCurrentPassageIndex] = useState<number | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null)
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Transform passages for API
      const transformedPassages = formData.passages.map((passage, index) => ({
        title: passage.title,
        order: index + 1,
        contents: {
          create: passage.contents.map((content, contentIndex) => ({
            contentId: content.contentId,
            text: content.text,
            order: contentIndex + 1
          }))
        },
        questions: {
          create: passage.questions.map(question => ({
            questionNumber: question.questionNumber,
            type: question.type,
            questionText: question.questionText,
            options: question.options,
            headingsList: question.headingsList,
            summaryText: question.summaryText,
            subQuestions: question.subQuestions,
            points: 1,
            correctAnswer: {
              create: {
                answer: question.correctAnswer
              }
            }
          }))
        }
      }))

      const payload = {
        title: formData.title,
        totalQuestions: formData.totalQuestions,
        totalTimeMinutes: formData.totalTimeMinutes,
        passages: transformedPassages,
        bandScoreRanges: formData.bandScoreRanges
      }

      const response = await fetch('/api/admin/reading-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        router.push('/admin/reading-tests')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to create reading test')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addPassage = () => {
    const newPassage: Passage = {
      id: `passage-${Date.now()}`,
      title: '',
      contents: [],
      questions: []
    }
    setFormData({
      ...formData,
      passages: [...formData.passages, newPassage]
    })
  }

  const updatePassage = (passageIndex: number, updates: Partial<Passage>) => {
    const updatedPassages = [...formData.passages]
    updatedPassages[passageIndex] = { ...updatedPassages[passageIndex], ...updates }
    setFormData({ ...formData, passages: updatedPassages })
  }

  const removePassage = (passageIndex: number) => {
    const updatedPassages = formData.passages.filter((_, index) => index !== passageIndex)
    setFormData({ ...formData, passages: updatedPassages })
  }

  const openSectionModal = (passageIndex: number, sectionIndex?: number) => {
    setCurrentPassageIndex(passageIndex)
    setCurrentSectionIndex(sectionIndex ?? null)
    setIsSectionModalOpen(true)
  }

  const handleSectionSave = (content: string, contentId: string) => {
    if (currentPassageIndex === null) return

    const updatedPassages = [...formData.passages]
    const passage = updatedPassages[currentPassageIndex]

    if (currentSectionIndex !== null) {
      // Editing existing section
      passage.contents[currentSectionIndex] = {
        contentId,
        text: content
      }
    } else {
      // Adding new section
      passage.contents.push({
        contentId,
        text: content
      })
    }

    setFormData({ ...formData, passages: updatedPassages })
    setIsSectionModalOpen(false)
    setCurrentPassageIndex(null)
    setCurrentSectionIndex(null)
  }

  const removePassageContent = (passageIndex: number, contentIndex: number) => {
    const updatedPassages = [...formData.passages]
    updatedPassages[passageIndex].contents.splice(contentIndex, 1)
    setFormData({ ...formData, passages: updatedPassages })
  }

  const openQuestionModal = (passageIndex: number, questionIndex?: number) => {
    setCurrentPassageIndex(passageIndex)
    setCurrentQuestionIndex(questionIndex ?? null)
    setIsQuestionModalOpen(true)
  }

  const handleQuestionSave = (questionData: any) => {
    if (currentPassageIndex === null) return

    const updatedPassages = [...formData.passages]
    const passage = updatedPassages[currentPassageIndex]

    if (currentQuestionIndex !== null) {
      // Editing existing question
      const existingQuestion = passage.questions[currentQuestionIndex]
      passage.questions[currentQuestionIndex] = {
        ...existingQuestion,
        ...questionData,
        questionNumber: existingQuestion.questionNumber // Preserve question number
      }
    } else {
      // Adding new question
      const questionNumber = passage.questions.length + 1
      passage.questions.push({
        questionNumber,
        type: questionData.type || 'MULTIPLE_CHOICE',
        questionText: questionData.questionText || '',
        options: questionData.options,
        headingsList: questionData.headingsList,
        summaryText: questionData.summaryText,
        subQuestions: questionData.subQuestions,
        correctAnswer: questionData.correctAnswer || ''
      })
    }

    setFormData({ ...formData, passages: updatedPassages })
    setIsQuestionModalOpen(false)
    setCurrentPassageIndex(null)
    setCurrentQuestionIndex(null)
  }

  const removeQuestion = (passageIndex: number, questionIndex: number) => {
    const updatedPassages = [...formData.passages]
    updatedPassages[passageIndex].questions.splice(questionIndex, 1)
    setFormData({ ...formData, passages: updatedPassages })
  }

  const loadFromJson = async () => {
    if (!confirm('Are you sure you want to load data from the JSON file? This will create a new reading test.')) {
      return
    }

    setLoading(true)
    try {
      console.log('🔄 Starting JSON load...')
      // Fetch the JSON data from the API
      const response = await fetch('/api/admin/reading-tests/load-from-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()
      console.log('📡 Response body:', responseText)

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${responseText}`)
      }

      const result = JSON.parse(responseText)
      console.log('✅ JSON data loaded successfully:', result)

      alert('JSON data loaded successfully! Reading test created.')

      // Redirect to the reading tests list to see the created test
      router.push('/admin/reading-tests')
    } catch (error) {
      console.error('❌ Error loading JSON:', error)
      alert(`Failed to load JSON data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Create Reading Test
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Create a new IELTS reading test with passages and questions.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <div className="flex space-x-3">
            <Link
              href="/admin/reading-tests"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Reading Tests
            </Link>
            <button
              onClick={loadFromJson}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {loading ? 'Loading...' : 'Load from JSON'}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Test Title
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., IELTS Reading Practice Test 1"
                />
              </div>
              <div>
                <label htmlFor="totalQuestions" className="block text-sm font-medium text-gray-700">
                  Total Questions
                </label>
                <input
                  type="number"
                  id="totalQuestions"
                  required
                  value={formData.totalQuestions}
                  onChange={(e) => setFormData({ ...formData, totalQuestions: parseInt(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="totalTimeMinutes" className="block text-sm font-medium text-gray-700">
                  Time (minutes)
                </label>
                <input
                  type="number"
                  id="totalTimeMinutes"
                  required
                  value={formData.totalTimeMinutes}
                  onChange={(e) => setFormData({ ...formData, totalTimeMinutes: parseInt(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Passages */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Passages</h3>
            <button
              type="button"
              onClick={addPassage}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Passage
            </button>
          </div>

          {formData.passages.map((passage, passageIndex) => (
            <div key={passage.id} className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Passage {passageIndex + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removePassage(passageIndex)}
                    className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm font-medium rounded text-red-700 bg-white hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passage Title
                  </label>
                  <input
                    type="text"
                    required
                    value={passage.title}
                    onChange={(e) => updatePassage(passageIndex, { title: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., The History of Coffee"
                  />
                </div>

                {/* Passage Content */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-medium text-gray-900">Content Sections</h5>
                    <button
                      type="button"
                      onClick={() => openSectionModal(passageIndex)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Section
                    </button>
                  </div>

                  {passage.contents.map((content, contentIndex) => (
                    <div key={contentIndex} className="mb-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Section {content.contentId}
                        </label>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => openSectionModal(passageIndex, contentIndex)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removePassageContent(passageIndex, contentIndex)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                        {content.text ? (
                          <p className="whitespace-pre-wrap">{content.text.substring(0, 200)}{content.text.length > 200 ? '...' : ''}</p>
                        ) : (
                          <p className="text-gray-400 italic">No content added yet</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Questions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-medium text-gray-900">Questions</h5>
                    <button
                      type="button"
                      onClick={() => openQuestionModal(passageIndex)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Question
                    </button>
                  </div>

                  {passage.questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="mb-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h6 className="text-sm font-medium text-gray-900">Question {question.questionNumber}</h6>
                          <p className="text-xs text-gray-500 mt-1">
                            Type: {question.type.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => openQuestionModal(passageIndex, questionIndex)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQuestion(passageIndex, questionIndex)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                        <p className="font-medium mb-2">{question.questionText || 'No question text'}</p>
                        <p className="text-xs text-gray-500">
                          Correct Answer: <span className="font-semibold">{question.correctAnswer}</span>
                        </p>
                        {question.type === 'MULTIPLE_CHOICE' && question.options && (
                          <div className="mt-2 text-xs text-gray-600">
                            Options: {question.options.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {formData.passages.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No passages</h3>
              <p className="mt-1 text-sm text-gray-500">Add your first passage to get started.</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create Reading Test'
            )}
          </button>
        </div>
      </form>

      {/* Question Modal */}
      <ReadingQuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => {
          setIsQuestionModalOpen(false)
          setCurrentPassageIndex(null)
          setCurrentQuestionIndex(null)
        }}
        onSave={handleQuestionSave}
        initialQuestion={
          currentPassageIndex !== null && currentQuestionIndex !== null
            ? formData.passages[currentPassageIndex]?.questions[currentQuestionIndex]
            : undefined
        }
      />

      {/* Section Modal */}
      <SectionContentModal
        isOpen={isSectionModalOpen}
        onClose={() => {
          setIsSectionModalOpen(false)
          setCurrentPassageIndex(null)
          setCurrentSectionIndex(null)
        }}
        onSave={handleSectionSave}
        initialContent={
          currentPassageIndex !== null && currentSectionIndex !== null
            ? formData.passages[currentPassageIndex]?.contents[currentSectionIndex]?.text
            : undefined
        }
        initialContentId={
          currentPassageIndex !== null && currentSectionIndex !== null
            ? formData.passages[currentPassageIndex]?.contents[currentSectionIndex]?.contentId
            : undefined
        }
        sectionLabel="Passage Section"
      />
    </div>
  )
}
