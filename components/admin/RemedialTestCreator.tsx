'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getMockTests } from '@/lib/actions/mock-tests'
import BasicInfoForm from './remedial/BasicInfoForm'
import PassageEditor from './remedial/PassageEditor'
import HeadingsEditor from './remedial/HeadingsEditor'
import QuestionsListEditor from './remedial/QuestionsListEditor'
import OptionsEditor from './remedial/OptionsEditor'
import CorrectAnswerInput from './remedial/CorrectAnswerInput'
import ReviewSummary from './remedial/ReviewSummary'
import QuestionAudioListEditor from './remedial/QuestionAudioListEditor'
import MatchingHeadingsEditor from './remedial/MatchingHeadingsEditor'
import { PassageSection, QuestionData, RemedialTestData, MockTest } from './remedial/types'
import QuestionCreationModal from './QuestionCreationModal'

// Types moved to components/admin/remedial/types

export default function RemedialTestCreator() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [mockTests, setMockTests] = useState<MockTest[]>([])
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [testData, setTestData] = useState<RemedialTestData>({
    title: '',
    description: '',
    type: 'MULTIPLE_CHOICE',
    module: 'LISTENING',
    difficulty: 'INTERMEDIATE',
    duration: 20,
    audioUrl: '',
    audioPublicId: '',
    mockTestId: '',
    questions: []
  })

  const [currentQuestion, setCurrentQuestion] = useState<QuestionData>({
    id: 'q1',
    passage: {
      title: '',
      sections: []
    },
    headings: [],
    questions: [],
    options: [],
    questionAudios: [],
    correctAnswers: {},
    correctAnswer: '',
    instructions: ''
  })

  useEffect(() => {
    fetchMockTests()
  }, [])

  const fetchMockTests = async () => {
    try {
      console.log('Fetching mock tests...')
      const result = await getMockTests()
      console.log('Mock tests result:', result)
      
      if (result.success) {
        setMockTests(result.mockTests || [])
      } else {
        console.error('Failed to fetch mock tests:', result.error)
      }
    } catch (error) {
      console.error('Error fetching mock tests:', error)
    }
  }

  // Option lists moved inside child components where needed

  const handleBasicInfoChange = (field: string, value: string | number) => {
    setTestData(prev => {
      // If changing from LISTENING to another module, delete the audio file
      if (field === 'module' && prev.module === 'LISTENING' && value !== 'LISTENING' && prev.audioPublicId) {
        deleteAudioFile(prev.audioPublicId)
        return {
          ...prev,
          [field]: String(value),
          audioUrl: '',
          audioPublicId: ''
        }
      }
      return {
        ...prev,
        [field]: field === 'duration' ? Number(value) : String(value)
      }
    })
  }

  const handleAudioChange = (file: File | null, url?: string, publicId?: string) => {
    setTestData(prev => ({
      ...prev,
      audioUrl: url || '',
      audioPublicId: publicId || ''
    }))
  }

  const deleteAudioFile = async (publicId: string) => {
    try {
      const response = await fetch('/api/admin/delete-audio', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id: publicId }),
      })

      if (!response.ok) {
        console.error('Failed to delete audio file')
      }
    } catch (error) {
      console.error('Error deleting audio file:', error)
    }
  }

  const handleQuestionChange = (field: string, value: any) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addPassageSection = (hasHeading: boolean = false) => {
    const newSection: PassageSection = {
      id: `section-${currentQuestion.passage?.sections.length || 0 + 1}`,
      number: (currentQuestion.passage?.sections.length || 0) + 1,
      content: '',
      hasHeading,
      heading: hasHeading ? '' : undefined
    }
    
    setCurrentQuestion(prev => ({
      ...prev,
      passage: {
        ...prev.passage!,
        sections: [...(prev.passage?.sections || []), newSection]
      }
    }))
  }

  const updatePassageSection = (sectionId: string, field: string, value: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      passage: {
        ...prev.passage!,
        sections: prev.passage?.sections.map(section => 
          section.id === sectionId ? { ...section, [field]: value } : section
        ) || []
      }
    }))
  }

  const removePassageSection = (sectionId: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      passage: {
        ...prev.passage!,
        sections: prev.passage?.sections.filter(section => section.id !== sectionId) || []
      }
    }))
  }

  const addHeading = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      headings: [...(prev.headings || []), '']
    }))
  }

  const updateHeading = (index: number, value: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      headings: prev.headings?.map((heading, i) => i === index ? value : heading) || []
    }))
  }

  const removeHeading = (index: number) => {
    setCurrentQuestion(prev => ({
      ...prev,
      headings: prev.headings?.filter((_, i) => i !== index) || []
    }))
  }

  const addQuestion = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      questions: [...(prev.questions || []), ''],
      questionAudios: [...(prev.questionAudios || []), { url: '' }]
    }))
  }

  const handleModalSave = (modalData: any) => {
    const contentFromModal: string = (modalData?.content || '').trim()
    const content: string = contentFromModal || (modalData?.questionAudio ? 'Audio Question' : '')
    const audioFromModal = modalData?.questionAudio
    const newAudioItem = audioFromModal ? { url: audioFromModal.url, publicId: audioFromModal.publicId } : { url: '' }

    // Persist: append new or replace existing item when editing
    setTestData(prev => {
      const updated = [...prev.questions]
      if (editingIndex !== null && editingIndex >= 0 && editingIndex < updated.length) {
        const prevQ = updated[editingIndex]
        const replaced: QuestionData = {
          ...prevQ,
          questions: [content],
          questionAudios: [newAudioItem],
          options: (testData.type === 'MULTIPLE_CHOICE' && Array.isArray(modalData?.options) && modalData.options.length > 0)
            ? modalData.options
            : (prevQ.options || []),
          correctAnswers: {
            ...(prevQ.correctAnswers || {}),
            ['0']: modalData?.correctAnswer ? String(modalData.correctAnswer) : (prevQ.correctAnswers ? prevQ.correctAnswers['0'] : '')
          }
        }
        updated[editingIndex] = replaced
      } else {
        const created: QuestionData = {
          id: `q${prev.questions.length + 1}`,
          passage: { title: '', sections: [] },
          headings: [],
          questions: [content],
          options: (testData.type === 'MULTIPLE_CHOICE' && Array.isArray(modalData?.options)) ? modalData.options : [],
          questionAudios: [newAudioItem],
          correctAnswers: modalData?.correctAnswer ? { '0': String(modalData.correctAnswer) } : {},
          correctAnswer: '',
          instructions: ''
        }
        updated.push(created)
      }
      return { ...prev, questions: updated }
    })

    // Reset the working question state
    setCurrentQuestion({
      id: `q${testData.questions.length + 2}`,
      passage: {
        title: '',
        sections: []
      },
      headings: [],
      questions: [],
      options: [],
      questionAudios: [],
      correctAnswers: {},
      correctAnswer: '',
      instructions: ''
    })
    setEditingIndex(null)
  }

  const updateQuestion = (index: number, value: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      questions: prev.questions?.map((question, i) => i === index ? value : question) || []
    }))
  }

  const removeQuestion = (index: number) => {
    setCurrentQuestion(prev => ({
      ...prev,
      questions: prev.questions?.filter((_, i) => i !== index) || [],
      questionAudios: prev.questionAudios?.filter((_, i) => i !== index) || []
    }))
  }

  const addQuestionToTest = () => {
    setTestData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion }]
    }))
    
    // Reset current question
    setCurrentQuestion({
      id: `q${testData.questions.length + 2}`,
      passage: {
        title: '',
        sections: []
      },
      headings: [],
      questions: [],
      options: [],
      questionAudios: [],
      correctAnswers: {},
      correctAnswer: '',
      instructions: ''
    })
  }

  const handleSubmit = async () => {
    // Validate form data
    if (!testData.title || !testData.type || !testData.module) {
      alert('Please fill in all required fields')
      return
    }

    if (testData.module === 'LISTENING' && !testData.audioUrl) {
      alert('Audio file is required for LISTENING module')
      return
    }

    if (testData.questions.length === 0) {
      alert('Please add at least one question to the test')
      return
    }

    setLoading(true)
    try {
      console.log('Submitting test data:', testData)
      
      const response = await fetch('/api/admin/remedial-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Test created successfully:', result)
        router.push('/admin/remedial-tests')
      } else {
        const errorData = await response.json()
        console.error('Failed to create remedial test:', errorData)
        alert(`Failed to create remedial test: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating remedial test:', error)
      alert('Error creating remedial test. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <BasicInfoForm
      testData={testData}
      mockTests={mockTests}
      onChange={handleBasicInfoChange}
      onAudioChange={handleAudioChange}
    />
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Question Content</h3>
        
        {/* Question Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Type
          </label>
          <select
            value={testData.type}
            onChange={(e) => handleBasicInfoChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="TRUE_FALSE">True/False</option>
            <option value="MATCHING_HEADINGS">Matching Headings</option>
          </select>
        </div>

        {/* Matching Headings Editor */}
        {testData.type === 'MATCHING_HEADINGS' ? (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Matching Headings Question</h4>
              <p className="text-sm text-blue-800">
                Create a passage with sections and provide headings for students to match. 
                Some sections should have heading gaps where students will drag the correct heading.
              </p>
            </div>
            
            <MatchingHeadingsEditor
              question={currentQuestion}
              onQuestionChange={handleQuestionChange}
            />
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addQuestionToTest}
                disabled={!currentQuestion.passage?.title || !currentQuestion.headings?.length || !currentQuestion.passage?.sections?.length}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Matching Headings Question
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Create questions using the modal.</div>
              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(true)}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Create via Modal
              </button>
            </div>
                      
            {/* Show created questions */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Created Questions</h4>
                <span className="text-xs text-gray-500">{testData.questions.length} added</span>
              </div>
              {testData.questions.length === 0 ? (
                <div className="text-sm text-gray-500">No questions added yet. Use the modal to add one.</div>
              ) : (
                <div className="space-y-3">
                  {testData.questions.map((q, qi) => (
                    <div key={`q-${qi}`} className="border border-gray-200 rounded-md p-3">
                      {(q.questions || []).map((text, idx) => (
                        <div key={`q-${qi}-i-${idx}`} className="flex items-center justify-between">
                          <div className="text-sm text-gray-800">{qi + 1}. {text || 'Audio Question'}</div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                              {testData.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : testData.type === 'TRUE_FALSE' ? 'True/False' : testData.type}
                            </span>
                            {q.questionAudios && q.questionAudios[idx] && q.questionAudios[idx].url ? (
                              <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">Audio attached</span>
                            ) : null}
                            <button
                              type="button"
                              className="text-xs text-blue-600 hover:text-blue-800"
                              onClick={() => { setEditingIndex(qi); setIsQuestionModalOpen(true) }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-xs text-red-600 hover:text-red-800"
                              onClick={() => setTestData(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qi) }))}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => (<ReviewSummary testData={testData} mockTests={mockTests} />)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Remedial Test</h1>
        <p className="mt-2 text-gray-600">
          Create personalized remedial tests to help students improve their weak areas.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep >= step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              <div className="ml-2 text-sm font-medium text-gray-700">
                {step === 1 && 'Basic Info'}
                {step === 2 && 'Question Content'}
                {step === 3 && 'Review & Create'}
              </div>
              {step < 3 && (
                <div className="w-8 h-0.5 bg-gray-200 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-4">
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !testData.title || !testData.type || !testData.module || testData.questions.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Test'}
              </button>
            )}
          </div>
        </div>
      </div>
    <QuestionCreationModal
      isOpen={isQuestionModalOpen}
      onClose={() => { setIsQuestionModalOpen(false); setEditingIndex(null) }}
      onSave={(qd) => { handleModalSave(qd); setIsQuestionModalOpen(false) }}
      part={1}
      allowedTypes={[ 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'MATCHING_HEADINGS' ]}
      enableAudioContent={true}
      initial={editingIndex !== null ? {
        type: testData.type,
        content: (testData.questions[editingIndex]?.questions || [''])[0] || '',
        audioUrl: (testData.questions[editingIndex]?.questionAudios || [{ url: '' }])[0]?.url || '',
        audioPublicId: (testData.questions[editingIndex]?.questionAudios || [{ publicId: '' }])[0]?.publicId || '',
        correctAnswer: testData.questions[editingIndex]?.correctAnswers ? testData.questions[editingIndex]?.correctAnswers['0'] : ''
      } : undefined}
    />
    </div>
  )
}
