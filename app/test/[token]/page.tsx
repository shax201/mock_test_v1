'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface TestModule {
  id: string
  type: 'LISTENING' | 'READING' | 'WRITING' | 'MATCHING_HEADINGS'
  duration: number
  instructions: string
  audioUrl?: string
  passageContent?: {
    part1: string
    part2: string
    part3: string
  }
  readingData?: {
    part1Content: string
    part2Content: string
    part3Content: string
    part1Passage: string
    part2Passage: string
    part3Passage: string
    part1Instructions: string
    part2Instructions: string
    part3Instructions: string
  }
  listeningData?: {
    audioUrl: string
    audioPublicId: string
    audioDuration: number
    part1Content: string
    part2Content: string
    part3Content: string
    part1Instructions: string
    part2Instructions: string
    part3Instructions: string
    part1AudioStart: number
    part1AudioEnd: number
    part2AudioStart: number
    part2AudioEnd: number
    part3AudioStart: number
    part3AudioEnd: number
  }
  isCompleted: boolean
  submittedAt: string | null
  autoScore: number | null
}

interface Assignment {
  id: string
  candidateNumber: string
  studentName: string
  mockTitle: string
}

export default function TestDashboard({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [modules, setModules] = useState<TestModule[]>([])
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [currentModule, setCurrentModule] = useState<string>('')

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const { token } = await params
        const response = await fetch(`/api/student/validate-token?token=${encodeURIComponent(token)}`)
        const data = await response.json()

        if (response.ok) {
          // Fetch available modules
          const modulesResponse = await fetch(`/api/student/test-modules?token=${encodeURIComponent(token)}`)
          if (modulesResponse.ok) {
            const modulesData = await modulesResponse.json()
            setModules(modulesData.modules || [])
            setAssignment(modulesData.assignment)
          } else {
            const errorData = await modulesResponse.json()
            setError(errorData.error || 'Failed to load test modules')
          }
        } else {
          setError(data?.error || 'Invalid or expired token')
        }
      } catch (_err) {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchTestData()
  }, [params])

  const startModule = async (moduleType: string) => {
    const { token } = await params
    const route = moduleType === 'MATCHING_HEADINGS' ? 'matching-headings' : moduleType.toLowerCase()
    router.push(`/test/${token}/${route}`)
  }

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'LISTENING':
        return (
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )
      case 'READING':
        return (
          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      case 'WRITING':
        return (
          <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )
      case 'MATCHING_HEADINGS':
        return (
          <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        )
      default:
        return null
    }
  }

  const getModuleColor = (type: string) => {
    switch (type) {
      case 'LISTENING':
        return 'bg-green-100 text-green-600'
      case 'READING':
        return 'bg-blue-100 text-blue-600'
      case 'WRITING':
        return 'bg-purple-100 text-purple-600'
      case 'MATCHING_HEADINGS':
        return 'bg-orange-100 text-orange-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8" />
            </svg>
          </div>
          <p className="mt-4 text-gray-700">Loading your test dashboard…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Unable to access test</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/test')}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Test Entry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">IELTS Mock Test</h1>
                  <p className="text-sm text-gray-500">Test Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Candidate: {assignment?.candidateNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Your IELTS Test</h1>
          <p className="text-lg text-gray-600">
            {assignment?.mockTitle || 'IELTS Mock Test'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Student: {assignment?.studentName}
          </p>
        </div>

        {/* Test Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Test Instructions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h3 className="font-medium mb-2">Before You Start:</h3>
              <ul className="space-y-1">
                <li>• Ensure you have a stable internet connection</li>
                <li>• Find a quiet environment for the test</li>
                <li>• Have your ID ready for verification</li>
                <li>• Complete all modules in the given time</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">During the Test:</h3>
              <ul className="space-y-1">
                <li>• Do not refresh the page during the test</li>
                <li>• Your answers are auto-saved as you progress</li>
                <li>• You can navigate between questions</li>
                <li>• Submit each module when completed</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div key={module.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className={`p-6 ${getModuleColor(module.type)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getModuleIcon(module.type)}
                    <div>
                      <h3 className="text-lg font-semibold capitalize">
                        {module.type.toLowerCase()}
                      </h3>
                      <p className="text-sm opacity-75">
                        {module.duration} minutes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Module Details</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {module.instructions}
                  </p>
                  
                  {module.type === 'LISTENING' && (module.audioUrl || module.listeningData?.audioUrl) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-green-800">
                        <strong>Audio Available:</strong> This module includes audio content
                        {module.listeningData?.audioDuration && (
                          <span className="ml-2 text-xs">
                            (Duration: {Math.floor(module.listeningData.audioDuration / 60)}:{(module.listeningData.audioDuration % 60).toString().padStart(2, '0')})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  
                  {module.type === 'READING' && (module.passageContent || module.readingData) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>Reading Passages:</strong> Multiple passages with questions
                        {module.readingData && (
                          <span className="ml-2 text-xs">
                            (Enhanced content management)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  
                  {module.type === 'WRITING' && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-purple-800">
                        <strong>Writing Tasks:</strong> Two writing tasks to complete
                      </p>
                    </div>
                  )}
                  
                  {module.type === 'MATCHING_HEADINGS' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-orange-800">
                        <strong>Matching Headings:</strong> Drag and drop headings to match sections
                      </p>
                    </div>
                  )}
                </div>
                
                {module.isCompleted ? (
                  <div className="w-full py-3 px-4 rounded-lg font-medium bg-gray-100 text-gray-600 border border-gray-300 flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Taken
                    {module.autoScore && (
                      <span className="ml-2 text-sm font-semibold text-green-600">
                        (Band {module.autoScore})
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => startModule(module.type)}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      module.type === 'LISTENING' 
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : module.type === 'READING'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : module.type === 'WRITING'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    Start {module.type} Test
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Progress</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <span className="text-sm text-gray-600">Not Started</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {modules.filter(m => m.isCompleted).length} of {modules.length} modules completed
            </div>
          </div>
          
          {/* Module Status Overview */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {modules.map((module) => (
              <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    module.isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900">{module.type}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {module.isCompleted ? (
                    <span className="text-green-600 font-medium">
                      ✓ Completed
                      {module.autoScore && ` (Band ${module.autoScore})`}
                    </span>
                  ) : (
                    <span className="text-gray-500">Not Started</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


