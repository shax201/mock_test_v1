'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save } from 'lucide-react'
import BasicTestInfo from '@/components/admin/sections/basic-test-info'
import PassageSection from '@/components/admin/sections/passage-section'
import BandScoreSection from '@/components/admin/sections/band-score-section'
import PassageConfigSection from '@/components/admin/sections/passage-config-section'
import QuestionSection from '@/components/admin/sections/question-section'

export default function EditReadingTestPage() {
  const router = useRouter()
  const params = useParams()
  const [testData, setTestData] = useState({
    title: '',
    totalQuestions: 40,
    totalTimeMinutes: 60,
    isActive: true,
  })
  const [passages, setPassages] = useState<any[]>([])
  const [bandScores, setBandScores] = useState<any[]>([])
  const [passageConfigs, setPassageConfigs] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [activeSection, setActiveSection] = useState('basic')
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [originalData, setOriginalData] = useState<any>(null)

  useEffect(() => {
    if (params.id) {
      fetchTestData()
    }
  }, [params.id])

  const fetchTestData = async () => {
    try {
      const response = await fetch(`/api/admin/reading-tests/${params.id}`)
      const data = await response.json()

      if (response.ok && data.readingTest) {
        const test = data.readingTest
        
        // Set basic test data
        setTestData({
          title: test.title || '',
          totalQuestions: test.totalQuestions || 40,
          totalTimeMinutes: test.totalTimeMinutes || 60,
          isActive: test.isActive !== undefined ? test.isActive : true,
        })

        // Transform passages
        const transformedPassages = (test.passages || []).map((passage: any, index: number) => ({
          id: Date.now() + index,
          title: passage.title || '',
          order: passage.order || index + 1,
          contents: (passage.contents || []).map((content: any) => ({
            contentId: content.contentId || '',
            text: content.text || '',
            order: content.order || 0
          }))
        }))
        setPassages(transformedPassages)

        // Transform questions - group flow chart questions by image
        const transformedQuestions: any[] = []
        test.passages.forEach((passage: any, passageIndex: number) => {
          // Separate flow chart questions from other questions
          const flowChartQuestions = (passage.questions || []).filter((q: any) => q.type === 'FLOW_CHART')
          const otherQuestions = (passage.questions || []).filter((q: any) => q.type !== 'FLOW_CHART')
          
          // Handle non-flow-chart questions
          otherQuestions.forEach((question: any) => {
            transformedQuestions.push({
              id: Date.now() + transformedQuestions.length,
              dbId: question.id, // Store database ID for deletion
              passageId: String(transformedPassages[passageIndex].id),
              questionNumber: question.questionNumber || 0,
              number: question.questionNumber || 0,
              type: question.type || 'multiple-choice',
              questionType: question.type || 'multiple-choice',
              questionText: question.questionText || '',
              text: question.questionText || '',
              options: question.options || [],
              headingsList: question.headingsList || [],
              summaryText: question.summaryText || '',
              subQuestions: question.subQuestions || [],
              imageUrl: question.imageUrl || '',
              field: question.field || null,
              fields: question.fields || (question.field ? [question.field] : []),
              points: question.points || 1,
              correctAnswer: question.correctAnswer?.answer || ''
            })
          })
          
          // Group flow chart questions by image
          if (flowChartQuestions.length > 0) {
            const flowGroups = new Map<string, any[]>()
            
            flowChartQuestions.forEach((question: any) => {
              const imageUrl = question.imageUrl || ''
              const key = `${passage.order}::${imageUrl}`
              
              if (!flowGroups.has(key)) {
                flowGroups.set(key, [])
              }
              
              flowGroups.get(key)!.push(question)
            })
            
            // Convert each group into a single question entry for editing
            flowGroups.forEach((groupQuestions) => {
              const sortedQuestions = groupQuestions.sort((a, b) => 
                (a.questionNumber || 0) - (b.questionNumber || 0)
              )
              
              const firstQuestion = sortedQuestions[0]
              const questionNumbers = sortedQuestions.map(q => q.questionNumber || 0)
              
              // Extract unique fields - use field from each question, deduplicate by field id
              // Each question has its own field, and also fields array with all fields
              // We only want the unique fields (one per question)
              const fieldMap = new Map<string, any>()
              sortedQuestions.forEach(q => {
                if (q.field) {
                  // Use field id as key to avoid duplicates, fallback to position if no id
                  const fieldId = q.field.id || `${q.field.x}-${q.field.y}-${q.field.width}-${q.field.height}`
                  if (!fieldMap.has(fieldId)) {
                    fieldMap.set(fieldId, q.field)
                  }
                }
              })
              const fields = Array.from(fieldMap.values())
              
              // Create a single grouped question entry
              transformedQuestions.push({
                id: Date.now() + transformedQuestions.length,
                dbIds: sortedQuestions.map(q => q.id), // Store all database IDs for deletion
                passageId: String(transformedPassages[passageIndex].id),
                questionNumber: questionNumbers[0], // Use first question number as the key
                number: questionNumbers[0],
                type: 'FLOW_CHART',
                questionType: 'FLOW_CHART',
                questionText: firstQuestion.questionText || 'Complete the flow chart below.',
                text: firstQuestion.questionText || 'Complete the flow chart below.',
                options: [],
                headingsList: [],
                summaryText: '',
                subQuestions: questionNumbers.map(n => n.toString()), // Store all question numbers
                imageUrl: firstQuestion.imageUrl || '',
                field: null,
                fields: fields, // Unique fields from all questions in the group
                points: firstQuestion.points || 1,
                correctAnswer: '' // Will be extracted from fields when saving
              })
            })
          }
        })
        setQuestions(transformedQuestions)

        // Transform band scores
        const transformedBandScores = (test.bandScoreRanges || []).map((range: any, index: number) => ({
          id: Date.now() + index,
          minScore: range.minScore || 0,
          band: range.band || 0
        }))
        setBandScores(transformedBandScores)

        // Transform passage configs
        let transformedConfigs: any[] = []
        if (test.passageConfigs && test.passageConfigs.length > 0) {
          transformedConfigs = test.passageConfigs.map((config: any, index: number) => ({
            id: Date.now() + index,
            part: config.part ?? (index + 1),
            total: config.total ?? 0,
            start: config.start ?? 1
          }))
          setPassageConfigs(transformedConfigs)
        } else {
          // If no passage configs exist, don't set default ones with 0 values
          // Let the user add them manually
          setPassageConfigs([])
        }

        // Store original data for comparison
        setOriginalData({
          testData: {
            title: test.title || '',
            totalQuestions: test.totalQuestions || 40,
            totalTimeMinutes: test.totalTimeMinutes || 60,
            isActive: test.isActive !== undefined ? test.isActive : true,
          },
          passages: transformedPassages,
          questions: transformedQuestions,
          bandScores: transformedBandScores,
          passageConfigs: transformedConfigs
        })
      } else {
        setError(data.error || 'Failed to load test data')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBasicInfoChange = (field: string, value: any) => {
    setTestData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddPassage = (passage: any) => {
    setPassages([...passages, { ...passage, id: Date.now() }])
  }

  const handleRemovePassage = (id: number) => {
    setPassages(passages.filter((p) => p.id !== id))
    // Also remove questions associated with this passage
    setQuestions(questions.filter((q) => q.passageId !== String(id)))
  }

  const handleUpdatePassage = (id: number, updatedPassage: any) => {
    setPassages(passages.map((p) => (p.id === id ? { ...updatedPassage, id } : p)))
  }

  const handleAddBandScore = (score: any) => {
    setBandScores([...bandScores, { ...score, id: Date.now() }])
  }

  const handleRemoveBandScore = (id: number) => {
    setBandScores(bandScores.filter((b) => b.id !== id))
  }

  const handleAddPassageConfig = (config: any) => {
    setPassageConfigs([...passageConfigs, { ...config, id: Date.now() }])
  }

  const handleRemovePassageConfig = (id: number) => {
    setPassageConfigs(passageConfigs.filter((c) => c.id !== id))
  }

  const handleUpdatePassageConfig = (id: number, updatedConfig: any) => {
    setPassageConfigs(passageConfigs.map((c) => (c.id === id ? { ...updatedConfig, id } : c)))
  }

  const handleAddQuestion = (question: any) => {
    setQuestions([...questions, { ...question, id: Date.now() }])
  }

  const handleRemoveQuestion = async (id: number) => {
    const questionToDelete = questions.find(q => q.id === id)
    if (!questionToDelete) {
      console.warn(`⚠️ Question with id ${id} not found in state`)
      return
    }
    
    const questionNumber = questionToDelete.questionNumber || questionToDelete.number || '?'
    const questionType = questionToDelete.type || questionToDelete.questionType || 'Unknown'
    
    if (!confirm(`Are you sure you want to delete Question ${questionNumber} (${questionType})?`)) {
      return
    }

    try {
      // For flow chart questions, delete all related questions
      const dbIds = questionToDelete.dbIds || (questionToDelete.dbId ? [questionToDelete.dbId] : [])
      
      if (dbIds.length === 0) {
        // New question not yet saved to database, just remove from state
        const updatedQuestions = questions.filter((q) => q.id !== id)
        setQuestions(updatedQuestions)
        console.log(`🗑️ Removed unsaved question ${questionNumber} from state`)
        return
      }

      // Delete from database - delete all questions in the group (for flow charts) or single question
      const deletePromises = dbIds.map((dbId: string) =>
        fetch(`/api/admin/reading-tests/questions/${dbId}`, {
          method: 'DELETE',
        })
      )

      const results = await Promise.all(deletePromises)
      const failed = results.filter(r => !r.ok)
      
      if (failed.length > 0) {
        const errors = await Promise.all(failed.map(r => r.json()))
        console.error('❌ Error deleting questions:', errors)
        alert(`Failed to delete question(s). Please try again.`)
        return
      }

      // Remove from state after successful deletion
      const updatedQuestions = questions.filter((q) => q.id !== id)
      console.log(`🗑️ Deleted question ${questionNumber} (${questionType}) from database and state`)
      console.log(`📊 Questions before deletion: ${questions.length}, after: ${updatedQuestions.length}`)
      setQuestions(updatedQuestions)
      console.log(`✅ Question deleted. Current questions in state: ${updatedQuestions.map(q => `Q${q.questionNumber || q.number || '?'}`).join(', ')}`)
    } catch (error) {
      console.error('❌ Error deleting question:', error)
      alert('Failed to delete question. Please try again.')
    }
  }

  const handleUpdateQuestion = async (id: number, updatedQuestion: any) => {
    const questionToUpdate = questions.find(q => q.id === id)
    if (!questionToUpdate) {
      console.warn(`⚠️ Question with id ${id} not found in state`)
      return
    }

    const questionType = (updatedQuestion.type || updatedQuestion.questionType || questionToUpdate.type || '').toUpperCase()
    
    // For flow chart questions, delete old questions from database first
    if (questionType === 'FLOW_CHART') {
      const dbIds = questionToUpdate.dbIds || (questionToUpdate.dbId ? [questionToUpdate.dbId] : [])
      
      if (dbIds.length > 0) {
        try {
          // Delete old questions from database
          const deletePromises = dbIds.map((dbId: string) =>
            fetch(`/api/admin/reading-tests/questions/${dbId}`, {
              method: 'DELETE',
            })
          )

          const results = await Promise.all(deletePromises)
          const failed = results.filter(r => !r.ok)
          
          if (failed.length > 0) {
            const errors = await Promise.all(failed.map(r => r.json()))
            console.error('❌ Error deleting old flow chart questions:', errors)
            alert(`Failed to update flow chart question. Could not delete old questions.`)
            return
          }

          console.log(`🗑️ Deleted ${dbIds.length} old flow chart questions before update`)
        } catch (error) {
          console.error('❌ Error deleting old flow chart questions:', error)
          alert('Failed to update flow chart question. Please try again.')
          return
        }
      }

      // Clear dbIds since we're creating new questions
      updatedQuestion.dbIds = undefined
      updatedQuestion.dbId = undefined
    } else {
      // For non-flow-chart questions, preserve dbId if it exists
      if (questionToUpdate.dbId) {
        updatedQuestion.dbId = questionToUpdate.dbId
      }
    }

    // Update state
    setQuestions(questions.map((q) => (q.id === id ? { ...updatedQuestion, id } : q)))
    console.log(`✅ Updated question ${id} in state`)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')
    try {
      // Validate
      if (!testData.title) {
        setError('Please enter a test title')
        setIsLoading(false)
        return
      }

      if (passages.length === 0) {
        setError('Please add at least one passage')
        setIsLoading(false)
        return
      }

      if (bandScores.length === 0) {
        setError('Please add band score ranges')
        setIsLoading(false)
        return
      }

      if (questions.length === 0) {
        setError('Please add at least one question')
        setIsLoading(false)
        return
      }

      // Transform data for API
      console.log(`📤 Preparing to update reading test. Current questions in state: ${questions.length}`)
      console.log(`📤 Question IDs in state: ${questions.map(q => `Q${q.questionNumber || q.number || '?'} (id: ${q.id})`).join(', ')}`)
      
      const transformedPassages = passages.map((passage) => ({
        title: passage.title,
        order: passage.order,
        contents: {
          create: passage.contents?.map((content: any) => ({
            contentId: content.contentId,
            text: content.text,
            order: content.order
          })) || []
        },
        questions: {
          create: (() => {
            const passageQuestions = questions.filter((q) => q.passageId === String(passage.id))
            console.log(`📤 Passage "${passage.title}": ${passageQuestions.length} questions to send`)
            console.log(`📤 Passage "${passage.title}" question numbers: ${passageQuestions.map(q => `Q${q.questionNumber || q.number || '?'}`).join(', ')}`)
            const flattenedQuestions: any[] = []
            
            passageQuestions.forEach((question) => {
              const questionType = (question.type || question.questionType || '').toUpperCase()
              
              // For FLOW_CHART questions, flatten each field into a separate question
              if (questionType === 'FLOW_CHART' && question.fields && Array.isArray(question.fields) && question.fields.length > 0) {
                question.fields.forEach((field: any, fieldIndex: number) => {
                  // Use field's questionNumber if set, otherwise calculate from starting question number + index
                  const fieldQuestionNumber = field.questionNumber !== undefined 
                    ? field.questionNumber 
                    : (question.questionNumber || question.number || 0) + fieldIndex
                  
                  const fieldQuestionData: any = {
                    questionNumber: fieldQuestionNumber,
                    type: 'FLOW_CHART',
                    questionText: question.questionText || question.text || '',
                    points: question.points || 1,
                    imageUrl: question.imageUrl || '',
                    field: field,
                    fields: question.fields, // Keep all fields for reference
                  }
                  
                  // Use the field's value as the correct answer
                  if (field?.value) {
                    fieldQuestionData.correctAnswer = {
                      create: {
                        answer: typeof field.value === 'string' ? field.value : String(field.value)
                      }
                    }
                  }
                  
                  flattenedQuestions.push(fieldQuestionData)
                })
              } else {
                // For non-flow-chart questions, create as normal
                const questionData: any = {
                  questionNumber: question.questionNumber || question.number,
                  type: question.type || question.questionType,
                  questionText: question.questionText || question.text || '',
                  points: question.points || 1,
                }

                // Add optional fields
                if (question.options) questionData.options = question.options
                if (question.headingsList) questionData.headingsList = question.headingsList
                if (question.summaryText) questionData.summaryText = question.summaryText
                if (question.subQuestions) questionData.subQuestions = question.subQuestions

                // Flow chart specific fields (for single field flow charts)
                if (question.imageUrl) questionData.imageUrl = question.imageUrl
                if (question.field) questionData.field = question.field
                if (question.fields) questionData.fields = question.fields

                // Handle correct answer - ensure it's a string, not an object
                if (question.correctAnswer) {
                  const answerValue = typeof question.correctAnswer === 'string' 
                    ? question.correctAnswer 
                    : (question.correctAnswer?.answer || question.correctAnswer?.create?.answer || '')
                  
                  if (answerValue) {
                    questionData.correctAnswer = {
                      create: {
                        answer: answerValue
                      }
                    }
                  }
                }

                flattenedQuestions.push(questionData)
              }
            })
            
            console.log(`📤 Passage "${passage.title}": ${flattenedQuestions.length} flattened questions after processing`)
            return flattenedQuestions
          })()
        }
      }))
      
      const totalQuestionsToCreate = transformedPassages.reduce((sum, p) => sum + (p.questions.create?.length || 0), 0)
      console.log(`📤 Total questions to create: ${totalQuestionsToCreate}`)

      const payload = {
        title: testData.title,
        totalQuestions: testData.totalQuestions,
        totalTimeMinutes: testData.totalTimeMinutes,
        passages: transformedPassages,
        bandScoreRanges: bandScores.map(({ id, ...b }) => b),
        passageConfigs: passageConfigs.map(({ id, ...c }) => c)
      }

      const response = await fetch(`/api/admin/reading-tests/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update test')
      }

      const result = await response.json()
      
      console.log(`✅ Update successful! Response received.`)
      console.log(`📊 Questions in response: ${result.readingTest?.passages?.reduce((sum: number, p: any) => sum + (p.questions?.length || 0), 0) || 0}`)
      
      // Refresh data from response
      if (result.readingTest) {
        const test = result.readingTest
        console.log(`📊 Updating state with ${test.passages?.length || 0} passages`)
        
        // Update state with fresh data
        setTestData({
          title: test.title || '',
          totalQuestions: test.totalQuestions || 40,
          totalTimeMinutes: test.totalTimeMinutes || 60,
          isActive: test.isActive !== undefined ? test.isActive : true,
        })

        // Transform and update passages
        const transformedPassages = (test.passages || []).map((passage: any, index: number) => ({
          id: Date.now() + index,
          title: passage.title || '',
          order: passage.order || index + 1,
          contents: (passage.contents || []).map((content: any) => ({
            contentId: content.contentId || '',
            text: content.text || '',
            order: content.order || 0
          }))
        }))
        setPassages(transformedPassages)

        // Transform and update questions - group flow chart questions by image
        const transformedQuestions: any[] = []
        test.passages.forEach((passage: any, passageIndex: number) => {
          // Separate flow chart questions from other questions
          const flowChartQuestions = (passage.questions || []).filter((q: any) => q.type === 'FLOW_CHART')
          const otherQuestions = (passage.questions || []).filter((q: any) => q.type !== 'FLOW_CHART')
          
          // Handle non-flow-chart questions
          otherQuestions.forEach((question: any) => {
            transformedQuestions.push({
              id: Date.now() + transformedQuestions.length,
              dbId: question.id, // Store database ID for deletion
              passageId: String(transformedPassages[passageIndex].id),
              questionNumber: question.questionNumber || 0,
              number: question.questionNumber || 0,
              type: question.type || 'multiple-choice',
              questionType: question.type || 'multiple-choice',
              questionText: question.questionText || '',
              text: question.questionText || '',
              options: question.options || [],
              headingsList: question.headingsList || [],
              summaryText: question.summaryText || '',
              subQuestions: question.subQuestions || [],
              imageUrl: question.imageUrl || '',
              field: question.field || null,
              fields: question.fields || (question.field ? [question.field] : []),
              points: question.points || 1,
              correctAnswer: question.correctAnswer?.answer || ''
            })
          })
          
          // Group flow chart questions by image
          if (flowChartQuestions.length > 0) {
            const flowGroups = new Map<string, any[]>()
            
            flowChartQuestions.forEach((question: any) => {
              const imageUrl = question.imageUrl || ''
              const key = `${passage.order}::${imageUrl}`
              
              if (!flowGroups.has(key)) {
                flowGroups.set(key, [])
              }
              
              flowGroups.get(key)!.push(question)
            })
            
            // Convert each group into a single question entry for editing
            flowGroups.forEach((groupQuestions) => {
              const sortedQuestions = groupQuestions.sort((a, b) => 
                (a.questionNumber || 0) - (b.questionNumber || 0)
              )
              
              const firstQuestion = sortedQuestions[0]
              const questionNumbers = sortedQuestions.map(q => q.questionNumber || 0)
              
              // Extract unique fields - use field from each question, deduplicate by field id
              // Each question has its own field, and also fields array with all fields
              // We only want the unique fields (one per question)
              const fieldMap = new Map<string, any>()
              sortedQuestions.forEach(q => {
                if (q.field) {
                  // Use field id as key to avoid duplicates, fallback to position if no id
                  const fieldId = q.field.id || `${q.field.x}-${q.field.y}-${q.field.width}-${q.field.height}`
                  if (!fieldMap.has(fieldId)) {
                    fieldMap.set(fieldId, q.field)
                  }
                }
              })
              const fields = Array.from(fieldMap.values())
              
              // Create a single grouped question entry
              transformedQuestions.push({
                id: Date.now() + transformedQuestions.length,
                dbIds: sortedQuestions.map(q => q.id), // Store all database IDs for deletion
                passageId: String(transformedPassages[passageIndex].id),
                questionNumber: questionNumbers[0], // Use first question number as the key
                number: questionNumbers[0],
                type: 'FLOW_CHART',
                questionType: 'FLOW_CHART',
                questionText: firstQuestion.questionText || 'Complete the flow chart below.',
                text: firstQuestion.questionText || 'Complete the flow chart below.',
                options: [],
                headingsList: [],
                summaryText: '',
                subQuestions: questionNumbers.map(n => n.toString()), // Store all question numbers
                imageUrl: firstQuestion.imageUrl || '',
                field: null,
                fields: fields, // Unique fields from all questions in the group
                points: firstQuestion.points || 1,
                correctAnswer: '' // Will be extracted from fields when saving
              })
            })
          }
        })
        console.log(`📊 Setting ${transformedQuestions.length} questions in state after update`)
        setQuestions(transformedQuestions)

        // Transform and update band scores
        const transformedBandScores = (test.bandScoreRanges || []).map((range: any, index: number) => ({
          id: Date.now() + index,
          minScore: range.minScore || 0,
          band: range.band || 0
        }))
        setBandScores(transformedBandScores)

        // Transform and update passage configs
        if (test.passageConfigs && test.passageConfigs.length > 0) {
          const transformedConfigs = test.passageConfigs.map((config: any, index: number) => ({
            id: Date.now() + index,
            part: config.part ?? (index + 1),
            total: config.total ?? 0,
            start: config.start ?? 1
          }))
          setPassageConfigs(transformedConfigs)
        } else {
          setPassageConfigs([])
        }

        // Update original data
        setOriginalData({
          testData: {
            title: test.title || '',
            totalQuestions: test.totalQuestions || 40,
            totalTimeMinutes: test.totalTimeMinutes || 60,
            isActive: test.isActive !== undefined ? test.isActive : true,
          },
          passages: transformedPassages,
          questions: transformedQuestions,
          bandScores: transformedBandScores,
          passageConfigs: test.passageConfigs || []
        })
      }

      // Show success message
      console.log(`✅ Update complete! Reloading page to show fresh data...`)
      alert('Reading test updated successfully! All deleted questions have been removed from the database. Reloading page...')
      
      // Reload the page to show updated data - use a small delay to ensure state updates
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      setError('Error updating test: ' + (error as Error).message)
      console.error('Update error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
        <Link
          href="/admin/reading-tests"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Reading Tests
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Edit Reading Test
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Update the reading test details, passages, questions, and configurations.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/admin/reading-tests"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Reading Tests
          </Link>
        </div>
      </div>

      {/* Reading Test Form */}
      <Card className="p-6">
        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="passages">Passages</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="bands">Band Scores</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <BasicTestInfo testData={testData} onChange={handleBasicInfoChange} />
          </TabsContent>

          <TabsContent value="passages" className="space-y-4">
            <PassageSection 
              passages={passages} 
              onAdd={handleAddPassage} 
              onRemove={handleRemovePassage}
              onUpdate={handleUpdatePassage}
            />
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            <QuestionSection
              questions={questions}
              passages={passages}
              passageConfigs={passageConfigs}
              onAdd={handleAddQuestion}
              onRemove={handleRemoveQuestion}
              onUpdate={handleUpdateQuestion}
            />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <PassageConfigSection
              configs={passageConfigs}
              onAdd={handleAddPassageConfig}
              onRemove={handleRemovePassageConfig}
              onUpdate={handleUpdatePassageConfig}
            />
          </TabsContent>

          <TabsContent value="bands" className="space-y-4">
            <BandScoreSection scores={bandScores} onAdd={handleAddBandScore} onRemove={handleRemoveBandScore} />
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-8 pt-6 border-t">
          <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />
            {isLoading ? 'Updating...' : 'Update Reading Test'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

