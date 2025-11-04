'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface ReadingQuestionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (questionData: any) => void
  initialQuestion?: {
    questionNumber?: number
    type?: string
    questionText?: string
    options?: string[]
    headingsList?: string[]
    summaryText?: string
    subQuestions?: string[]
    correctAnswer?: string
  }
}

const questionTypes = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice', description: 'Choose one correct answer from options' },
  { value: 'TRUE_FALSE_NOT_GIVEN', label: 'True/False/Not Given', description: 'Determine if statement is true, false, or not given' },
  { value: 'MATCHING_HEADINGS', label: 'Matching Headings', description: 'Match headings to passage sections' },
  { value: 'SUMMARY_COMPLETION', label: 'Summary Completion', description: 'Complete summary with missing words' }
]

export default function ReadingQuestionModal({
  isOpen,
  onClose,
  onSave,
  initialQuestion
}: ReadingQuestionModalProps) {
  const isEditing = Boolean(initialQuestion)
  const [questionType, setQuestionType] = useState<string>(initialQuestion?.type || 'MULTIPLE_CHOICE')
  const [questionText, setQuestionText] = useState(initialQuestion?.questionText || '')
  const [correctAnswer, setCorrectAnswer] = useState(initialQuestion?.correctAnswer || '')
  const [options, setOptions] = useState<string[]>(initialQuestion?.options || ['A', 'B', 'C', 'D'])
  const [headingsList, setHeadingsList] = useState<string[]>(initialQuestion?.headingsList || [])
  const [summaryText, setSummaryText] = useState(initialQuestion?.summaryText || '')
  const [subQuestions, setSubQuestions] = useState<string[]>(initialQuestion?.subQuestions || [])

  useEffect(() => {
    if (isOpen) {
      setQuestionType(initialQuestion?.type || 'MULTIPLE_CHOICE')
      setQuestionText(initialQuestion?.questionText || '')
      setCorrectAnswer(initialQuestion?.correctAnswer || '')
      setOptions(initialQuestion?.options || ['A', 'B', 'C', 'D'])
      setHeadingsList(initialQuestion?.headingsList || [])
      setSummaryText(initialQuestion?.summaryText || '')
      setSubQuestions(initialQuestion?.subQuestions || [])
    }
  }, [isOpen, initialQuestion])

  const handleSave = () => {
    if (!questionText.trim()) {
      alert('Please enter question text')
      return
    }
    if (!correctAnswer.trim()) {
      alert('Please enter correct answer')
      return
    }

    const questionData: any = {
      type: questionType,
      questionText: questionText.trim(),
      correctAnswer: correctAnswer.trim(),
    }

    if (questionType === 'MULTIPLE_CHOICE') {
      questionData.options = options.filter(opt => opt.trim())
    }

    if (questionType === 'MATCHING_HEADINGS') {
      questionData.headingsList = headingsList.filter(h => h.trim())
    }

    if (questionType === 'SUMMARY_COMPLETION') {
      questionData.summaryText = summaryText.trim()
      if (subQuestions.length > 0) {
        questionData.subQuestions = subQuestions.filter(sq => sq.trim())
      }
    }

    onSave(questionData)
    handleClose()
  }

  const handleClose = () => {
    setQuestionType('MULTIPLE_CHOICE')
    setQuestionText('')
    setCorrectAnswer('')
    setOptions(['A', 'B', 'C', 'D'])
    setHeadingsList([])
    setSummaryText('')
    setSubQuestions([])
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
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateHeading = (index: number, value: string) => {
    const newHeadings = [...headingsList]
    newHeadings[index] = value
    setHeadingsList(newHeadings)
  }

  const addHeading = () => {
    setHeadingsList([...headingsList, ''])
  }

  const removeHeading = (index: number) => {
    setHeadingsList(headingsList.filter((_, i) => i !== index))
  }

  const updateSubQuestion = (index: number, value: string) => {
    const newSubQuestions = [...subQuestions]
    newSubQuestions[index] = value
    setSubQuestions(newSubQuestions)
  }

  const addSubQuestion = () => {
    setSubQuestions([...subQuestions, ''])
  }

  const removeSubQuestion = (index: number) => {
    setSubQuestions(subQuestions.filter((_, i) => i !== index))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit' : 'Create'} Question
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
              {questionTypes.map((type) => (
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

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter your question here..."
            />
          </div>

          {/* Options for Multiple Choice */}
          {questionType === 'MULTIPLE_CHOICE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Options
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600 w-8">
                      {String.fromCharCode(65 + index)}:
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
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

          {/* Headings List for Matching Headings */}
          {questionType === 'MATCHING_HEADINGS' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Headings List
              </label>
              <div className="space-y-2">
                {headingsList.map((heading, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600 w-8">
                      {index + 1}:
                    </span>
                    <input
                      type="text"
                      value={heading}
                      onChange={(e) => updateHeading(index, e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder={`Heading ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeHeading(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addHeading}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Heading
                </button>
              </div>
            </div>
          )}

          {/* Summary Text for Summary Completion */}
          {questionType === 'SUMMARY_COMPLETION' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary Text *
              </label>
              <textarea
                rows={6}
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter the summary text with blanks (e.g., 'The _____ was discovered in...')"
              />
              <p className="mt-1 text-xs text-gray-500">
                Use underscores or brackets to indicate blanks
              </p>
            </div>
          )}

          {/* Correct Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correct Answer *
            </label>
            {questionType === 'MULTIPLE_CHOICE' ? (
              <select
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
              >
                <option value="">Select correct option</option>
                {options.map((option, index) => (
                  <option key={index} value={option}>
                    {option || `Option ${String.fromCharCode(65 + index)}`}
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

