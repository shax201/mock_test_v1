'use client'

import { useEffect, useState } from 'react'
import AudioFileUpload from './AudioFileUpload'
import { X } from 'lucide-react'

interface QuestionCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (questionData: any) => void
  part: 1 | 2 | 3
  allowedTypes?: string[]
  enableAudioContent?: boolean
  initial?: {
    type?: string
    content?: string
    audioUrl?: string
    audioPublicId?: string
    correctAnswer?: string
    instructions?: string
  }
}

const questionTypes = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice', description: 'Choose one correct answer from options' },
  { value: 'NOTES_COMPLETION', label: 'Notes Completion', description: 'Complete notes with missing information' },
  { value: 'SUMMARY_COMPLETION', label: 'Summary Completion', description: 'Complete summary with missing words' },
  { value: 'TRUE_FALSE_NOT_GIVEN', label: 'True/False/Not Given', description: 'Determine if statement is true, false, or not given' },
  { value: 'FIB', label: 'Fill in the Blank', description: 'Fill in missing words in sentences' },
  { value: 'MATCHING', label: 'Matching', description: 'Match items from two lists' },
  { value: 'MATCHING_HEADINGS', label: 'Matching Headings', description: 'Match headings to passage sections' },
  { value: 'MCQ', label: 'Multiple Choice Question', description: 'Multiple choice with single answer' },
  { value: 'TRUE_FALSE', label: 'True/False', description: 'Determine if statement is true or false' },
  { value: 'NOT_GIVEN', label: 'Not Given', description: 'Determine if information is not given' }
]

export default function QuestionCreationModal({ isOpen, onClose, onSave, part, allowedTypes, enableAudioContent, initial }: QuestionCreationModalProps) {
  const isEditing = Boolean(initial)
  const [questionType, setQuestionType] = useState<string>('MULTIPLE_CHOICE')
  const [content, setContent] = useState('')
  const [points, setPoints] = useState(1)
  const [options, setOptions] = useState<string[]>(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [instructions, setInstructions] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [audioPublicId, setAudioPublicId] = useState('')

  const resetAll = () => {
    console.log('Resetting all values')
    setQuestionType('MULTIPLE_CHOICE')
    setContent('')
    setPoints(1)
    setOptions(['', '', '', ''])
    setCorrectAnswer('')
    setInstructions('')
    setAudioUrl('')
    setAudioPublicId('')
  }

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log('Modal closed, resetting values')
      resetAll()
    }
  }, [isOpen])

  // Set initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Setting initial values:', initial)
      setQuestionType(initial?.type || 'MULTIPLE_CHOICE')
      setContent(initial?.content || '')
      setCorrectAnswer(initial?.correctAnswer || '')
      setInstructions(initial?.instructions || '')
      setAudioUrl(initial?.audioUrl || '')
      setAudioPublicId(initial?.audioPublicId || '')
      console.log('Audio URL set to:', initial?.audioUrl)
    }
  }, [isOpen, initial])

  const handleSave = () => {
    if (!enableAudioContent && !content.trim()) {
      alert('Please enter question content')
      return
    }
    if (enableAudioContent && !audioUrl) {
      alert('Please upload question audio')
      return
    }

    const questionData = {
      type: questionType,
      content: content.trim(),
      points,
      part,
      instructions: instructions.trim(),
      ...(enableAudioContent ? { questionAudio: { url: audioUrl, publicId: audioPublicId } } : {}),
      ...(questionType === 'MULTIPLE_CHOICE' || questionType === 'MCQ' ? {
        options: options.filter(opt => opt.trim()),
        correctAnswer
      } : questionType === 'TRUE_FALSE_NOT_GIVEN' ? {
        trueFalseNotGivenData: {
          statement: content.trim(),
          correctAnswer: correctAnswer as 'TRUE' | 'FALSE' | 'NOT_GIVEN',
          explanation: instructions.trim() || undefined
        },
        correctAnswer
      } : questionType === 'TRUE_FALSE' ? {
        correctAnswer: correctAnswer as 'TRUE' | 'FALSE'
      } : {
        correctAnswer
      })
    }

    onSave(questionData)
    handleClose()
  }

  const handleClose = () => {
    resetAll()
    onClose()
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([...options, ''])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit' : 'Create'} Question for Part {part}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Question Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Question Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(allowedTypes ? questionTypes.filter(t => allowedTypes.includes(t.value)) : questionTypes).map((type) => (
                <div
                  key={type.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    questionType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setQuestionType(type.value)}
                >
                  <div className="font-medium text-sm text-gray-900">
                    {type.label}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {type.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question Content */}
          {!enableAudioContent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Content *
              </label>
              <textarea
                rows={3}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your question here..."
              />
            </div>
          )}

          {enableAudioContent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Audio *
              </label>
              <AudioFileUpload
                onFileChange={(_file, url, publicId) => { setAudioUrl(url || ''); setAudioPublicId(publicId || '') }}
                initialUrl={audioUrl}
                initialPublicId={audioPublicId || ''}
                accept="audio/*"
                maxSize={25}
              />
            </div>
          )}

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions
            </label>
            <textarea
              rows={2}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter any special instructions for this question..."
            />
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points
            </label>
            <input
              type="number"
              min="1"
              max="10"
              className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Options for Multiple Choice Questions */}
          {(questionType === 'MULTIPLE_CHOICE' || questionType === 'MCQ') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Options
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}

          {/* Correct Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correct Answer
            </label>
            {questionType === 'MULTIPLE_CHOICE' || questionType === 'MCQ' ? (
              <select
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
              >
                <option value="">Select correct option</option>
                {options.map((option, index) => (
                  <option key={index} value={option}>
                    {option || `Option ${index + 1}`}
                  </option>
                ))}
              </select>
            ) : questionType === 'TRUE_FALSE_NOT_GIVEN' ? (
              <select
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
              >
                <option value="">Select answer</option>
                <option value="TRUE">True</option>
                <option value="FALSE">False</option>
                <option value="NOT_GIVEN">Not Given</option>
              </select>
            ) : questionType === 'TRUE_FALSE' ? (
              <select
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
              >
                <option value="">Select answer</option>
                <option value="TRUE">True</option>
                <option value="FALSE">False</option>
              </select>
            ) : (
              <input
                type="text"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="Enter the correct answer..."
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isEditing ? 'Update Question' : 'Create Question'}
          </button>
        </div>
      </div>
    </div>
  )
}
