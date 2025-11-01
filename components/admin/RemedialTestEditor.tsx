'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getMockTests } from '@/lib/actions/mock-tests'
import BasicInfoForm from './remedial/BasicInfoForm'
import ReviewSummary from './remedial/ReviewSummary'
import QuestionCreationModal from './QuestionCreationModal'
import { PassageSection, QuestionData, RemedialTestData, MockTest } from './remedial/types'

// Types moved to components/admin/remedial/types

export default function RemedialTestEditor() {
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
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

  // Removed currentQuestion state - using modal approach

  useEffect(() => {
    fetchMockTests()
    if (testId) {
      fetchRemedialTest()
    }
  }, [testId])

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

  const fetchRemedialTest = async () => {
    try {
      setInitialLoading(true)
      const response = await fetch(`/api/admin/remedial-tests/${testId}`)
      
      if (response.ok) {
        const data = await response.json()
        const test = data.remedialTest
        
        setTestData({
          title: test.title || '',
          description: test.description || '',
          type: test.type || 'MULTIPLE_CHOICE',
          module: test.module || 'LISTENING',
          difficulty: test.difficulty || 'INTERMEDIATE',
          duration: test.duration || 20,
          audioUrl: test.audioUrl || '',
          audioPublicId: test.audioPublicId || '',
          mockTestId: test.mockTestId || '',
          questions: test.questions || []
        })
      } else {
        console.error('Failed to fetch remedial test')
        alert('Failed to load remedial test data')
        router.push('/admin/remedial-tests')
      }
    } catch (error) {
      console.error('Error fetching remedial test:', error)
      alert('Error loading remedial test data')
      router.push('/admin/remedial-tests')
    } finally {
      setInitialLoading(false)
    }
  }

  // Option lists moved to BasicInfoForm component

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
    setEditingIndex(null)
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
      console.log('Updating test data:', testData)
      
      const response = await fetch(`/api/admin/remedial-tests/${testId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Test updated successfully:', result)
        router.push('/admin/remedial-tests')
      } else {
        const errorData = await response.json()
        console.error('Failed to update remedial test:', errorData)
        alert(`Failed to update remedial test: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating remedial test:', error)
      alert('Error updating remedial test. Please try again.')
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
                          onClick={() => { 
                            console.log('Editing question:', q);
                            console.log('Question audios:', q.questionAudios);
                            setEditingIndex(qi); 
                            setIsQuestionModalOpen(true) 
                          }}
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
    </div>
  )

  const renderStep3 = () => (<ReviewSummary testData={testData} mockTests={mockTests} />)

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Remedial Test</h1>
        <p className="mt-2 text-gray-600">
          Update the remedial test details and questions.
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
                {step === 3 && 'Review & Update'}
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
                {loading ? 'Updating...' : 'Update Test'}
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
      allowedTypes={[ 'MULTIPLE_CHOICE', 'TRUE_FALSE' ]}
      enableAudioContent={true}
      initial={editingIndex !== null ? {
        type: testData.type,
        content: (testData.questions[editingIndex]?.questions || [''])[0] || '',
        audioUrl: testData.questions[editingIndex]?.questionAudios?.[0]?.url || '',
        audioPublicId: testData.questions[editingIndex]?.questionAudios?.[0]?.publicId || '',
        correctAnswer: testData.questions[editingIndex]?.correctAnswers?.['0'] || ''
      } : undefined}
    />
    </div>
  )
}