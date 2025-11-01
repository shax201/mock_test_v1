'use client'

import { useState } from 'react'
import IELTSReadingBuilder from './IELTSReadingBuilder'
import IELTSListeningBuilderV2 from './IELTSListeningBuilderV2'
import IELTSQuestionBuilder from './IELTSQuestionBuilder'

interface ModuleTypeSelectorProps {
  moduleType: 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING'
  onQuestionsChange: (questions: any[]) => void
  onPartContentChange?: (content: any) => void
  onPassageContentChange?: (content: any) => void
  onAudioFileChange?: (audioUrl: string, publicId?: string) => void
  onReadingDataChange?: (data: any) => void
  onListeningDataChange?: (data: any) => void
  initialQuestions?: any[]
  initialPartContent?: any
  initialPassageContent?: any
  initialAudioUrl?: string
  initialPublicId?: string
  initialReadingData?: any
  initialListeningData?: any
}

export default function ModuleTypeSelector({
  moduleType,
  onQuestionsChange,
  onPartContentChange,
  onPassageContentChange,
  onAudioFileChange,
  onReadingDataChange,
  onListeningDataChange,
  initialQuestions = [],
  initialPartContent,
  initialPassageContent,
  initialAudioUrl = '',
  initialPublicId = '',
  initialReadingData,
  initialListeningData
}: ModuleTypeSelectorProps) {
  const [activeBuilder, setActiveBuilder] = useState<'reading' | 'listening' | 'generic'>('generic')

  // Determine which builder to use based on module type
  const getBuilderComponent = () => {
    if (moduleType === 'READING') {
      return (
        <IELTSReadingBuilder
          onQuestionsChange={onQuestionsChange}
          onReadingDataChange={onReadingDataChange}
          initialQuestions={initialQuestions}
          initialReadingData={initialReadingData}
        />
      )
    } else if (moduleType === 'LISTENING') {
      return (
        <IELTSListeningBuilderV2
          onQuestionsChange={onQuestionsChange}
          onListeningDataChange={onListeningDataChange}
          onAudioFileChange={onAudioFileChange}
          initialQuestions={initialQuestions}
          initialListeningData={initialListeningData}
          initialAudioUrl={initialAudioUrl}
          initialPublicId={initialPublicId}
        />
      )
    } else {
      // For WRITING and SPEAKING, use the generic builder
      return (
        <IELTSQuestionBuilder
          moduleType={moduleType}
          onQuestionsChange={onQuestionsChange}
          onPartContentChange={onPartContentChange}
          onPassageContentChange={onPassageContentChange}
          initialQuestions={initialQuestions}
          initialPartContent={initialPartContent}
          initialPassageContent={initialPassageContent}
        />
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Module Type Header */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {moduleType} Module Builder
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {moduleType === 'READING' && 'Create reading passages and questions with dedicated content management'}
              {moduleType === 'LISTENING' && 'Create listening questions with audio file management and timing controls'}
              {moduleType === 'WRITING' && 'Create writing tasks and assessment criteria'}
              {moduleType === 'SPEAKING' && 'Create speaking tasks and evaluation rubrics'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              moduleType === 'READING' ? 'bg-blue-100 text-blue-800' :
              moduleType === 'LISTENING' ? 'bg-green-100 text-green-800' :
              moduleType === 'WRITING' ? 'bg-purple-100 text-purple-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {moduleType}
            </span>
          </div>
        </div>
      </div>

      {/* Builder Component */}
      {getBuilderComponent()}
    </div>
  )
}
