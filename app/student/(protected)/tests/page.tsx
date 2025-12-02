'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StudentHeader from '@/components/student/StudentHeader'

interface MockTest {
  id: string
  title: string
  description: string
  duration: number
  status: string
  createdAt: string
  writingTestId?: string
  completionInfo?: {
    completedAt: string
    autoScore?: number
  }
  difficulty?: string
  isReadingTest?: boolean
}

interface ItemWiseTest {
  id: string
  title: string
  testType: string
  questionType: string
  moduleType: 'READING' | 'LISTENING' | 'WRITING'
  isActive: boolean
  createdAt: string
  updatedAt: string
  readingTests: Array<{ id: string; title: string; totalTimeMinutes: number; totalQuestions?: number; attempted: boolean; attemptedAt?: string | null; sessionId?: string | null }>
  listeningTests: Array<{ id: string; title: string; audioSource: string; totalTimeMinutes?: number | null; totalQuestions?: number; attempted: boolean; attemptedAt?: string | null; sessionId?: string | null }>
  writingTests: Array<{ id: string; title: string; totalTimeMinutes: number; totalQuestions?: number; attempted: boolean; attemptedAt?: string | null; sessionId?: string | null }>
}

export default function StudentTests() {
  const [activeTab, setActiveTab] = useState('ielts')
  const [activeSubTab, setActiveSubTab] = useState('premium')
  const [activeSidebarItem, setActiveSidebarItem] = useState('public')
  const [mockTests, setMockTests] = useState<MockTest[]>([])
  const [publicMockTests, setPublicMockTests] = useState<MockTest[]>([])
  const [readingTests, setReadingTests] = useState<MockTest[]>([])
  const [listeningTests, setListeningTests] = useState<MockTest[]>([])
  const [itemWiseTests, setItemWiseTests] = useState<ItemWiseTest[]>([])
  const [expandedItemWise, setExpandedItemWise] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [publicLoading, setPublicLoading] = useState(true)
  const [readingLoading, setReadingLoading] = useState(true)
  const [listeningLoading, setListeningLoading] = useState(true)
  const [itemWiseLoading, setItemWiseLoading] = useState(true)
  const [startingTest, setStartingTest] = useState<string | null>(null)
  const [joiningTest, setJoiningTest] = useState<string | null>(null)

  useEffect(() => {
    const fetchMockTests = async () => {
      try {
        const response = await fetch('/api/student/mock-tests')
        if (response.ok) {
          const data = await response.json()
          setMockTests(data.mockTests || [])
        }
      } catch (error) {
        console.error('Error fetching mock tests:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchPublicMockTests = async () => {
      try {
        const response = await fetch('/api/student/public-mock-tests')
        if (response.ok) {
          const data = await response.json()
          setPublicMockTests(data.mockTests || [])
        } else {
          console.error('Failed to fetch public mock tests:', response.status)
        }
      } catch (error) {
        console.error('Error fetching public mock tests:', error)
      } finally {
        setPublicLoading(false)
      }
    }

    const fetchReadingTests = async () => {
      try {
        const response = await fetch('/api/student/reading-tests')
        if (response.ok) {
          const data = await response.json()
          const readingTestsList = data.readingTests || []
          
          // Check completion status for each reading test
          const testsWithStatus = await Promise.all(
            readingTestsList.map(async (test: any) => {
              try {
                // Check if there's a completed session for this test
                const sessionResponse = await fetch(`/api/student/reading-tests/${test.id}/results`)
                if (sessionResponse.ok) {
                  const sessionData = await sessionResponse.json()
                  return {
                    id: test.id,
                    title: test.title,
                    description: `Reading test with ${test._count.passages} passage${test._count.passages !== 1 ? 's' : ''} and ${test.totalQuestions} questions`,
                    duration: test.totalTimeMinutes,
                    status: 'COMPLETED',
                    createdAt: test.createdAt,
                    isReadingTest: true,
                    writingTestId: test.writingTestId,
                    completionInfo: {
                      completedAt: sessionData.completedAt || new Date().toISOString(),
                      autoScore: sessionData.band || undefined
                    }
                  }
                } else {
                  // No completed session found
                  return {
                    id: test.id,
                    title: test.title,
                    description: `Reading test with ${test._count.passages} passage${test._count.passages !== 1 ? 's' : ''} and ${test.totalQuestions} questions`,
                    duration: test.totalTimeMinutes,
                    status: 'AVAILABLE',
                    createdAt: test.createdAt,
                    isReadingTest: true,
                    writingTestId: test.writingTestId
                  }
                }
              } catch (error) {
                // If error checking session, assume test is available
                return {
                  id: test.id,
                  title: test.title,
                  description: `Reading test with ${test._count.passages} passage${test._count.passages !== 1 ? 's' : ''} and ${test.totalQuestions} questions`,
                  duration: test.totalTimeMinutes,
                  status: 'AVAILABLE',
                  createdAt: test.createdAt,
                  isReadingTest: true,
                  writingTestId: test.writingTestId
                }
              }
            })
          )
          
          setReadingTests(testsWithStatus)
        } else {
          console.error('Failed to fetch reading tests:', response.status)
        }
      } catch (error) {
        console.error('Error fetching reading tests:', error)
      } finally {
        setReadingLoading(false)
      }
    }

    const fetchListeningTests = async () => {
      // Listening tests are not available in this version
      setListeningTests([])
      setListeningLoading(false)
    }

    const fetchItemWiseTests = async () => {
      try {
        const response = await fetch('/api/student/item-wise-tests')
        if (response.ok) {
          const data = await response.json()
          setItemWiseTests(data.itemWiseTests || [])
        } else {
          console.error('Failed to fetch item-wise tests:', response.status)
        }
      } catch (error) {
        console.error('Error fetching item-wise tests:', error)
      } finally {
        setItemWiseLoading(false)
      }
    }

    fetchMockTests()
    fetchPublicMockTests()
    fetchReadingTests()
    fetchListeningTests()
    fetchItemWiseTests()
  }, [])

  const handleStartTest = async (mockId: string) => {
    setStartingTest(mockId)
    try {
      const response = await fetch('/api/student/start-mock-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mockId }),
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect directly to the reading test
        window.location.href = `/test/${data.assignment.tokenHash}/reading`
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to start test')
      }
    } catch (error) {
      console.error('Error starting test:', error)
      alert('Network error. Please try again.')
    } finally {
      setStartingTest(null)
    }
  }

  const handleJoinTest = async (mockId: string) => {
    setJoiningTest(mockId)
    try {
      const response = await fetch('/api/student/join-mock-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mockId }),
      })

      if (response.ok) {
        const data = await response.json();
        console.log("data at join test",data);
        // Redirect to test dashboard to show all available modules

        if(data.mockTest.questionTypes.length === 1 && data.mockTest.questionTypes[0] === 'MATCHING'){
          window.location.href = `/test/${data.assignment.tokenHash}/matching-headings`
        } else {
          window.location.href = `/test/${data.assignment.tokenHash}/reading`
        }

     
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to join test')
      }
    } catch (error) {
      console.error('Error joining test:', error)
      alert('Network error. Please try again.')
    } finally {
      setJoiningTest(null)
    }
  }

  const handleStartReadingTest = (readingTestId: string, itemWiseTestId?: string) => {
    const query = itemWiseTestId ? `?itemWiseTestId=${itemWiseTestId}` : ''
    window.location.href = `/student/reading-tests/${readingTestId}${query}`
  }

  const handleStartListeningTest = (listeningTestId: string, itemWiseTestId?: string) => {
    const query = itemWiseTestId ? `?itemWiseTestId=${itemWiseTestId}` : ''
    window.location.href = `/student/listening-tests/${listeningTestId}${query}`
  }

  const handleStartWritingTest = (writingTestId: string, itemWiseTestId?: string) => {
    const query = itemWiseTestId ? `?itemWiseTestId=${itemWiseTestId}` : ''
    window.location.href = `/student/writing-tests/${writingTestId}${query}`
  }

  const toggleItemWiseCard = (id: string) => {
    setExpandedItemWise(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }


  return (
    <>
      <StudentHeader />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8s space-y-6">
      {/* Main Online Tests Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Online Tests</h1>
          
          {/* IELTS Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('ielts')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'ielts' 
                    ? 'bg-white text-gray-900 border border-gray-300' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                IELTS
              </button>
            </div>
          </div>

          {/* IELTS Sub-Navigation */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveSubTab('premium')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  activeSubTab === 'premium' 
                    ? 'bg-white text-gray-900 border border-gray-300' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {activeSubTab === 'premium' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-md"></div>
                )}
                IELTS Premium (AT)
              </button>
            </div>
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Sidebar Navigation */}
            <div className="lg:col-span-1">
              <nav className="bg-white border border-gray-200 rounded-lg">
                <div className="p-2">
           
                  
                  <button
                    onClick={() => setActiveSidebarItem('public')}
                    className={`w-full flex items-center px-3 py-3 text-sm font-medium transition-colors relative border-b border-gray-100 ${
                      activeSidebarItem === 'public'
                        ? 'bg-green-50 text-gray-900'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    {activeSidebarItem === 'public' && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-500"></div>
                    )}
                      CD-IELTS Mocks
                  </button>
                  
                  <button
                    onClick={() => setActiveSidebarItem('item-wise')}
                    className={`w-full flex items-center px-3 py-3 text-sm font-medium transition-colors relative ${
                      activeSidebarItem === 'item-wise'
                        ? 'bg-green-50 text-gray-900'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    {activeSidebarItem === 'item-wise' && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-500"></div>
                    )}
                    Item-wise Tests
                  </button>
                </div>
              </nav>
            </div>

            {/* Right Column - Content */}
            <div className="lg:col-span-3">
              {activeSidebarItem === 'mocks' && (
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : mockTests.length > 0 ? (
                    mockTests.map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900">{test.title}</span>
                            <p className="text-xs text-gray-500">{test.description} • {Math.floor(test.duration / 60)}h {test.duration % 60}min</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            test.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : test.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {test.status === 'ACTIVE' ? 'Available' : test.status === 'COMPLETED' ? 'Completed' : test.status}
                          </span>
                          {test.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleStartTest(test.id)}
                              disabled={startingTest === test.id}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {startingTest === test.id ? 'Starting...' : 'Start Test'}
                            </button>
                          )}
                          {test.status === 'COMPLETED' && (
                            <Link 
                              href={`/results/${test.id}`}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                            >
                              View Results
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Mock Tests Available</h3>
                        <p className="text-gray-500">Mock tests will be available here when they are created.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSidebarItem === 'public' && (
                <div className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Public Mock Tests</h3>
                    <p className="text-sm text-gray-600">Join any available mock test to practice your IELTS skills</p>
                  </div>
                  
                  {(publicLoading || readingLoading) ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  ) : (
                    <>
                      {/* Reading Tests */}
                      {readingTests.map((test) => (
                        <div key={test.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.747 5.754 18 7.5 18s3.332.747 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.747 4.5 1.253v13C19.832 18.747 18.247 18 16.5 18c-1.746 0-3.332.747-4.5 1.253" />
                              </svg>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900">{test.title}</span>
                              <p className="text-xs text-gray-500">{test.description} • {test.duration} minutes</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Reading Test
                            </span> */}
                            {test.status === 'COMPLETED' ? (
                              <Link 
                                href={`/student/results/${test.writingTestId}`}
                                className="text-white px-3 py-1 rounded text-xs hover:opacity-90 flex items-center"
                                style={{ backgroundColor: '#25c994' }}
                              >
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                View Analysis
                              </Link>
                            ) : (
                              <button
                                onClick={() => handleStartReadingTest(test.id)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                              >
                                Take Test
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Public Mock Tests */}
                      {publicMockTests
                        .map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900">{test.title}</span>
                            <p className="text-xs text-gray-500">{test.description} • {Math.floor(test.duration / 60)}h {test.duration % 60}min</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {test.status !== 'COMPLETED' && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              test.status === 'IN_PROGRESS'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {test.status === 'IN_PROGRESS' ? 'In Progress' : 'Available'}
                            </span>
                          )}
                          {test.status === 'COMPLETED' ? (
                            <Link 
                              href={`/student/results/${test.id}`}
                              className="text-white px-3 py-1 rounded text-xs hover:opacity-90 flex items-center"
                              style={{ backgroundColor: '#25c994' }}
                            >
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              View Analysis
                            </Link>
                          ) : test.status === 'IN_PROGRESS' ? (
                              <Link 
                                href={`/test/${test.id}`}
                                className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700"
                              >
                                Continue Test Session
                              </Link>
                            ) : (
                              <button
                                onClick={() => handleJoinTest(test.id)}
                                disabled={joiningTest === test.id}
                                className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {joiningTest === test.id ? 'Joining...' : 'Take Test'}
                              </button>
                            )}
                        </div>
                      </div>
                      ))}
                      
                      {/* Empty State */}
                      {readingTests.length === 0 && publicMockTests.length === 0 && (
                        <div className="text-center py-12">
                          <div className="text-gray-500">
                            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Public Mock Tests Available</h3>
                            <p className="text-gray-500">Only full mock tests are shown here.</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeSidebarItem === 'item-wise' && (
                <div className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Item-wise Tests</h3>
                    <p className="text-sm text-gray-600">
                      Focus on targeted IELTS listening/reading tasks such as Flow Chart Completion without taking a full-length mock.
                    </p>
                  </div>

                  {itemWiseLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  ) : itemWiseTests.length > 0 ? (
                    itemWiseTests.map((test) => {
                      const isReadingModule = test.moduleType === 'READING'
                      const isListeningModule = test.moduleType === 'LISTENING'
                      const isWritingModule = test.moduleType === 'WRITING'
                      const isExpanded = expandedItemWise[test.id] ?? false
                      const moduleLabel = isReadingModule ? 'Reading Module' : isListeningModule ? 'Listening Module' : 'Writing Module'
                      const moduleBadgeColor = isReadingModule
                        ? 'bg-blue-100 text-blue-700'
                        : isListeningModule
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                      const moduleIcon = '🍌'

                      const components = isReadingModule
                        ? test.readingTests.map(reading => ({
                            id: reading.id,
                            title: reading.title,
                            subtitle: `${reading.totalTimeMinutes} minutes`,
                            meta: `${reading.totalQuestions ?? 0} questions`,
                            attempted: reading.attempted,
                            attemptedAt: reading.attemptedAt,
                            sessionId: reading.sessionId,
                            start: () => handleStartReadingTest(reading.id, test.id)
                          }))
                        : isListeningModule
                        ? test.listeningTests.map(listening => ({
                            id: listening.id,
                            title: listening.title,
                            subtitle: listening.totalTimeMinutes ? `${listening.totalTimeMinutes} minutes` : 'Flexible duration',
                            meta: `${listening.totalQuestions ?? 0} questions`,
                            attempted: listening.attempted,
                            attemptedAt: listening.attemptedAt,
                            sessionId: listening.sessionId,
                            start: () => handleStartListeningTest(listening.id, test.id)
                          }))
                        : test.writingTests.map(writing => ({
                            id: writing.id,
                            title: writing.title,
                            subtitle: `${writing.totalTimeMinutes} minutes`,
                            meta: `${writing.totalQuestions ?? 0} questions`,
                            attempted: writing.attempted,
                            attemptedAt: writing.attemptedAt,
                            sessionId: writing.sessionId,
                            start: () => handleStartWritingTest(writing.id, test.id)
                          }))
                      const toggleLabel = isExpanded ? 'Hide tests' : `${components.length} Test${components.length === 1 ? '' : 's'}`

                      return (
                        <div key={test.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h4 className="text-base font-semibold text-gray-900">{test.title}</h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {test.testType.replace(/_/g, ' ')} • {test.questionType.replace(/_/g, ' ')} • {moduleLabel}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleItemWiseCard(test.id)}
                                className="inline-flex items-center text-xs font-medium text-gray-600 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50"
                              >
                                {toggleLabel}
                                <svg
                                  className={`w-3 h-3 ml-1 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {components.length > 0 ? (
                                components.map((component) => (
                                  <div
                                    key={component.id}
                                    className="rounded-lg border border-gray-100 bg-gradient-to-b from-white to-gray-50 p-4 shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex flex-col items-center text-center space-y-2">
                                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                                        {moduleIcon}
                                      </div>
                                      <p className="text-sm font-semibold text-gray-900 truncate w-full">{component.title}</p>
                                      <p className="text-xs text-gray-500">{component.subtitle}</p>
                                    {component.meta && <p className="text-[11px] text-gray-400">{component.meta}</p>}
                                    {component.attempted && component.attemptedAt && (
                                      <p className="text-[11px] text-green-600">Attempted {new Date(component.attemptedAt).toLocaleString()}</p>
                                    )}
                                    {component.attempted ? (
                                      <Link
                                        href={`/student/results/${component.sessionId || component.id}`}
                                        className="w-full mt-2 inline-flex items-center justify-center bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700"
                                      >
                                        View Analysis
                                      </Link>
                                    ) : (
                                      <button
                                        onClick={component.start}
                                        className="w-full mt-2 bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700"
                                      >
                                        Take Test
                                      </button>
                                    )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-full text-center text-xs text-gray-500 py-8">
                                  No {moduleLabel.toLowerCase()} linked yet.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Item-wise Tests Available</h3>
                        <p className="text-gray-500">Please check back later for focused practice sets.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}


