'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AudioFileUpload from './AudioFileUpload'
import Link from 'next/link'

interface ReadingTest {
  id: string
  title: string
}

interface FillInBlankRow {
  id: string
  questionNumber: number
  labelPrefix: string
  textPrefix: string
  textSuffix: string
  correctAnswer: string | string[]
}

interface SingleChoiceQuestion {
  id: string
  questionNumber: number
  questionText: string
  options: string[]
  correctAnswer: string
}

interface MatchingQuestion {
  id: string
  questionNumber: number
  matchingLabel: string
  correctAnswer: string
}

interface PartData {
  index: number
  title: string
  prompt: string[]
  sectionTitle?: string
  courseRequired?: string
  matchingHeading?: string
  matchingOptions?: string[]
  notesSections?: any
  fillRows?: FillInBlankRow[]
  singleChoice?: SingleChoiceQuestion[]
  matchingItems?: MatchingQuestion[]
}

interface ListeningTestFormProps {
  testId?: string
  initialData?: any
  mode?: 'create' | 'edit'
}

export default function ListeningTestForm({ testId, initialData, mode = 'create' }: ListeningTestFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [title, setTitle] = useState('IELTS Listening Test')
  const [audioSource, setAudioSource] = useState('')
  const [audioPublicId, setAudioPublicId] = useState('')
  const [instructions, setInstructions] = useState<string[]>([
    '◉ Check your headphones carefully before you start.',
    '◉ The Listening test has 4 parts.',
    '◉ There are 40 questions in total.',
    '◉ You will hear each recording once only.',
    '◉ You can adjust the volume during the test.',
    '◉ You can check and change your answers while you are listening.',
    '◉ After the recording ends, you will have 2 minutes to check your answers.',
    '◉ Spelling and grammar are important.',
    '◉ When you are ready, click Start Test to begin.'
  ])
  const [readingTestId, setReadingTestId] = useState<string>('')
  const [readingTests, setReadingTests] = useState<ReadingTest[]>([])
  const [loadingReadingTests, setLoadingReadingTests] = useState(true)

  const [parts, setParts] = useState<PartData[]>([
    {
      index: 1,
      title: 'Part 1: Questions 1–10',
      prompt: ['Complete the notes below.', 'Write ONE WORD AND/OR A NUMBER for each answer.'],
      sectionTitle: '',
      courseRequired: '',
      fillRows: []
    },
    {
      index: 2,
      title: 'Part 2: Questions 11–20',
      prompt: ['Questions 11-15 — Choose the correct letter, A, B or C.'],
      matchingHeading: '',
      matchingOptions: [],
      singleChoice: [],
      matchingItems: []
    },
    {
      index: 3,
      title: 'Part 3: Questions 21–30',
      prompt: ['Questions 21-26 — Choose the correct letter, A, B or C.'],
      matchingHeading: '',
      matchingOptions: [],
      singleChoice: [],
      matchingItems: []
    },
    {
      index: 4,
      title: 'Part 4: Questions 31–40',
      prompt: ['Complete the notes below.', 'Write ONE WORD ONLY for each answer.'],
      sectionTitle: '',
      notesSections: []
    }
  ])

  // Load initial data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTitle(initialData.title || 'IELTS Listening Test')
      setAudioSource(initialData.audioSource || '')
      setReadingTestId(initialData.readingTestId || '')
      
      if (Array.isArray(initialData.instructions)) {
        setInstructions(initialData.instructions)
      }

      // Transform parts from database structure to form structure
      if (initialData.parts && Array.isArray(initialData.parts)) {
        const transformedParts: PartData[] = initialData.parts.map((part: any) => {
          const partData: PartData = {
            index: part.index,
            title: part.title,
            prompt: Array.isArray(part.prompt) ? part.prompt : [],
            sectionTitle: part.sectionTitle || '',
            courseRequired: part.courseRequired || '',
            matchingHeading: part.matchingHeading || '',
            matchingOptions: Array.isArray(part.matchingOptions) ? part.matchingOptions : [],
            notesSections: part.notesSections || null,
            fillRows: [],
            singleChoice: [],
            matchingItems: []
          }

          // Transform questions based on type
          if (part.questions && Array.isArray(part.questions)) {
            part.questions.forEach((q: any) => {
              const correctAnswer = q.correctAnswer?.answer || ''
              
              if (q.type === 'TEXT') {
                partData.fillRows!.push({
                  id: q.id || `fill-${q.number}`,
                  questionNumber: q.number,
                  labelPrefix: q.labelPrefix || '',
                  textPrefix: q.textPrefix || '',
                  textSuffix: q.textSuffix || '',
                  correctAnswer: Array.isArray(correctAnswer) ? correctAnswer : correctAnswer
                })
              } else if (q.type === 'RADIO') {
                partData.singleChoice!.push({
                  id: q.id || `sc-${q.number}`,
                  questionNumber: q.number,
                  questionText: q.questionText || '',
                  options: Array.isArray(q.options) ? q.options : [],
                  correctAnswer: String(correctAnswer)
                })
              } else if (q.type === 'SELECT') {
                partData.matchingItems!.push({
                  id: q.id || `match-${q.number}`,
                  questionNumber: q.number,
                  matchingLabel: q.matchingLabel || '',
                  correctAnswer: String(correctAnswer)
                })
              }
            })
          }

          return partData
        })

        // Ensure we have 4 parts
        while (transformedParts.length < 4) {
          const partIndex = transformedParts.length + 1
          transformedParts.push({
            index: partIndex,
            title: `Part ${partIndex}: Questions ${(partIndex - 1) * 10 + 1}–${partIndex * 10}`,
            prompt: [],
            fillRows: [],
            singleChoice: [],
            matchingItems: []
          })
        }

        setParts(transformedParts)
      }
    }
  }, [mode, initialData])

  useEffect(() => {
    const fetchReadingTests = async () => {
      try {
        const response = await fetch('/api/admin/reading-tests')
        const data = await response.json()
        if (response.ok) {
          setReadingTests(data.readingTests || [])
        }
      } catch (error) {
        console.error('Error fetching reading tests:', error)
      } finally {
        setLoadingReadingTests(false)
      }
    }
    fetchReadingTests()
  }, [])

  const updatePart = (partIndex: number, updates: Partial<PartData>) => {
    setParts(parts.map((p, i) => i === partIndex ? { ...p, ...updates } : p))
  }

  const addInstruction = () => {
    setInstructions([...instructions, ''])
  }

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index))
  }

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions]
    newInstructions[index] = value
    setInstructions(newInstructions)
  }

  // Part 1 & 4: Fill-in-the-blank helpers
  const addFillRow = (partIndex: number) => {
    const part = parts[partIndex]
    const nextQuestionNumber = (part.fillRows?.length || 0) + ((partIndex === 0 ? 1 : 31))
    const newRow: FillInBlankRow = {
      id: `fill-${Date.now()}`,
      questionNumber: nextQuestionNumber,
      labelPrefix: '',
      textPrefix: '',
      textSuffix: '',
      correctAnswer: ''
    }
    updatePart(partIndex, {
      fillRows: [...(part.fillRows || []), newRow]
    })
  }

  const updateFillRow = (partIndex: number, rowId: string, updates: Partial<FillInBlankRow>) => {
    const part = parts[partIndex]
    updatePart(partIndex, {
      fillRows: part.fillRows?.map(r => r.id === rowId ? { ...r, ...updates } : r)
    })
  }

  const removeFillRow = (partIndex: number, rowId: string) => {
    const part = parts[partIndex]
    updatePart(partIndex, {
      fillRows: part.fillRows?.filter(r => r.id !== rowId)
    })
  }

  // Part 2 & 3: Single choice helpers
  const addSingleChoice = (partIndex: number) => {
    const part = parts[partIndex]
    const startNumber = partIndex === 1 ? 11 : 21
    const nextQuestionNumber = (part.singleChoice?.length || 0) + startNumber
    const newQuestion: SingleChoiceQuestion = {
      id: `sc-${Date.now()}`,
      questionNumber: nextQuestionNumber,
      questionText: '',
      options: ['', '', ''],
      correctAnswer: ''
    }
    updatePart(partIndex, {
      singleChoice: [...(part.singleChoice || []), newQuestion]
    })
  }

  const updateSingleChoice = (partIndex: number, questionId: string, updates: Partial<SingleChoiceQuestion>) => {
    const part = parts[partIndex]
    updatePart(partIndex, {
      singleChoice: part.singleChoice?.map(q => q.id === questionId ? { ...q, ...updates } : q)
    })
  }

  const removeSingleChoice = (partIndex: number, questionId: string) => {
    const part = parts[partIndex]
    updatePart(partIndex, {
      singleChoice: part.singleChoice?.filter(q => q.id !== questionId)
    })
  }

  // Part 2 & 3: Matching helpers
  const addMatchingItem = (partIndex: number) => {
    const part = parts[partIndex]
    const startNumber = partIndex === 1 ? 16 : 27
    const nextQuestionNumber = (part.matchingItems?.length || 0) + startNumber
    const newItem: MatchingQuestion = {
      id: `match-${Date.now()}`,
      questionNumber: nextQuestionNumber,
      matchingLabel: '',
      correctAnswer: ''
    }
    updatePart(partIndex, {
      matchingItems: [...(part.matchingItems || []), newItem]
    })
  }

  const updateMatchingItem = (partIndex: number, itemId: string, updates: Partial<MatchingQuestion>) => {
    const part = parts[partIndex]
    updatePart(partIndex, {
      matchingItems: part.matchingItems?.map(i => i.id === itemId ? { ...i, ...updates } : i)
    })
  }

  const removeMatchingItem = (partIndex: number, itemId: string) => {
    const part = parts[partIndex]
    updatePart(partIndex, {
      matchingItems: part.matchingItems?.filter(i => i.id !== itemId)
    })
  }

  const addMatchingOption = (partIndex: number) => {
    const part = parts[partIndex]
    const options = part.matchingOptions || []
    const nextLetter = String.fromCharCode(65 + options.length) // A, B, C, etc.
    updatePart(partIndex, {
      matchingOptions: [...options, `${nextLetter} `]
    })
  }

  const updateMatchingOption = (partIndex: number, index: number, value: string) => {
    const part = parts[partIndex]
    const options = [...(part.matchingOptions || [])]
    options[index] = value
    updatePart(partIndex, { matchingOptions: options })
  }

  const removeMatchingOption = (partIndex: number, index: number) => {
    const part = parts[partIndex]
    const options = part.matchingOptions || []
    updatePart(partIndex, {
      matchingOptions: options.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setMessage(null)

    try {
      // Validation
      if (!title.trim()) {
        throw new Error('Title is required')
      }
      if (!audioSource.trim()) {
        throw new Error('Audio source is required')
      }
      if (instructions.length === 0 || instructions.every(i => !i.trim())) {
        throw new Error('At least one instruction is required')
      }

      // Validate parts
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (!part.title.trim()) {
          throw new Error(`Part ${i + 1} title is required`)
        }

        if (i === 0 || i === 3) {
          // Part 1 & 4: Fill-in-the-blank
          if (!part.fillRows || part.fillRows.length === 0) {
            throw new Error(`Part ${i + 1} must have at least one fill-in-the-blank question`)
          }
          for (const row of part.fillRows) {
            if (!row.correctAnswer || (Array.isArray(row.correctAnswer) && row.correctAnswer.length === 0)) {
              throw new Error(`Part ${i + 1}, Question ${row.questionNumber}: Correct answer is required`)
            }
          }
        } else {
          // Part 2 & 3: Single choice and matching
          if ((!part.singleChoice || part.singleChoice.length === 0) && 
              (!part.matchingItems || part.matchingItems.length === 0)) {
            throw new Error(`Part ${i + 1} must have at least one question (single choice or matching)`)
          }
          
          if (part.singleChoice) {
            for (const q of part.singleChoice) {
              if (!q.correctAnswer.trim()) {
                throw new Error(`Part ${i + 1}, Question ${q.questionNumber}: Correct answer is required`)
              }
              if (q.options.length < 2) {
                throw new Error(`Part ${i + 1}, Question ${q.questionNumber}: At least 2 options are required`)
              }
            }
          }

          if (part.matchingItems && part.matchingItems.length > 0) {
            if (!part.matchingOptions || part.matchingOptions.length === 0) {
              throw new Error(`Part ${i + 1}: Matching options are required when there are matching questions`)
            }
            for (const m of part.matchingItems) {
              if (!m.correctAnswer.trim()) {
                throw new Error(`Part ${i + 1}, Question ${m.questionNumber}: Correct answer is required`)
              }
            }
          }
        }
      }

      // Transform data for API
      const transformedParts = parts.map((part, partIndex) => {
        const questions: any[] = []

        if (partIndex === 0 || partIndex === 3) {
          // Part 1 & 4: Fill-in-the-blank (TEXT type)
          part.fillRows?.forEach(row => {
            questions.push({
              number: row.questionNumber,
              type: 'TEXT',
              labelPrefix: row.labelPrefix,
              textPrefix: row.textPrefix,
              textSuffix: row.textSuffix,
              correctAnswer: Array.isArray(row.correctAnswer) ? row.correctAnswer : [row.correctAnswer]
            })
          })
        } else {
          // Part 2 & 3: Single choice (RADIO) and Matching (SELECT)
          part.singleChoice?.forEach(q => {
            questions.push({
              number: q.questionNumber,
              type: 'RADIO',
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer
            })
          })

          part.matchingItems?.forEach(m => {
            questions.push({
              number: m.questionNumber,
              type: 'SELECT',
              matchingLabel: m.matchingLabel,
              correctAnswer: m.correctAnswer
            })
          })
        }

        return {
          index: part.index,
          title: part.title,
          prompt: part.prompt,
          sectionTitle: part.sectionTitle || null,
          courseRequired: part.courseRequired || null,
          matchingHeading: part.matchingHeading || null,
          matchingOptions: part.matchingOptions || null,
          notesSections: part.notesSections || null,
          questions
        }
      })

      const payload = {
        title,
        audioSource,
        instructions,
        readingTestId: readingTestId || null,
        parts: transformedParts
      }

      const url = mode === 'edit' && testId 
        ? `/api/admin/listening-tests/${testId}`
        : '/api/admin/listening-tests'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${mode === 'edit' ? 'update' : 'create'} listening test`)
      }

      const result = await response.json()
      setMessage({
        type: 'success',
        text: `Listening test "${result.listeningTest?.title || title}" ${mode === 'edit' ? 'updated' : 'created'} successfully! Redirecting...`
      })

      setTimeout(() => {
        router.push('/admin/listening-tests')
      }, 2000)
    } catch (error) {
      console.error('Error creating listening test:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create listening test'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Message Alert */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setMessage(null)}
                className={`inline-flex rounded-md p-1.5 ${
                  message.type === 'success'
                    ? 'text-green-500 hover:bg-green-100'
                    : 'text-red-500 hover:bg-red-100'
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Test Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="IELTS Listening Test"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio File
            </label>
            <AudioFileUpload
              onFileChange={(file, url, publicId) => {
                if (url) {
                  setAudioSource(url)
                  setAudioPublicId(publicId || '')
                }
              }}
              initialUrl={audioSource}
              initialPublicId={audioPublicId}
              maxSize={25}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions
            </label>
            <div className="space-y-2">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter instruction"
                  />
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addInstruction}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Instruction
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reading-test-select" className="block text-sm font-medium text-gray-700 mb-2">
              Associate with Reading Test (Optional)
            </label>
            <select
              id="reading-test-select"
              value={readingTestId}
              onChange={(e) => setReadingTestId(e.target.value)}
              disabled={loadingReadingTests}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
            >
              <option value="">None (Standalone Listening Test)</option>
              {readingTests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Parts */}
      {parts.map((part, partIndex) => (
        <div key={partIndex} className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{part.title}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Part Title
              </label>
              <input
                type="text"
                value={part.title}
                onChange={(e) => updatePart(partIndex, { title: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt (one per line)
              </label>
              <textarea
                value={part.prompt.join('\n')}
                onChange={(e) => updatePart(partIndex, { prompt: e.target.value.split('\n').filter(l => l.trim()) })}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter prompt lines"
              />
            </div>

            {(partIndex === 0 || partIndex === 3) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={part.sectionTitle || ''}
                    onChange={(e) => updatePart(partIndex, { sectionTitle: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                {partIndex === 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Required
                    </label>
                    <input
                      type="text"
                      value={part.courseRequired || ''}
                      onChange={(e) => updatePart(partIndex, { courseRequired: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Fill-in-the-Blank Questions
                    </label>
                    <button
                      type="button"
                      onClick={() => addFillRow(partIndex)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Question
                    </button>
                  </div>
                  <div className="space-y-3">
                    {part.fillRows?.map((row) => (
                      <div key={row.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Question Number
                            </label>
                            <input
                              type="number"
                              value={row.questionNumber}
                              onChange={(e) => updateFillRow(partIndex, row.id, { questionNumber: parseInt(e.target.value) || 0 })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Correct Answer (comma-separated for alternatives)
                            </label>
                            <input
                              type="text"
                              value={Array.isArray(row.correctAnswer) ? row.correctAnswer.join(', ') : row.correctAnswer}
                              onChange={(e) => {
                                const answers = e.target.value.split(',').map(a => a.trim()).filter(a => a)
                                updateFillRow(partIndex, row.id, { correctAnswer: answers.length === 1 ? answers[0] : answers })
                              }}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Label Prefix
                            </label>
                            <input
                              type="text"
                              value={row.labelPrefix}
                              onChange={(e) => updateFillRow(partIndex, row.id, { labelPrefix: e.target.value })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Full name of participant:"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Text Prefix
                            </label>
                            <input
                              type="text"
                              value={row.textPrefix}
                              onChange={(e) => updateFillRow(partIndex, row.id, { textPrefix: e.target.value })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Jan "
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Text Suffix
                            </label>
                            <input
                              type="text"
                              value={row.textSuffix}
                              onChange={(e) => updateFillRow(partIndex, row.id, { textSuffix: e.target.value })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder=" PM"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFillRow(partIndex, row.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove Question
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {(partIndex === 1 || partIndex === 2) && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Single Choice Questions
                    </label>
                    <button
                      type="button"
                      onClick={() => addSingleChoice(partIndex)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Question
                    </button>
                  </div>
                  <div className="space-y-3">
                    {part.singleChoice?.map((q) => (
                      <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Question Number
                          </label>
                          <input
                            type="number"
                            value={q.questionNumber}
                            onChange={(e) => updateSingleChoice(partIndex, q.id, { questionNumber: parseInt(e.target.value) || 0 })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Question Text
                          </label>
                          <input
                            type="text"
                            value={q.questionText}
                            onChange={(e) => updateSingleChoice(partIndex, q.id, { questionText: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Options
                          </label>
                          <div className="space-y-2">
                            {q.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex gap-2">
                                <span className="inline-flex items-center px-2 text-sm text-gray-500">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...q.options]
                                    newOptions[optIndex] = e.target.value
                                    updateSingleChoice(partIndex, q.id, { options: newOptions })
                                  }}
                                  className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                                {q.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptions = q.options.filter((_, i) => i !== optIndex)
                                      updateSingleChoice(partIndex, q.id, { options: newOptions })
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = [...q.options, '']
                                updateSingleChoice(partIndex, q.id, { options: newOptions })
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              + Add Option
                            </button>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Correct Answer (A, B, C, etc.)
                          </label>
                          <input
                            type="text"
                            value={q.correctAnswer}
                            onChange={(e) => updateSingleChoice(partIndex, q.id, { correctAnswer: e.target.value.toUpperCase() })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="B"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSingleChoice(partIndex, q.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove Question
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Matching Questions
                    </label>
                    <button
                      type="button"
                      onClick={() => addMatchingItem(partIndex)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Question
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Matching Heading
                    </label>
                    <input
                      type="text"
                      value={part.matchingHeading || ''}
                      onChange={(e) => updatePart(partIndex, { matchingHeading: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Staff Holiday Centres"
                    />
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Matching Options
                      </label>
                      <button
                        type="button"
                        onClick={() => addMatchingOption(partIndex)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Option
                      </button>
                    </div>
                    <div className="space-y-2">
                      {part.matchingOptions?.map((option, optIndex) => (
                        <div key={optIndex} className="flex gap-2">
                          <span className="inline-flex items-center px-2 text-sm text-gray-500">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateMatchingOption(partIndex, optIndex, e.target.value)}
                            className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeMatchingOption(partIndex, optIndex)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {part.matchingItems?.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Question Number
                            </label>
                            <input
                              type="number"
                              value={item.questionNumber}
                              onChange={(e) => updateMatchingItem(partIndex, item.id, { questionNumber: parseInt(e.target.value) || 0 })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Matching Label
                            </label>
                            <input
                              type="text"
                              value={item.matchingLabel}
                              onChange={(e) => updateMatchingItem(partIndex, item.id, { matchingLabel: e.target.value })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="The Grange"
                            />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Correct Answer (A, B, C, etc.)
                          </label>
                          <input
                            type="text"
                            value={item.correctAnswer}
                            onChange={(e) => updateMatchingItem(partIndex, item.id, { correctAnswer: e.target.value.toUpperCase() })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="C"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMatchingItem(partIndex, item.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove Question
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ))}

      {/* Submit Button */}
      <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {mode === 'edit' ? 'Update Listening Test' : 'Create Listening Test'}
                </>
              )}
            </button>
      </div>
    </div>
  )
}

