'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AudioFileUpload from './AudioFileUpload'
import Link from 'next/link'
import ImageChartEditor, { ChartField } from './ImageChartEditor'
import RainwaterTable from './RainwaterTable'
import DynamicTableEditor, { TableStructure } from './DynamicTableEditor'
import TableStructureEditor from './TableStructureEditor'
import { Editor } from '@tinymce/tinymce-react'

// Component to preview flow chart with input field positions (read-only view)
function FlowChartPreview({ imageUrl, questions }: { imageUrl: string; questions: any[] }) {
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState({ x: 1, y: 1 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const updateScale = useCallback(() => {
    if (imageRef.current) {
      const img = imageRef.current
      const naturalWidth = img.naturalWidth
      const naturalHeight = img.naturalHeight
      const displayedWidth = img.clientWidth
      const displayedHeight = img.clientHeight

      if (naturalWidth > 0 && naturalHeight > 0 && displayedWidth > 0 && displayedHeight > 0) {
        const scaleX = displayedWidth / naturalWidth
        const scaleY = displayedHeight / naturalHeight
        setScale({ x: scaleX, y: scaleY })
      }
    }
  }, [])

  useEffect(() => {
    if (imageLoaded) {
      const timeoutId = setTimeout(() => {
        updateScale()
      }, 100)
      
      window.addEventListener('resize', updateScale)
      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener('resize', updateScale)
      }
    }
  }, [imageLoaded, updateScale])

  const handleImageLoad = () => {
    setImageLoaded(true)
    setTimeout(() => {
      updateScale()
    }, 50)
  }

  const safeQuestions = Array.isArray(questions) ? questions : []

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">
          Preview: How students will see this flow chart
        </label>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Collapse
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Expand
            </>
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div 
          ref={containerRef}
          className="relative inline-block w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
          style={{ marginTop: 10 }}
        >
          <img 
            ref={imageRef}
            src={imageUrl} 
            alt="Flow chart preview" 
            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
            onLoad={handleImageLoad}
          />
          {imageLoaded && safeQuestions.map((q: any) => {
            if (!q || !q.field) return null
            
            const field = q.field
            if (!field || typeof field.x !== 'number' || typeof field.y !== 'number') return null
            
            return (
              <div
                key={q.id || q.questionNumber}
                style={{
                  position: 'absolute',
                  left: `${field.x * scale.x}px`,
                  top: `${field.y * scale.y}px`,
                  width: `${(field.width || 140) * scale.x}px`,
                  height: `${(field.height || 32) * scale.y}px`,
                  border: '2px dashed #3b82f6',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  pointerEvents: 'none'
                }}
                title={`Question ${q.questionNumber} - Position: (${Math.round(field.x)}, ${Math.round(field.y)})`}
              >
                <span className="text-xs font-medium text-blue-600">
                  Q{q.questionNumber}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

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

interface MatchingInformationQuestion {
  id: string
  questionNumber: number
  questionText: string
  correctAnswer: string
  groupId?: string // Group ID to link questions from the same matching information set
}

interface FlowChartQuestion {
  id: string
  questionNumber: number
  imageUrl: string
  field: ChartField // Single field per question
  groupId?: string // Group ID to link questions from the same flow chart
}

interface TableCompletionQuestion {
  id: string
  questionNumber: number
  answers: Record<number, string> // Answers for each blank (1-9)
  groupId?: string // Group ID to link questions from the same table
  tableStructure?: TableStructure // Dynamic table structure
}

interface PartData {
  index: number
  title: string
  prompt: string[]
  sectionTitle?: string
  courseRequired?: string
  matchingHeading?: string
  matchingOptions?: string[]
  matchingInformationOptions?: string[] // Options for matching information (e.g., A, B, C, D, E, F, G, H)
  matchingInformationStimulus?: string // Stimulus/context text for matching information questions
  singleChoiceTitle?: string // Title/prompt for single choice questions (e.g., "Questions 11-15 — Choose the correct letter, A, B or C.")
  notesSections?: any
  fillRows?: FillInBlankRow[]
  singleChoice?: SingleChoiceQuestion[]
  matchingItems?: MatchingQuestion[]
  matchingInformationQuestions?: MatchingInformationQuestion[]
  flowChartQuestions?: FlowChartQuestion[]
  tableCompletionQuestions?: TableCompletionQuestion[]
}

interface ListeningTestFormProps {
  testId?: string
  initialData?: any
  mode?: 'create' | 'edit'
  apiEndpoint?: string
  onSuccess?: () => void
}

export default function ListeningTestForm({ 
  testId, 
  initialData, 
  mode = 'create',
  apiEndpoint = '/api/admin/listening-tests',
  onSuccess
}: ListeningTestFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [title, setTitle] = useState('IELTS Listening Test')
  const [audioSource, setAudioSource] = useState('')
  const [audioPublicId, setAudioPublicId] = useState('')
  const [totalTimeMinutes, setTotalTimeMinutes] = useState(30)
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
      fillRows: [],
      flowChartQuestions: [],
      tableCompletionQuestions: []
    },
    {
      index: 2,
      title: 'Part 2: Questions 11–20',
      prompt: ['Questions 11-15 — Choose the correct letter, A, B or C.'],
      matchingHeading: '',
      matchingOptions: [],
      matchingInformationOptions: [],
      matchingInformationStimulus: '',
      singleChoice: [],
      matchingItems: [],
      matchingInformationQuestions: [],
      flowChartQuestions: [],
      tableCompletionQuestions: []
    },
    {
      index: 3,
      title: 'Part 3: Questions 21–30',
      prompt: ['Questions 21-26 — Choose the correct letter, A, B or C.'],
      matchingHeading: '',
      matchingOptions: [],
      matchingInformationOptions: [],
      matchingInformationStimulus: '',
      singleChoice: [],
      matchingItems: [],
      matchingInformationQuestions: [],
      flowChartQuestions: [],
      tableCompletionQuestions: []
    },
    {
      index: 4,
      title: 'Part 4: Questions 31–40',
      prompt: ['Complete the notes below.', 'Write ONE WORD ONLY for each answer.'],
      sectionTitle: '',
      notesSections: [],
      flowChartQuestions: [],
      tableCompletionQuestions: []
    }
  ])

  // Load initial data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTitle(initialData.title || 'IELTS Listening Test')
      setAudioSource(initialData.audioSource || '')
      setTotalTimeMinutes(initialData.totalTimeMinutes || 30)
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
            matchingInformationOptions: Array.isArray(part.matchingInformationOptions) ? part.matchingInformationOptions : [],
            matchingInformationStimulus: part.matchingInformationStimulus || '',
            singleChoiceTitle: part.singleChoiceTitle || '',
            notesSections: part.notesSections || null,
            fillRows: [],
            singleChoice: [],
            matchingItems: [],
            matchingInformationQuestions: [],
            flowChartQuestions: [],
            tableCompletionQuestions: []
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
              } else if (q.type === 'MATCHING_INFORMATION') {
                partData.matchingInformationQuestions!.push({
                  id: q.id || `matching-info-${q.number}`,
                  questionNumber: q.number,
                  questionText: q.questionText || '',
                  correctAnswer: String(correctAnswer),
                  groupId: q.groupId || q.id
                })
                // Load matching information options from part if available
                if (part.matchingInformationOptions && Array.isArray(part.matchingInformationOptions)) {
                  partData.matchingInformationOptions = part.matchingInformationOptions
                }
              } else if (q.type === 'FLOW_CHART') {
                // Each FLOW_CHART question represents one field
                // Group them by groupId if available, otherwise by imageUrl
                partData.flowChartQuestions!.push({
                  id: q.id || `flow-${q.number}`,
                  questionNumber: q.number,
                  imageUrl: q.imageUrl || '',
                  field: q.field || { id: '', x: 0, y: 0, width: 140, height: 32, value: '' },
                  groupId: q.groupId || q.id // Use groupId or fallback to id
                })
              } else if (q.type === 'TABLE_COMPLETION') {
                // TABLE_COMPLETION questions are grouped by groupId
                // Each question has answers object and tableStructure
                partData.tableCompletionQuestions!.push({
                  id: q.id || `table-${q.number}`,
                  questionNumber: q.number,
                  answers: q.answers || {},
                  groupId: q.groupId || q.id,
                  tableStructure: q.tableStructure || undefined
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
            matchingItems: [],
            flowChartQuestions: [],
            tableCompletionQuestions: []
          })
        }

        setParts(transformedParts)
      }
    }
  }, [mode, initialData])

  useEffect(() => {
    const fetchReadingTests = async () => {
      try {
        // Determine reading tests endpoint based on listening tests endpoint
        const readingTestsEndpoint = apiEndpoint.includes('/instructor/')
          ? '/api/instructor/reading-tests'
          : '/api/admin/reading-tests'
        
        const response = await fetch(readingTestsEndpoint)
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
  }, [apiEndpoint])

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

  // Matching Information helpers
  const addMatchingInformationOption = (partIndex: number) => {
    const part = parts[partIndex]
    const options = part.matchingInformationOptions || []
    const nextLetter = String.fromCharCode(65 + options.length) // A, B, C, etc.
    updatePart(partIndex, {
      matchingInformationOptions: [...options, nextLetter]
    })
  }

  const updateMatchingInformationOption = (partIndex: number, index: number, value: string) => {
    const part = parts[partIndex]
    const options = [...(part.matchingInformationOptions || [])]
    options[index] = value
    updatePart(partIndex, { matchingInformationOptions: options })
  }

  const removeMatchingInformationOption = (partIndex: number, index: number) => {
    const part = parts[partIndex]
    const options = part.matchingInformationOptions || []
    updatePart(partIndex, {
      matchingInformationOptions: options.filter((_, i) => i !== index)
    })
  }

  const addMatchingInformationQuestion = (partIndex: number, existingGroupId?: string) => {
    const part = parts[partIndex]
    const startNumber = partIndex === 1 ? 11 : partIndex === 2 ? 21 : 31
    const existingQuestions = [
      ...(part.fillRows || []),
      ...(part.singleChoice || []),
      ...(part.matchingItems || []),
      ...(part.matchingInformationQuestions || []),
      ...(part.flowChartQuestions || []),
      ...(part.tableCompletionQuestions || [])
    ]
    const maxQuestionNumber = existingQuestions.length > 0
      ? Math.max(...existingQuestions.map(q => q.questionNumber))
      : startNumber - 1
    const nextQuestionNumber = maxQuestionNumber + 1
    
    // Use existing groupId if provided, otherwise generate a new one
    const groupId = existingGroupId || `matching-info-group-${Date.now()}`
    
    const newQuestion: MatchingInformationQuestion = {
      id: `matching-info-${Date.now()}`,
      questionNumber: nextQuestionNumber,
      questionText: '',
      correctAnswer: '',
      groupId: groupId
    }
    updatePart(partIndex, {
      matchingInformationQuestions: [...(part.matchingInformationQuestions || []), newQuestion]
    })
  }

  const updateMatchingInformationQuestion = (partIndex: number, questionId: string, updates: Partial<MatchingInformationQuestion>) => {
    const part = parts[partIndex]
    updatePart(partIndex, {
      matchingInformationQuestions: part.matchingInformationQuestions?.map(q => q.id === questionId ? { ...q, ...updates } : q)
    })
  }

  const removeMatchingInformationQuestion = (partIndex: number, questionId: string) => {
    const part = parts[partIndex]
    const question = part.matchingInformationQuestions?.find(q => q.id === questionId)
    
    if (question?.groupId) {
      // Check if there are other questions in the same group
      const otherQuestionsInGroup = part.matchingInformationQuestions?.filter(q => q.groupId === question.groupId && q.id !== questionId) || []
      
      if (otherQuestionsInGroup.length > 0) {
        // Remove only this question
        updatePart(partIndex, {
          matchingInformationQuestions: part.matchingInformationQuestions?.filter(q => q.id !== questionId)
        })
      } else {
        // Remove all questions in the group (last one)
        updatePart(partIndex, {
          matchingInformationQuestions: part.matchingInformationQuestions?.filter(q => q.groupId !== question.groupId)
        })
      }
    } else {
      // Remove single question
      updatePart(partIndex, {
        matchingInformationQuestions: part.matchingInformationQuestions?.filter(q => q.id !== questionId)
      })
    }
  }

  // Flow Chart Completion helpers
  // Flow chart groups contain an image and multiple questions (one per field)
  interface FlowChartGroup {
    id: string
    imageUrl: string
    fields: ChartField[]
    startQuestionNumber: number // Starting question number for this group
  }

  const addFlowChartGroup = (partIndex: number) => {
    const part = parts[partIndex]
    // Calculate starting question number based on part
    const startNumber = partIndex === 0 ? 1 : partIndex === 1 ? 11 : partIndex === 2 ? 21 : 31
    const existingQuestions = [
      ...(part.fillRows || []),
      ...(part.singleChoice || []),
      ...(part.matchingItems || []),
      ...(part.flowChartQuestions || [])
    ]
    const maxQuestionNumber = existingQuestions.length > 0
      ? Math.max(...existingQuestions.map(q => q.questionNumber))
      : startNumber - 1
    const nextQuestionNumber = maxQuestionNumber + 1

    const newGroup: FlowChartGroup = {
      id: `flow-group-${Date.now()}`,
      imageUrl: '',
      fields: [],
      startQuestionNumber: nextQuestionNumber
    }
    
    // Store groups temporarily in a separate state or use a different approach
    // For now, we'll create a single "template" question that will be expanded when fields are saved
    const templateQuestion: FlowChartQuestion = {
      id: newGroup.id,
      questionNumber: nextQuestionNumber,
      imageUrl: '',
      field: { id: '', x: 0, y: 0, width: 140, height: 32, value: '' },
      groupId: newGroup.id
    }
    
    updatePart(partIndex, {
      flowChartQuestions: [...(part.flowChartQuestions || []), templateQuestion]
    })
  }

  // Convert fields to individual questions
  const saveFlowChartFields = (partIndex: number, groupId: string, imageUrl: string, fields: ChartField[]) => {
    const part = parts[partIndex]
    
    // Remove existing questions from this group
    const otherQuestions = part.flowChartQuestions?.filter(q => q.groupId !== groupId) || []
    
    // Find the starting question number for this group
    const groupQuestion = part.flowChartQuestions?.find(q => q.groupId === groupId)
    const startQuestionNumber = groupQuestion?.questionNumber || 
      (partIndex === 0 ? 1 : partIndex === 1 ? 11 : partIndex === 2 ? 21 : 31)
    
    // Create one question per field
    const newQuestions: FlowChartQuestion[] = fields.map((field, index) => ({
      id: `${groupId}-field-${field.id}`,
      questionNumber: startQuestionNumber + index,
      imageUrl: imageUrl,
      field: field,
      groupId: groupId
    }))
    
    // Recalculate question numbers for other questions if needed
    const allOtherQuestions = [
      ...otherQuestions,
      ...(part.fillRows || []).map(r => ({ questionNumber: r.questionNumber })),
      ...(part.singleChoice || []).map(q => ({ questionNumber: q.questionNumber })),
      ...(part.matchingItems || []).map(m => ({ questionNumber: m.questionNumber }))
    ]
    
    // Update question numbers to avoid conflicts
    const maxOtherNumber = allOtherQuestions.length > 0
      ? Math.max(...allOtherQuestions.map(q => q.questionNumber))
      : startQuestionNumber - 1
    
    const adjustedQuestions = newQuestions.map((q, index) => ({
      ...q,
      questionNumber: Math.max(startQuestionNumber, maxOtherNumber + 1) + index
    }))
    
    updatePart(partIndex, {
      flowChartQuestions: [...otherQuestions, ...adjustedQuestions]
    })
  }

  const updateFlowChartQuestion = (partIndex: number, questionId: string, updates: Partial<FlowChartQuestion>) => {
    const part = parts[partIndex]
    updatePart(partIndex, {
      flowChartQuestions: part.flowChartQuestions?.map(q => q.id === questionId ? { ...q, ...updates } : q)
    })
  }

  const removeFlowChartQuestion = (partIndex: number, questionId: string) => {
    const part = parts[partIndex]
    const question = part.flowChartQuestions?.find(q => q.id === questionId)
    
    if (question?.groupId) {
      // Remove all questions in the same group
      updatePart(partIndex, {
        flowChartQuestions: part.flowChartQuestions?.filter(q => q.groupId !== question.groupId)
      })
    } else {
      // Remove single question
      updatePart(partIndex, {
        flowChartQuestions: part.flowChartQuestions?.filter(q => q.id !== questionId)
      })
    }
  }
  
  // Get all questions for a flow chart group
  const getFlowChartGroupQuestions = (partIndex: number, groupId: string): FlowChartQuestion[] => {
    const part = parts[partIndex]
    return part.flowChartQuestions?.filter(q => q.groupId === groupId) || []
  }
  
  // Get flow chart group data (image and all fields)
  const getFlowChartGroupData = (partIndex: number, groupId: string): { imageUrl: string; fields: ChartField[] } | null => {
    const questions = getFlowChartGroupQuestions(partIndex, groupId)
    if (questions.length === 0) return null
    
    return {
      imageUrl: questions[0].imageUrl,
      fields: questions.map(q => q.field)
    }
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

      // Validate parts - only validate parts that have questions (parts are optional)
      let hasAtLeastOnePart = false
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        
        // Check if this part has any questions
        const hasFillRows = part.fillRows && part.fillRows.length > 0
        const hasSingleChoice = part.singleChoice && part.singleChoice.length > 0
        const hasMatching = part.matchingItems && part.matchingItems.length > 0
        const hasMatchingInformation = part.matchingInformationQuestions && part.matchingInformationQuestions.length > 0
        const hasFlowChart = part.flowChartQuestions && part.flowChartQuestions.length > 0
        const hasTableCompletion = part.tableCompletionQuestions && part.tableCompletionQuestions.length > 0
        const hasQuestions = hasFillRows || hasSingleChoice || hasMatching || hasMatchingInformation || hasFlowChart || hasTableCompletion
        
        // Skip validation for empty parts
        if (!hasQuestions) {
          continue
        }
        
        hasAtLeastOnePart = true
        
        // Validate part title only if it has questions
        if (!part.title.trim()) {
          throw new Error(`Part ${i + 1} title is required`)
        }

        // Validate flow chart questions if they exist
        if (part.flowChartQuestions && part.flowChartQuestions.length > 0) {
          // Group questions by groupId
          const groups = new Map<string, FlowChartQuestion[]>()
          part.flowChartQuestions.forEach(q => {
            const gid = q.groupId || q.id
            if (!groups.has(gid)) {
              groups.set(gid, [])
            }
            groups.get(gid)!.push(q)
          })
          
          for (const [groupId, questions] of groups.entries()) {
            if (questions.length === 0) continue
            
            const firstQuestion = questions[0]
            if (!firstQuestion.imageUrl.trim()) {
              throw new Error(`Part ${i + 1}, Flow Chart Group: Image is required`)
            }
            
            // Validate that each question (field) has a value (correct answer)
            for (const q of questions) {
              if (!q.field.value || !q.field.value.trim()) {
                throw new Error(`Part ${i + 1}, Question ${q.questionNumber}: Correct answer is required`)
              }
            }
          }
        }

        if (i === 0 || i === 3) {
          // Part 1 & 4: Fill-in-the-blank (or flow chart)
          if (part.fillRows) {
          for (const row of part.fillRows) {
            if (!row.correctAnswer || (Array.isArray(row.correctAnswer) && row.correctAnswer.length === 0)) {
              throw new Error(`Part ${i + 1}, Question ${row.questionNumber}: Correct answer is required`)
            }
          }
          }
        } else {
          // Part 2 & 3: Single choice, matching, or flow chart
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

          if (part.matchingInformationQuestions && part.matchingInformationQuestions.length > 0) {
            if (!part.matchingInformationOptions || part.matchingInformationOptions.length === 0) {
              throw new Error(`Part ${i + 1}: Matching information options are required when there are matching information questions`)
            }
            for (const miq of part.matchingInformationQuestions) {
              if (!miq.questionText.trim()) {
                throw new Error(`Part ${i + 1}, Question ${miq.questionNumber}: Question text is required`)
              }
              if (!miq.correctAnswer.trim()) {
                throw new Error(`Part ${i + 1}, Question ${miq.questionNumber}: Correct answer is required`)
              }
            }
          }
        }
      }

      // Ensure at least one part has questions
      if (!hasAtLeastOnePart) {
        throw new Error('At least one part must have questions')
      }

      // Transform data for API - only include parts that have questions
      const transformedParts = parts
        .map((part, partIndex) => {
        const questions: any[] = []

          // Add flow chart questions (one per field)
          // Each field becomes its own question
          part.flowChartQuestions?.forEach(fc => {
            questions.push({
              number: fc.questionNumber,
              type: 'FLOW_CHART',
              imageUrl: fc.imageUrl,
              field: fc.field, // Single field per question
              groupId: fc.groupId, // Group ID to link questions from same flow chart
              correctAnswer: fc.field?.value || '' // Use field.value as the correct answer
            })
          })
          
          // Add TABLE_COMPLETION questions
          part.tableCompletionQuestions?.forEach(tc => {
            // Extract blank IDs from table structure to determine which blank this question represents
            const tableStructure = tc.tableStructure
            const blankIds: number[] = []
            if (tableStructure) {
              tableStructure.rows.forEach(row => {
                (row.columns || []).forEach(column => {
                  column.forEach(cell => {
                    if (cell.type === 'blank' && cell.blankId !== undefined) {
                      blankIds.push(cell.blankId)
                    }
                  })
                })
              })
            }
            blankIds.sort((a, b) => a - b)
            
            // Find which blank this question corresponds to based on question order
            const sortedQuestions = part.tableCompletionQuestions
              ?.filter(t => t.groupId === tc.groupId)
              .sort((a, b) => a.questionNumber - b.questionNumber) || []
            const questionIndex = sortedQuestions.findIndex(t => t.id === tc.id)
            const blankId = blankIds[questionIndex]
            
            // Extract the correct answer for this specific blank
            // First try to get from tc.answers[blankId], fallback to empty string
            let answer = ''
            if (blankId !== undefined && tc.answers) {
              answer = tc.answers[blankId] || ''
            }
            
            // Ensure answers object exists
            const answersObject = tc.answers || {}
            
            questions.push({
              number: tc.questionNumber,
              type: 'TABLE_COMPLETION',
              answers: answersObject, // Store all answers for the group (keyed by blankId)
              tableStructure: tc.tableStructure, // Store table structure
              groupId: tc.groupId, // Group ID to link questions from same table
              correctAnswer: answer // The answer for this specific blank (stored in ListeningAnswer table)
            })
          })

        if (partIndex === 0) {
          // Part 1: Fill-in-the-blank (TEXT type)
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
        } else if (partIndex === 3) {
          // Part 4: Notes completion - extract questions from notesSections
          // Questions are extracted from notesSections structure, correct answers come from correctAnswers map
          // The notesSections structure itself is preserved and stored separately
          if (part.notesSections && Array.isArray(part.notesSections)) {
            const extractQuestionsFromNotes = (notes: any[]): void => {
              notes.forEach((section: any) => {
                if (section.items) {
                  section.items.forEach((item: any) => {
                    if (item.q !== null && item.q !== undefined) {
                      questions.push({
                        number: item.q,
                        type: 'TEXT',
                        textPrefix: item.prefix || '',
                        textSuffix: item.suffix || '',
                        correctAnswer: '' // Will be filled from correctAnswers map in API
                      })
                    }
                    if (item.children) {
                      extractQuestionsFromNotes([{ items: item.children }])
                    }
                  })
                }
                if (section.subsections) {
                  section.subsections.forEach((sub: any) => {
                    if (sub.items) {
                      sub.items.forEach((item: any) => {
                        if (item.q !== null && item.q !== undefined) {
                          questions.push({
                            number: item.q,
                            type: 'TEXT',
                            textPrefix: item.prefix || '',
                            textSuffix: item.suffix || '',
                            correctAnswer: '' // Will be filled from correctAnswers map in API
                          })
                        }
                      })
                    }
                  })
                }
              })
            }
            extractQuestionsFromNotes(part.notesSections)
          }
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

          part.matchingInformationQuestions?.forEach(miq => {
            questions.push({
              number: miq.questionNumber,
              type: 'MATCHING_INFORMATION',
              questionText: miq.questionText,
              correctAnswer: miq.correctAnswer,
              groupId: miq.groupId
            })
          })
        }

          // Sort questions by number
          questions.sort((a, b) => a.number - b.number)

          // Check if part has any questions
          const hasQuestions = questions.length > 0

        return {
          index: part.index,
          title: part.title,
          prompt: part.prompt,
          sectionTitle: part.sectionTitle || null,
          courseRequired: part.courseRequired || null,
      matchingHeading: part.matchingHeading || null,
      matchingOptions: part.matchingOptions || null,
      matchingInformationStimulus: part.matchingInformationStimulus || null,
          matchingInformationOptions: part.matchingInformationOptions || null,
          singleChoiceTitle: part.singleChoiceTitle || null,
          notesSections: part.notesSections || null,
            questions,
            hasQuestions
        }
      })
        .filter(part => part.hasQuestions) // Only include parts with questions
        .map(({ hasQuestions, ...part }) => part) // Remove hasQuestions flag

      if (!totalTimeMinutes || totalTimeMinutes <= 0) {
        throw new Error('Total time must be greater than 0 minutes')
      }

      const payload = {
        title,
        audioSource,
        totalTimeMinutes,
        instructions,
        readingTestId: readingTestId || null,
        parts: transformedParts
      }

      const url = mode === 'edit' && testId 
        ? `${apiEndpoint}/${testId}`
        : apiEndpoint
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let errorMessage = `Failed to ${mode === 'edit' ? 'update' : 'create'} listening test`
        
        if (contentType && contentType.includes('application/json')) {
          try {
        const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            console.error('Error parsing JSON error response:', e)
          }
        } else {
          // Response is not JSON (likely HTML error page)
          const text = await response.text()
          console.error('Non-JSON error response:', text.substring(0, 200))
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setMessage({
        type: 'success',
        text: `Listening test "${result.listeningTest?.title || title}" ${mode === 'edit' ? 'updated' : 'created'} successfully!${onSuccess ? '' : ' Redirecting...'}`
      })

      if (onSuccess) {
        onSuccess()
      } else {
        setTimeout(() => {
          router.push('/admin/listening-tests')
        }, 2000)
      }
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
            <label htmlFor="total-time" className="block text-sm font-medium text-gray-700 mb-2">
              Total Time (minutes)
            </label>
            <input
              type="number"
              id="total-time"
              min={5}
              max={120}
              value={totalTimeMinutes}
              onChange={(e) => setTotalTimeMinutes(Math.max(1, Number.parseInt(e.target.value) || 0))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="30"
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
      {parts.map((part, partIndex) => {
        // Check if part has any questions
        const hasFillRows = part.fillRows && part.fillRows.length > 0
        const hasSingleChoice = part.singleChoice && part.singleChoice.length > 0
        const hasMatching = part.matchingItems && part.matchingItems.length > 0
        const hasMatchingInformation = part.matchingInformationQuestions && part.matchingInformationQuestions.length > 0
        const hasFlowChart = part.flowChartQuestions && part.flowChartQuestions.length > 0
        const hasTableCompletion = part.tableCompletionQuestions && part.tableCompletionQuestions.length > 0
        const hasNotesSections = part.notesSections && Array.isArray(part.notesSections) && part.notesSections.length > 0
        const hasQuestions = hasFillRows || hasSingleChoice || hasMatching || hasMatchingInformation || hasFlowChart || hasTableCompletion || hasNotesSections
        
        return (
        <div key={partIndex} className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{part.title}</h3>
            {!hasQuestions && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Optional - No questions yet
              </span>
            )}
          </div>
          
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
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Question Number
                            </label>
                            <input
                              type="number"
                              value={row.questionNumber}
                              onChange={(e) => updateFillRow(partIndex, row.id, { questionNumber: parseInt(e.target.value) || 0 })}
                            className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Correct Answer <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={Array.isArray(row.correctAnswer) ? row.correctAnswer.join(', ') : row.correctAnswer}
                              onChange={(e) => {
                                const answers = e.target.value.split(',').map(a => a.trim()).filter(a => a)
                                updateFillRow(partIndex, row.id, { correctAnswer: answers.length === 1 ? answers[0] : answers })
                              }}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter correct answer (comma-separated for alternatives)"
                            />
                          <p className="mt-1 text-xs text-gray-500">
                            Enter the correct answer. For multiple acceptable answers, separate them with commas (e.g., "answer1, answer2").
                          </p>
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

            {partIndex === 3 && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Notes Completion Structure
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const currentNotes = part.notesSections || []
                        const newSection = {
                          heading: '',
                          items: []
                        }
                        updatePart(partIndex, { notesSections: [...currentNotes, newSection] })
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Section
                    </button>
                  </div>
                  <div className="space-y-4">
                    {Array.isArray(part.notesSections) && part.notesSections.map((section: any, sectionIndex: number) => (
                      <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Section Heading
                          </label>
                          <input
                            type="text"
                            value={section.heading || ''}
                            onChange={(e) => {
                              const updatedNotes = [...(part.notesSections || [])]
                              updatedNotes[sectionIndex] = { ...section, heading: e.target.value }
                              updatePart(partIndex, { notesSections: updatedNotes })
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="e.g., Why do we need theory?"
                          />
                        </div>

                        {/* Subsections */}
                        {section.subsections && Array.isArray(section.subsections) && section.subsections.length > 0 && (
                          <div className="mb-3 space-y-3">
                            {section.subsections.map((subsection: any, subIndex: number) => (
                              <div key={subIndex} className="border border-gray-100 rounded p-3 bg-gray-50">
                                <div className="mb-2">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Subsection Title
                                  </label>
                                  <input
                                    type="text"
                                    value={subsection.title || ''}
                                    onChange={(e) => {
                                      const updatedNotes = [...(part.notesSections || [])]
                                      const updatedSubsections = [...(section.subsections)]
                                      updatedSubsections[subIndex] = { ...subsection, title: e.target.value }
                                      updatedNotes[sectionIndex] = { ...section, subsections: updatedSubsections }
                                      updatePart(partIndex, { notesSections: updatedNotes })
                                    }}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  {subsection.items && Array.isArray(subsection.items) && subsection.items.map((item: any, itemIndex: number) => (
                                    <div key={itemIndex} className="flex gap-2 items-start">
                                      <div className="flex-1 grid grid-cols-3 gap-2">
                                        <input
                                          type="number"
                                          placeholder="Q number (or leave empty)"
                                          value={item.q ?? ''}
                                          onChange={(e) => {
                                            const updatedNotes = [...(part.notesSections || [])]
                                            const updatedSubsections = [...(section.subsections)]
                                            const updatedItems = [...subsection.items]
                                            updatedItems[itemIndex] = { ...item, q: e.target.value ? parseInt(e.target.value) : null }
                                            updatedSubsections[subIndex] = { ...subsection, items: updatedItems }
                                            updatedNotes[sectionIndex] = { ...section, subsections: updatedSubsections }
                                            updatePart(partIndex, { notesSections: updatedNotes })
                                          }}
                                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        />
                                        <input
                                          type="text"
                                          placeholder="Prefix text"
                                          value={item.prefix || ''}
                                          onChange={(e) => {
                                            const updatedNotes = [...(part.notesSections || [])]
                                            const updatedSubsections = [...(section.subsections)]
                                            const updatedItems = [...subsection.items]
                                            updatedItems[itemIndex] = { ...item, prefix: e.target.value }
                                            updatedSubsections[subIndex] = { ...subsection, items: updatedItems }
                                            updatedNotes[sectionIndex] = { ...section, subsections: updatedSubsections }
                                            updatePart(partIndex, { notesSections: updatedNotes })
                                          }}
                                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        />
                                        <input
                                          type="text"
                                          placeholder="Suffix text"
                                          value={item.suffix || ''}
                                          onChange={(e) => {
                                            const updatedNotes = [...(part.notesSections || [])]
                                            const updatedSubsections = [...(section.subsections)]
                                            const updatedItems = [...subsection.items]
                                            updatedItems[itemIndex] = { ...item, suffix: e.target.value }
                                            updatedSubsections[subIndex] = { ...subsection, items: updatedItems }
                                            updatedNotes[sectionIndex] = { ...section, subsections: updatedSubsections }
                                            updatePart(partIndex, { notesSections: updatedNotes })
                                          }}
                                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        />
                                      </div>
                                      <input
                                        type="text"
                                        placeholder="Informational text (if no Q number)"
                                        value={item.text || ''}
                                        onChange={(e) => {
                                          const updatedNotes = [...(part.notesSections || [])]
                                          const updatedSubsections = [...(section.subsections)]
                                          const updatedItems = [...subsection.items]
                                          updatedItems[itemIndex] = { ...item, text: e.target.value }
                                          updatedSubsections[subIndex] = { ...subsection, items: updatedItems }
                                          updatedNotes[sectionIndex] = { ...section, subsections: updatedSubsections }
                                          updatePart(partIndex, { notesSections: updatedNotes })
                                        }}
                                        className="flex-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedNotes = [...(part.notesSections || [])]
                                          const updatedSubsections = [...(section.subsections)]
                                          const updatedItems = subsection.items.filter((_: any, i: number) => i !== itemIndex)
                                          updatedSubsections[subIndex] = { ...subsection, items: updatedItems }
                                          updatedNotes[sectionIndex] = { ...section, subsections: updatedSubsections }
                                          updatePart(partIndex, { notesSections: updatedNotes })
                                        }}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedNotes = [...(part.notesSections || [])]
                                      const updatedSubsections = [...(section.subsections)]
                                      const updatedItems = [...(subsection.items || []), { q: null, prefix: '', suffix: '', text: '' }]
                                      updatedSubsections[subIndex] = { ...subsection, items: updatedItems }
                                      updatedNotes[sectionIndex] = { ...section, subsections: updatedSubsections }
                                      updatePart(partIndex, { notesSections: updatedNotes })
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    + Add Item
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const updatedNotes = [...(part.notesSections || [])]
                                const updatedSubsections = [...(section.subsections || []), { title: '', items: [] }]
                                updatedNotes[sectionIndex] = { ...section, subsections: updatedSubsections }
                                updatePart(partIndex, { notesSections: updatedNotes })
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              + Add Subsection
                            </button>
                          </div>
                        )}

                        {/* Items */}
                        {section.items && Array.isArray(section.items) && section.items.length > 0 && (
                          <div className="mb-3 space-y-2">
                            {section.items.map((item: any, itemIndex: number) => (
                              <div key={itemIndex} className="space-y-2">
                                <div className="flex gap-2 items-start">
                                  <div className="flex-1 grid grid-cols-3 gap-2">
                                    <input
                                      type="number"
                                      placeholder="Q number (or leave empty)"
                                      value={item.q ?? ''}
                                      onChange={(e) => {
                                        const updatedNotes = [...(part.notesSections || [])]
                                        const updatedItems = [...section.items]
                                        updatedItems[itemIndex] = { ...item, q: e.target.value ? parseInt(e.target.value) : null }
                                        updatedNotes[sectionIndex] = { ...section, items: updatedItems }
                                        updatePart(partIndex, { notesSections: updatedNotes })
                                      }}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Prefix text"
                                      value={item.prefix || ''}
                                      onChange={(e) => {
                                        const updatedNotes = [...(part.notesSections || [])]
                                        const updatedItems = [...section.items]
                                        updatedItems[itemIndex] = { ...item, prefix: e.target.value }
                                        updatedNotes[sectionIndex] = { ...section, items: updatedItems }
                                        updatePart(partIndex, { notesSections: updatedNotes })
                                      }}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Suffix text"
                                      value={item.suffix || ''}
                                      onChange={(e) => {
                                        const updatedNotes = [...(part.notesSections || [])]
                                        const updatedItems = [...section.items]
                                        updatedItems[itemIndex] = { ...item, suffix: e.target.value }
                                        updatedNotes[sectionIndex] = { ...section, items: updatedItems }
                                        updatePart(partIndex, { notesSections: updatedNotes })
                                      }}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Informational text (if no Q number)"
                                    value={item.text || ''}
                                    onChange={(e) => {
                                      const updatedNotes = [...(part.notesSections || [])]
                                      const updatedItems = [...section.items]
                                      updatedItems[itemIndex] = { ...item, text: e.target.value }
                                      updatedNotes[sectionIndex] = { ...section, items: updatedItems }
                                      updatePart(partIndex, { notesSections: updatedNotes })
                                    }}
                                    className="flex-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedNotes = [...(part.notesSections || [])]
                                      const updatedItems = section.items.filter((_: any, i: number) => i !== itemIndex)
                                      updatedNotes[sectionIndex] = { ...section, items: updatedItems }
                                      updatePart(partIndex, { notesSections: updatedNotes })
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    Remove
                                  </button>
                                </div>
                                {/* Children items */}
                                {item.children && Array.isArray(item.children) && item.children.length > 0 && (
                                  <div className="ml-4 border-l-2 border-gray-200 pl-3 space-y-2">
                                    {item.children.map((child: any, childIndex: number) => (
                                      <div key={childIndex} className="flex gap-2 items-start">
                                        <div className="flex-1 grid grid-cols-3 gap-2">
                                          <input
                                            type="number"
                                            placeholder="Q number (or leave empty)"
                                            value={child.q ?? ''}
                                            onChange={(e) => {
                                              const updatedNotes = [...(part.notesSections || [])]
                                              const updatedItems = [...section.items]
                                              const updatedChildren = [...item.children]
                                              updatedChildren[childIndex] = { ...child, q: e.target.value ? parseInt(e.target.value) : null }
                                              updatedItems[itemIndex] = { ...item, children: updatedChildren }
                                              updatedNotes[sectionIndex] = { ...section, items: updatedItems }
                                              updatePart(partIndex, { notesSections: updatedNotes })
                                            }}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                          />
                                          <input
                                            type="text"
                                            placeholder="Prefix text"
                                            value={child.prefix || ''}
                                            onChange={(e) => {
                                              const updatedNotes = [...(part.notesSections || [])]
                                              const updatedItems = [...section.items]
                                              const updatedChildren = [...item.children]
                                              updatedChildren[childIndex] = { ...child, prefix: e.target.value }
                                              updatedItems[itemIndex] = { ...item, children: updatedChildren }
                                              updatedNotes[sectionIndex] = { ...section, items: updatedItems }
                                              updatePart(partIndex, { notesSections: updatedNotes })
                                            }}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                          />
                                          <input
                                            type="text"
                                            placeholder="Suffix text"
                                            value={child.suffix || ''}
                                            onChange={(e) => {
                                              const updatedNotes = [...(part.notesSections || [])]
                                              const updatedItems = [...section.items]
                                              const updatedChildren = [...item.children]
                                              updatedChildren[childIndex] = { ...child, suffix: e.target.value }
                                              updatedItems[itemIndex] = { ...item, children: updatedChildren }
                                              updatedNotes[sectionIndex] = { ...section, items: updatedItems }
                                              updatePart(partIndex, { notesSections: updatedNotes })
                                            }}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                          />
                                        </div>
                                        <input
                                          type="text"
                                          placeholder="Informational text (if no Q number)"
                                          value={child.text || ''}
                                          onChange={(e) => {
                                            const updatedNotes = [...(part.notesSections || [])]
                                            const updatedItems = [...section.items]
                                            const updatedChildren = [...item.children]
                                            updatedChildren[childIndex] = { ...child, text: e.target.value }
                                            updatedItems[itemIndex] = { ...item, children: updatedChildren }
                                            updatedNotes[sectionIndex] = { ...section, items: updatedItems }
                                            updatePart(partIndex, { notesSections: updatedNotes })
                                          }}
                                          className="flex-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedNotes = [...(part.notesSections || [])]
                                            const updatedItems = [...section.items]
                                            const updatedChildren = item.children.filter((_: any, i: number) => i !== childIndex)
                                            updatedItems[itemIndex] = { ...item, children: updatedChildren }
                                            updatedNotes[sectionIndex] = { ...section, items: updatedItems }
                                            updatePart(partIndex, { notesSections: updatedNotes })
                                          }}
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedNotes = [...(part.notesSections || [])]
                                        const updatedItems = [...section.items]
                                        const updatedChildren = [...(item.children || []), { q: null, prefix: '', suffix: '', text: '' }]
                                        updatedItems[itemIndex] = { ...item, children: updatedChildren }
                                        updatedNotes[sectionIndex] = { ...section, items: updatedItems }
                                        updatePart(partIndex, { notesSections: updatedNotes })
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      + Add Child Item
                                    </button>
                                  </div>
                                )}
                                {!item.children && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedNotes = [...(part.notesSections || [])]
                                      const updatedItems = [...section.items]
                                      updatedItems[itemIndex] = { ...item, children: [] }
                                      updatedNotes[sectionIndex] = { ...section, items: updatedItems }
                                      updatePart(partIndex, { notesSections: updatedNotes })
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 ml-4"
                                  >
                                    + Add Children
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const updatedNotes = [...(part.notesSections || [])]
                                const updatedItems = [...(section.items || []), { q: null, prefix: '', suffix: '', text: '' }]
                                updatedNotes[sectionIndex] = { ...section, items: updatedItems }
                                updatePart(partIndex, { notesSections: updatedNotes })
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              + Add Item
                            </button>
                          </div>
                        )}

                        {(!section.items || section.items.length === 0) && (!section.subsections || section.subsections.length === 0) && (
                          <div className="mb-3">
                            <button
                              type="button"
                              onClick={() => {
                                const updatedNotes = [...(part.notesSections || [])]
                                const updatedItems = [{ q: null, prefix: '', suffix: '', text: '' }]
                                updatedNotes[sectionIndex] = { ...section, items: updatedItems }
                                updatePart(partIndex, { notesSections: updatedNotes })
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              + Add Items to this Section
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedNotes = [...(part.notesSections || [])]
                                const updatedSubsections = [{ title: '', items: [] }]
                                updatedNotes[sectionIndex] = { ...section, subsections: updatedSubsections }
                                updatePart(partIndex, { notesSections: updatedNotes })
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 ml-4"
                            >
                              + Add Subsections
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const updatedNotes = (part.notesSections || []).filter((_: any, i: number) => i !== sectionIndex)
                            updatePart(partIndex, { notesSections: updatedNotes })
                          }}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove Section
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
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Single Choice Questions Title
                    </label>
                    <input
                      type="text"
                      value={part.singleChoiceTitle || ''}
                      onChange={(e) => updatePart(partIndex, { singleChoiceTitle: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g., Questions 11-15 — Choose the correct letter, A, B or C."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This title will be displayed above all single choice questions in this part.
                    </p>
                  </div>
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

                {/* Matching Information Questions */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Matching Information Questions
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Questions where students match information to options (e.g., paragraphs A-H).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addMatchingInformationQuestion(partIndex)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Question
                    </button>
                  </div>

                  {/* Matching Information Options */}
                  {part.matchingInformationQuestions && part.matchingInformationQuestions.length > 0 && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Matching Information Options (e.g., A, B, C, D, E, F, G, H)
                        </label>
                        <button
                          type="button"
                          onClick={() => addMatchingInformationOption(partIndex)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Add Option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {part.matchingInformationOptions?.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 min-w-[30px]">
                              {option}.
                            </span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateMatchingInformationOption(partIndex, optIndex, e.target.value)}
                              className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Enter option letter (A, B, C, etc.)"
                            />
                            <button
                              type="button"
                              onClick={() => removeMatchingInformationOption(partIndex, optIndex)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      {(!part.matchingInformationOptions || part.matchingInformationOptions.length === 0) && (
                        <p className="text-xs text-gray-500 mt-2">
                          Add at least one option (e.g., A, B, C, D) for students to choose from.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Matching Information Stimulus */}
                  {part.matchingInformationQuestions && part.matchingInformationQuestions.length > 0 && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stimulus (Context/Instructions for Matching Information Questions)
                      </label>
                      <div className="border border-gray-300 rounded-md">
                        <Editor
                          apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                          value={part.matchingInformationStimulus || ''}
                          onEditorChange={(content: string) => updatePart(partIndex, { matchingInformationStimulus: content })}
                          init={{
                            height: 300,
                            menubar: false,
                            plugins: [
                              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                            ],
                            toolbar: 'undo redo | blocks | ' +
                              'bold italic forecolor | alignleft aligncenter ' +
                              'alignright alignjustify | bullist numlist outdent indent | ' +
                              'removeformat | help | image',
                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                            images_upload_handler: async (blobInfo: any, progress: any) => {
                              return new Promise((resolve, reject) => {
                                const formData = new FormData()
                                formData.append('image', blobInfo.blob(), blobInfo.filename())
                                
                                fetch('/api/admin/upload-image', {
                                  method: 'POST',
                                  body: formData,
                                })
                                .then(response => response.json())
                                .then(result => {
                                  if (result.url) {
                                    resolve(result.url)
                                  } else {
                                    reject(result.error || 'Upload failed')
                                  }
                                })
                                .catch(error => {
                                  reject('Upload failed: ' + error.message)
                                })
                              })
                            },
                            automatic_uploads: true,
                            file_picker_types: 'image',
                            branding: false,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        This content will be displayed above the matching information questions in the student portal. You can add images, format text, and include instructions.
                      </p>
                    </div>
                  )}

                  {/* Matching Information Questions List */}
                  <div className="space-y-3">
                    {(() => {
                      // Group questions by groupId
                      const groups = new Map<string, MatchingInformationQuestion[]>()
                      part.matchingInformationQuestions?.forEach(q => {
                        const gid = q.groupId || q.id
                        if (!groups.has(gid)) {
                          groups.set(gid, [])
                        }
                        groups.get(gid)!.push(q)
                      })
                      
                      return Array.from(groups.entries()).map(([groupId, questions]) => {
                        const sortedQuestions = [...questions].sort((a, b) => a.questionNumber - b.questionNumber)
                        const firstQuestion = sortedQuestions[0]
                        const lastQuestion = sortedQuestions[sortedQuestions.length - 1]
                        
                        return (
                          <div key={groupId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-700">
                                Questions {firstQuestion.questionNumber}{sortedQuestions.length > 1 ? `-${lastQuestion.questionNumber}` : ''}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMatchingInformationQuestion(partIndex, firstQuestion.id)}
                                className="text-sm text-red-600 hover:text-red-800"
                              >
                                Remove Group
                              </button>
                            </div>
                            
                            {sortedQuestions.map((miq) => (
                              <div key={miq.id} className="mb-3 last:mb-0 p-3 bg-white rounded border border-gray-200">
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Question Number
                                    </label>
                                    <input
                                      type="number"
                                      value={miq.questionNumber}
                                      onChange={(e) => updateMatchingInformationQuestion(partIndex, miq.id, { questionNumber: parseInt(e.target.value) || 0 })}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Correct Answer <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                      value={miq.correctAnswer}
                                      onChange={(e) => updateMatchingInformationQuestion(partIndex, miq.id, { correctAnswer: e.target.value })}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    >
                                      <option value="">Select answer</option>
                                      {part.matchingInformationOptions?.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Question Text <span className="text-red-500">*</span>
                                  </label>
                                  <textarea
                                    value={miq.questionText}
                                    onChange={(e) => updateMatchingInformationQuestion(partIndex, miq.id, { questionText: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    rows={2}
                                    placeholder="e.g., information about the main topic"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMatchingInformationQuestion(partIndex, miq.id)}
                                  className="text-sm text-red-600 hover:text-red-800"
                                >
                                  Remove Question
                                </button>
                              </div>
                            ))}
                            
                            <button
                              type="button"
                              onClick={() => addMatchingInformationQuestion(partIndex, groupId)}
                              className="text-sm text-blue-600 hover:text-blue-800 mt-2"
                            >
                              + Add Question to Group
                            </button>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              </>
            )}

            {/* Flow Chart Completion Questions (Available for all parts) */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Flow Chart Completion Questions
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Each blank field becomes a separate question. Create a flow chart with multiple blanks.
                  </p>
          </div>
                <button
                  type="button"
                  onClick={() => addFlowChartGroup(partIndex)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Flow Chart
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Group questions by groupId and show one editor per group */}
                {(() => {
                  // Group questions by groupId
                  const groups = new Map<string, FlowChartQuestion[]>()
                  part.flowChartQuestions?.forEach(q => {
                    const gid = q.groupId || q.id
                    if (!groups.has(gid)) {
                      groups.set(gid, [])
                    }
                    groups.get(gid)!.push(q)
                  })
                  
                  return Array.from(groups.entries()).map(([groupId, questions]) => {
                    const firstQuestion = questions[0]
                    const groupData = getFlowChartGroupData(partIndex, groupId)
                    const imageUrl = groupData?.imageUrl || firstQuestion.imageUrl || ''
                    const fields = groupData?.fields || questions.map(q => q.field)
                    const startQuestionNumber = Math.min(...questions.map(q => q.questionNumber))
                    
                    return (
                      <div key={groupId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Starting Question Number
                              </label>
                              <input
                                type="number"
                                value={startQuestionNumber}
                                onChange={(e) => {
                                  const newStart = parseInt(e.target.value) || 0
                                  const diff = newStart - startQuestionNumber
                                  questions.forEach(q => {
                                    updateFlowChartQuestion(partIndex, q.id, { 
                                      questionNumber: q.questionNumber + diff 
                                    })
                                  })
                                }}
                                className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                            </div>
                            <div className="text-sm text-gray-600">
                              {questions.length > 0 ? (
                                <>
                                  {questions.length} question{questions.length !== 1 ? 's' : ''} (Questions {startQuestionNumber}–{startQuestionNumber + questions.length - 1})
                                </>
                              ) : (
                                'No questions created yet. Create fields and click "Save Fields" to generate questions.'
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFlowChartQuestion(partIndex, firstQuestion.id)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Remove Flow Chart
                            </button>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Image URL <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => {
                              const newUrl = e.target.value
                              // Update imageUrl for all questions in the group
                              questions.forEach(q => {
                                updateFlowChartQuestion(partIndex, q.id, { imageUrl: newUrl })
                              })
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter image URL or upload image"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            You can paste an image URL here, or upload an image using the editor below
                          </p>
                        </div>

                        <div>
                          <ImageChartEditor
                            defaultFieldWidth={140}
                            initialImageUrl={imageUrl}
                            initialFields={fields}
                            onImageChange={(newImageUrl) => {
                              // Update imageUrl for all questions in the group
                              questions.forEach(q => {
                                updateFlowChartQuestion(partIndex, q.id, { imageUrl: newImageUrl })
                              })
                            }}
                            onSave={(newFields) => {
                              // Save fields - each field becomes a question
                              // Use the current imageUrl from the input or from the first question
                              const currentImageUrl = imageUrl || firstQuestion.imageUrl || ''
                              saveFlowChartFields(partIndex, groupId, currentImageUrl, newFields)
                            }}
                          />
                          <div className="mt-2 text-xs text-gray-500">
                            <strong>Note:</strong> Upload an image, click on it to create input fields. 
                            Each field you create will become a separate question. Click "Save Fields" to create the questions.
                          </div>
                        </div>

                        {/* Preview View Toggle */}
                        {questions.length > 0 && imageUrl && (
                          <div className="mt-4 pt-4 border-t border-gray-300">
                            <FlowChartPreview
                              imageUrl={imageUrl}
                              questions={questions}
                            />
                          </div>
                        )}

                        {/* Show individual questions if they exist */}
                        {questions.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-300">
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Individual Questions ({questions.length})
                            </label>
                            <div className="space-y-2">
                              {questions.map((q) => (
                                <div key={q.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm font-medium text-gray-700">
                                      Question {q.questionNumber}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Answer: {q.field.value || '(empty)'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      Position: ({Math.round(q.field.x)}, {Math.round(q.field.y)})
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Remove just this question
                                      const remaining = questions.filter(q2 => q2.id !== q.id)
                                      if (remaining.length === 0) {
                                        // If last question, remove the whole group
                                        removeFlowChartQuestion(partIndex, q.id)
                                      } else {
                                        // Remove just this question
                                        updatePart(partIndex, {
                                          flowChartQuestions: part.flowChartQuestions?.filter(q2 => q2.id !== q.id)
                                        })
                                      }
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800"
                                  >
                                    Remove
                                  </button>
        </div>
      ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

            {/* Table Completion Questions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Table Completion Questions
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Create a table with blank fields. Each blank becomes a separate question.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const part = parts[partIndex]
                    const existingQuestions = [
                      ...(part.fillRows || []),
                      ...(part.singleChoice || []),
                      ...(part.matchingItems || []),
                      ...(part.flowChartQuestions || []),
                      ...(part.tableCompletionQuestions || [])
                    ]
                    const startNumber = partIndex === 0 ? 1 : partIndex === 1 ? 11 : partIndex === 2 ? 21 : 31
                    const maxQuestionNumber = existingQuestions.length > 0
                      ? Math.max(...existingQuestions.map(q => q.questionNumber))
                      : startNumber - 1
                    const nextQuestionNumber = maxQuestionNumber + 1
                    const groupId = `table-${Date.now()}`
                    
                    // Default table structure
                    const defaultStructure: TableStructure = {
                      title: 'TABLE TITLE',
                      columns: [
                        { label: 'Category', width: '30%' },
                        { label: 'Details', width: '70%' }
                      ],
                      rows: [
                        {
                          id: `row-${Date.now()}-1`,
                          columns: [
                            [{ id: `cell-${Date.now()}-1`, type: 'text', content: 'Category 1' }],
                            [
                              { id: `cell-${Date.now()}-2`, type: 'text', content: '• Item with ' },
                              { id: `cell-${Date.now()}-3`, type: 'blank', content: '', blankId: 1, width: 120 },
                              { id: `cell-${Date.now()}-4`, type: 'text', content: ' and more text.' }
                            ]
                          ]
                        }
                      ]
                    }
                    
                    // Count blanks in structure to create questions
                    let blankCount = 0
                    defaultStructure.rows.forEach(row => {
                      (row.columns || []).forEach(column => {
                        column.forEach(cell => {
                          if (cell.type === 'blank' && cell.blankId !== undefined) {
                            blankCount++
                          }
                        })
                      })
                    })
                    
                    // Create questions (one for each blank)
                    const newQuestions: TableCompletionQuestion[] = Array.from({ length: blankCount }, (_, i) => ({
                      id: `${groupId}-q${i + 1}`,
                      questionNumber: nextQuestionNumber + i,
                      answers: {},
                      groupId: groupId,
                      tableStructure: defaultStructure
                    }))
                    
                    updatePart(partIndex, {
                      tableCompletionQuestions: [...(part.tableCompletionQuestions || []), ...newQuestions]
                    })
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Table Completion
                </button>
              </div>
              
              <div className="space-y-6">
                {(() => {
                  // Group questions by groupId
                  const groups = new Map<string, TableCompletionQuestion[]>()
                  part.tableCompletionQuestions?.forEach(q => {
                    const gid = q.groupId || q.id
                    if (!groups.has(gid)) {
                      groups.set(gid, [])
                    }
                    groups.get(gid)!.push(q)
                  })
                  
                  return Array.from(groups.entries()).map(([groupId, questions]) => {
                    if (questions.length === 0) return null
                    const firstQuestion = questions[0]
                    if (!firstQuestion) return null
                    const startQuestionNumber = Math.min(...questions.map(q => q.questionNumber))
                    
                    // Get table structure from first question
                    const tableStructure: TableStructure = firstQuestion.tableStructure || {
                      title: 'TABLE TITLE',
                      columns: [{ label: '', width: '30%' }, { label: '' }],
                      rows: []
                    }
                    
                    // Collect all answers from all questions in the group
                    const allAnswers: Record<number, string> = {}
                    questions.forEach(q => {
                      if (q.answers) {
                        Object.keys(q.answers).forEach(key => {
                          allAnswers[Number(key)] = q.answers[Number(key)]
                        })
                      }
                    })
                    
                    // Map blank IDs to question numbers
                    const blankIds: number[] = []
                    tableStructure.rows.forEach(row => {
                      (row.columns || []).forEach(column => {
                        column.forEach(cell => {
                          if (cell.type === 'blank' && cell.blankId !== undefined) {
                            blankIds.push(cell.blankId)
                          }
                        })
                      })
                    })
                    blankIds.sort((a, b) => a - b)
                    
                    const questionNumberMap: Record<number, number> = {}
                    questions.sort((a, b) => a.questionNumber - b.questionNumber).forEach((q, index) => {
                      const blankId = blankIds[index]
                      if (blankId !== undefined) {
                        questionNumberMap[blankId] = q.questionNumber
                      }
                    })
                    
                    return (
                      <div key={groupId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Starting Question Number
                              </label>
                              <input
                                type="number"
                                value={startQuestionNumber}
                                onChange={(e) => {
                                  const newStart = parseInt(e.target.value) || 0
                                  const diff = newStart - startQuestionNumber
                                  questions.forEach(q => {
                                    updatePart(partIndex, {
                                      tableCompletionQuestions: part.tableCompletionQuestions?.map(tq => 
                                        tq.id === q.id ? { ...tq, questionNumber: tq.questionNumber + diff } : tq
                                      )
                                    })
                                  })
                                }}
                                className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                            </div>
                            <div className="text-sm text-gray-600">
                              {questions.length} question{questions.length !== 1 ? 's' : ''} (Questions {startQuestionNumber}–{startQuestionNumber + questions.length - 1})
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                updatePart(partIndex, {
                                  tableCompletionQuestions: part.tableCompletionQuestions?.filter(tq => tq.groupId !== groupId)
                                })
                              }}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Remove Table
                            </button>
                          </div>
                        </div>

                        {/* Table Structure Editor */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Table Structure Editor
                          </label>
                          <TableStructureEditor
                            structure={tableStructure}
                            onStructureChange={(newStructure) => {
                              // Update structure for all questions in the group
                              updatePart(partIndex, {
                                tableCompletionQuestions: part.tableCompletionQuestions?.map(tq => 
                                  tq.groupId === groupId
                                    ? { ...tq, tableStructure: newStructure }
                                    : tq
                                )
                              })
                              
                              // Recalculate questions based on blanks in new structure
                              const blankIds: number[] = []
                              newStructure.rows.forEach(row => {
                                (row.columns || []).forEach(column => {
                                  column.forEach(cell => {
                                    if (cell.type === 'blank' && cell.blankId !== undefined) {
                                      blankIds.push(cell.blankId)
                                    }
                                  })
                                })
                              })
                              blankIds.sort((a, b) => a - b)
                              
                              // Add or remove questions to match blank count
                              const currentCount = questions.length
                              const newCount = blankIds.length
                              
                              if (newCount > currentCount) {
                                // Add more questions
                                const newQuestions: TableCompletionQuestion[] = Array.from({ length: newCount - currentCount }, (_, i) => ({
                                  id: `${groupId}-q${currentCount + i + 1}`,
                                  questionNumber: startQuestionNumber + currentCount + i,
                                  answers: {},
                                  groupId: groupId,
                                  tableStructure: newStructure
                                }))
                                updatePart(partIndex, {
                                  tableCompletionQuestions: [...(part.tableCompletionQuestions || []), ...newQuestions]
                                })
                              } else if (newCount < currentCount) {
                                // Remove extra questions
                                updatePart(partIndex, {
                                  tableCompletionQuestions: part.tableCompletionQuestions?.filter(tq => {
                                    if (tq.groupId !== groupId) return true
                                    const questionIndex = questions.findIndex(q => q.id === tq.id)
                                    return questionIndex < newCount
                                  })
                                })
                              }
                            }}
                            questionNumbers={questionNumberMap}
                          />
                        </div>

                        {/* Table Preview & Answer Entry */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Table Preview & Answer Entry
                          </label>
                          <DynamicTableEditor
                            structure={tableStructure}
                            onStructureChange={() => {}} // Read-only in preview
                            initialAnswers={allAnswers}
                            onAnswersChange={(newAnswers) => {
                              // Update all questions in the group with the new answers
                              questions.forEach((q, index) => {
                                const blankId = blankIds[index]
                                if (blankId !== undefined) {
                                  const answerValue = newAnswers[blankId] || ''
                                  updatePart(partIndex, {
                                    tableCompletionQuestions: part.tableCompletionQuestions?.map(tq => 
                                      tq.id === q.id 
                                        ? { ...tq, answers: { ...tq.answers, [blankId]: answerValue } }
                                        : tq
                                    )
                                  })
                                }
                              })
                            }}
                            readOnly={false}
                            questionNumbers={questionNumberMap}
                          />
                        </div>

                        {/* Show individual questions with answer entry */}
                        {questions.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-300">
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Individual Questions & Correct Answers ({questions.length})
                            </label>
                            <div className="space-y-3">
                              {questions.map((q, index) => {
                                const blankId = blankIds[index]
                                const answerValue = blankId !== undefined ? (q.answers?.[blankId] || '') : ''
                                return (
                                  <div key={q.id} className="bg-white p-3 rounded border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-sm font-medium text-gray-700">
                                          Question {q.questionNumber}
                                      </span>
                                        {blankId !== undefined && (
                                      <span className="text-xs text-gray-500">
                                            (Blank #{blankId})
                                      </span>
                                        )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const remaining = questions.filter(q2 => q2.id !== q.id)
                                        if (remaining.length === 0) {
                                          updatePart(partIndex, {
                                            tableCompletionQuestions: part.tableCompletionQuestions?.filter(tq => tq.groupId !== groupId)
                                          })
                                        } else {
                                          updatePart(partIndex, {
                                            tableCompletionQuestions: part.tableCompletionQuestions?.filter(tq => tq.id !== q.id)
                                          })
                                        }
                                      }}
                                      className="text-xs text-red-600 hover:text-red-800"
                                    >
                                      Remove
                                    </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                                        Correct Answer:
                                      </label>
                                      <input
                                        type="text"
                                        value={answerValue}
                                        onChange={(e) => {
                                          if (blankId !== undefined) {
                                            updatePart(partIndex, {
                                              tableCompletionQuestions: part.tableCompletionQuestions?.map(tq => 
                                                tq.id === q.id 
                                                  ? { ...tq, answers: { ...tq.answers, [blankId]: e.target.value } }
                                                  : tq
                                              )
                                            })
                                          }
                                        }}
                                        placeholder="Enter correct answer"
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                      />
                                      {answerValue && (
                                        <span className="text-xs text-green-600">
                                          ✓ Saved
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        </div>
        )
      })}

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

