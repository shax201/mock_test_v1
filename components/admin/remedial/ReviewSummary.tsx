'use client'

import { MockTest, RemedialTestData } from './types'

interface ReviewSummaryProps {
  testData: RemedialTestData
  mockTests: MockTest[]
}

export default function ReviewSummary({ testData, mockTests }: ReviewSummaryProps) {
  const questionTypes = [
    { value: 'MATCHING_HEADINGS', label: 'Matching Headings' },
    { value: 'INFORMATION_MATCHING', label: 'Information Matching' },
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
    { value: 'NOTES_COMPLETION', label: 'Notes Completion' },
    { value: 'FILL_IN_THE_BLANK', label: 'Fill in the Blank' },
    { value: 'TRUE_FALSE_NOT_GIVEN', label: 'True/False/Not Given' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Review & Create</h3>

        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Test Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Title:</span>
              <span className="ml-2 font-medium">{testData.title}</span>
            </div>
            <div>
              <span className="text-gray-600">Module:</span>
              <span className="ml-2 font-medium">{testData.module}</span>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium">
                {questionTypes.find(t => t.value === testData.type)?.label}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Difficulty:</span>
              <span className="ml-2 font-medium">{testData.difficulty}</span>
            </div>
            <div>
              <span className="text-gray-600">Duration:</span>
              <span className="ml-2 font-medium">{testData.duration} minutes</span>
            </div>
            {testData.module === 'LISTENING' && testData.audioUrl && (
              <div>
                <span className="text-gray-600">Audio URL:</span>
                <span className="ml-2 font-medium text-blue-600 break-all">{testData.audioUrl}</span>
              </div>
            )}
            <div>
              <span className="text-gray-600">Questions:</span>
              <span className="ml-2 font-medium">{testData.questions.length}</span>
            </div>
            {testData.mockTestId && (
              <div>
                <span className="text-gray-600">Linked Mock Test:</span>
                <span className="ml-2 font-medium">
                  {mockTests.find(mt => mt.id === testData.mockTestId)?.title || 'Unknown'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


