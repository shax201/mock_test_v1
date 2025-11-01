'use client'

import AudioFileUpload from '../AudioFileUpload'
import { MockTest, RemedialTestData } from './types'

interface BasicInfoFormProps {
  testData: RemedialTestData
  mockTests: MockTest[]
  onChange: (field: string, value: string | number) => void
  onAudioChange: (file: File | null, url?: string, publicId?: string) => void
}

export default function BasicInfoForm({ testData, mockTests, onChange, onAudioChange }: BasicInfoFormProps) {
  const questionTypes = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice', description: 'Students choose from multiple answer options' },
    { value: 'TRUE_FALSE', label: 'True/False', description: 'Students determine if statements are true or false' }
  ]

  const modules = [
    { value: 'READING', label: 'Reading' },
    { value: 'LISTENING', label: 'Listening' },
    { value: 'WRITING', label: 'Writing' },
    { value: 'SPEAKING', label: 'Speaking' }
  ]

  const difficulties = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Title *
            </label>
            <input
              type="text"
              value={testData.title}
              onChange={(e) => onChange('title', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter test title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module *
            </label>
            <select
              value={testData.module}
              onChange={(e) => onChange('module', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {modules.map(module => (
                <option key={module.value} value={module.value}>
                  {module.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Type *
            </label>
            <select
              value={testData.type}
              onChange={(e) => onChange('type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {questionTypes.find(t => t.value === testData.type)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty *
            </label>
            <select
              value={testData.difficulty}
              onChange={(e) => onChange('difficulty', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes) *
            </label>
            <input
              type="number"
              value={testData.duration}
              onChange={(e) => onChange('duration', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              min="5"
              max="120"
            />
          </div>

          {testData.module === 'LISTENING' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audio File *
              </label>
              <AudioFileUpload
                onFileChange={onAudioChange}
                initialUrl={testData.audioUrl || ''}
                initialPublicId={testData.audioPublicId || ''}
                accept="audio/*"
                maxSize={25}
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload an audio file or provide a URL for this listening test.
              </p>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link to Mock Test (Optional)
            </label>
            <select
              value={testData.mockTestId || ''}
              onChange={(e) => onChange('mockTestId', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a mock test (optional)</option>
              {mockTests.length > 0 ? (
                mockTests.map((mockTest) => (
                  <option key={mockTest.id} value={mockTest.id}>
                    {mockTest.title} - {mockTest.modules.map(m => m.type).join(', ')}
                  </option>
                ))
              ) : (
                <option value="" disabled>No mock tests available</option>
              )}
            </select>
              <p className="text-sm text-gray-500 mt-1">
                {mockTests.length > 0 
                  ? `Found ${mockTests.length} mock test(s) available for linking. Link this remedial test to a specific mock test for better tracking and analytics.`
                  : 'No mock tests found. Create some mock tests first, or leave this field empty to create a standalone remedial test.'
                }
              </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={testData.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter test description"
          />
        </div>
      </div>
    </div>
  )
}


