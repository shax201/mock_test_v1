'use client'

import { useState, useEffect } from 'react'
import ModuleTypeSelector from './ModuleTypeSelector'
import { ModuleType } from '@prisma/client'

interface Module {
  type: ModuleType
  duration: number
  instructions: string
  questions: any[]
  audioUrl?: string
  passageContent?: any
  readingData?: any
  listeningData?: any
}

interface EnhancedMockTestCreatorProps {
  onMockTestChange: (mockTest: any) => void
  initialMockTest?: any
}

export default function EnhancedMockTestCreator({ 
  onMockTestChange, 
  initialMockTest 
}: EnhancedMockTestCreatorProps) {
  const [title, setTitle] = useState(initialMockTest?.title || '')
  const [description, setDescription] = useState(initialMockTest?.description || '')
  const [modules, setModules] = useState<Module[]>(initialMockTest?.modules || [])
  const [isDraft, setIsDraft] = useState(false)
  const [saving, setSaving] = useState(false)

  // Update mock test when modules change
  useEffect(() => {
    const mockTest = {
      title,
      description,
      modules,
      isDraft
    }
    onMockTestChange(mockTest)
  }, [title, description, modules, isDraft, onMockTestChange])

  const addModule = (type: ModuleType) => {
    const newModule: Module = {
      type,
      duration: 60,
      instructions: '',
      questions: [],
      ...(type === 'LISTENING' && { audioUrl: '' }),
      ...(type === 'READING' && { passageContent: { part1: '', part2: '', part3: '' } })
    }
    setModules([...modules, newModule])
  }

  const removeModule = (index: number) => {
    const newModules = modules.filter((_, i) => i !== index)
    setModules(newModules)
  }

  const updateModule = (index: number, updates: Partial<Module>) => {
    const newModules = [...modules]
    newModules[index] = { ...newModules[index], ...updates }
    setModules(newModules)
  }

  const handleQuestionsChange = (moduleIndex: number, questions: any[]) => {
    updateModule(moduleIndex, { questions })
  }

  const handlePartContentChange = (moduleIndex: number, content: any) => {
    updateModule(moduleIndex, { passageContent: content })
  }

  const handlePassageContentChange = (moduleIndex: number, content: any) => {
    updateModule(moduleIndex, { passageContent: content })
  }

  const handleAudioFileChange = (moduleIndex: number, audioUrl: string, publicId?: string) => {
    updateModule(moduleIndex, { audioUrl })
  }

  const handleReadingDataChange = (moduleIndex: number, data: any) => {
    updateModule(moduleIndex, { readingData: data })
  }

  const handleListeningDataChange = (moduleIndex: number, data: any) => {
    updateModule(moduleIndex, { listeningData: data })
  }

  const saveMockTest = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/mocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          modules,
          isDraft,
          moduleData: modules.map((module, index) => ({
            readingData: module.readingData,
            listeningData: module.listeningData
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save mock test')
      }

      const result = await response.json()
      console.log('Mock test saved successfully:', result)
    } catch (error) {
      console.error('Error saving mock test:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Enhanced Mock Test Creator</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter test title..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter test description..."
            />
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Save as draft</span>
          </label>
        </div>
      </div>

      {/* Module Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Modules</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => addModule('READING')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Reading
            </button>
            <button
              onClick={() => addModule('LISTENING')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Listening
            </button>
            <button
              onClick={() => addModule('WRITING')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Writing
            </button>
            <button
              onClick={() => addModule('SPEAKING')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Speaking
            </button>
          </div>
        </div>

        {modules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No modules</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first module.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {modules.map((module, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      module.type === 'READING' ? 'bg-blue-100 text-blue-800' :
                      module.type === 'LISTENING' ? 'bg-green-100 text-green-800' :
                      module.type === 'WRITING' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {module.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {module.questions.length} questions
                    </span>
                  </div>
                  <button
                    onClick={() => removeModule(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove Module
                  </button>
                </div>

                <ModuleTypeSelector
                  moduleType={module.type}
                  onQuestionsChange={(questions) => handleQuestionsChange(index, questions)}
                  onPartContentChange={(content) => handlePartContentChange(index, content)}
                  onPassageContentChange={(content) => handlePassageContentChange(index, content)}
                  onAudioFileChange={(audioUrl, publicId) => handleAudioFileChange(index, audioUrl, publicId)}
                  onReadingDataChange={(data) => handleReadingDataChange(index, data)}
                  onListeningDataChange={(data) => handleListeningDataChange(index, data)}
                  initialQuestions={module.questions}
                  initialPartContent={module.passageContent}
                  initialPassageContent={module.passageContent}
                  initialAudioUrl={module.audioUrl}
                  initialReadingData={module.readingData}
                  initialListeningData={module.listeningData}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveMockTest}
          disabled={saving || !title.trim() || modules.length === 0}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Mock Test
            </>
          )}
        </button>
      </div>
    </div>
  )
}
