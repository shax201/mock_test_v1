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
  isRemedial?: boolean
  remedialType?: string
  difficulty?: string
  isReadingTest?: boolean
}

export default function StudentTests() {
  const [activeTab, setActiveTab] = useState('ielts')
  const [activeSubTab, setActiveSubTab] = useState('premium')
  const [activeSidebarItem, setActiveSidebarItem] = useState('public')
  const [mockTests, setMockTests] = useState<MockTest[]>([])
  const [publicMockTests, setPublicMockTests] = useState<MockTest[]>([])
  const [readingTests, setReadingTests] = useState<MockTest[]>([])
  const [listeningTests, setListeningTests] = useState<MockTest[]>([])
  const [loading, setLoading] = useState(true)
  const [publicLoading, setPublicLoading] = useState(true)
  const [readingLoading, setReadingLoading] = useState(true)
  const [listeningLoading, setListeningLoading] = useState(true)
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
      try {
        // Fetch all remedial tests (all modules, not just LISTENING)
        const response = await fetch('/api/student/remedial-tests')
        if (response.ok) {
          const data = await response.json()
          // Transform remedial tests to match the expected format
          const transformedRemedialTests = (data.remedialTests || []).map((test: any) => ({
            id: test.id,
            title: test.title,
            description: test.description || 'Remedial Test',
            duration: test.duration,
            status: test.attempted ? 'COMPLETED' : 'AVAILABLE',
            createdAt: new Date().toISOString(),
            audioUrl: test.module === 'LISTENING' ? null : null,
            instructions: null,
            moduleId: null,
            completionInfo: test.attempted ? {
              completedAt: test.completedAt || new Date().toISOString(),
              autoScore: test.score || undefined
            } : null,
            isRemedial: true,
            remedialType: test.type,
            difficulty: test.difficulty,
            module: test.module
          }))
          // Only show remedial tests, filter out any mock tests
          setListeningTests(transformedRemedialTests)
        } else {
          console.error('Failed to fetch remedial tests:', response.status)
        }
      } catch (error) {
        console.error('Error fetching remedial tests:', error)
      } finally {
        setListeningLoading(false)
      }
    }

    fetchMockTests()
    fetchPublicMockTests()
    fetchReadingTests()
    fetchListeningTests()
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

  const handleStartReadingTest = (readingTestId: string) => {
    // Navigate directly to the reading test page
    window.location.href = `/student/reading-tests/${readingTestId}`
  }

  const handleStartListeningTest = async (test: MockTest) => {
    setStartingTest(test.id)
    try {
      // All tests in item-wise tab are remedial tests now
      const response = await fetch('/api/student/start-remedial-test-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remedialTestId: test.id }),
      })

      if (response.ok) {
        const data = await response.json()
        // Determine the module path based on the remedial test module type
        const testModule = (test as any).module?.toLowerCase() || 'listening'
        let modulePath = 'listening'
        
        if (testModule === 'reading') {
          // Check if it's matching headings type
          if ((test as any).remedialType === 'MATCHING_HEADINGS') {
            modulePath = 'matching-headings'
          } else {
            modulePath = 'reading'
          }
        } else if (testModule === 'listening') {
          modulePath = 'listening'
        } else if (testModule === 'writing') {
          modulePath = 'writing'
        }
        
        window.location.href = `/test/${data.token}/${modulePath}`
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to start remedial test')
      }
    } catch (error) {
      console.error('Error starting remedial test:', error)
      alert('Network error. Please try again.')
    } finally {
      setStartingTest(null)
    }
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
                  
                  {/* <button
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
                  </button> */}
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
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Reading Test
                            </span>
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
                        .filter(t => !(t.title || '').toLowerCase().startsWith('remedial test'))
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
                      {readingTests.length === 0 && publicMockTests.filter(t => !(t.title || '').toLowerCase().startsWith('remedial test')).length === 0 && (
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
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Remedial Tests</h3>
                    <div className="text-sm text-gray-500">
                      {listeningLoading ? 'Loading...' : `${listeningTests.length} test${listeningTests.length !== 1 ? 's' : ''} available`}
                    </div>
                  </div>

                  {listeningLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Loading remedial tests...</p>
                    </div>
                  ) : listeningTests.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Remedial Tests</h3>
                        <p className="text-gray-500">No remedial tests are currently available</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {listeningTests.map((test) => (
                        <div key={test.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">{test.title}</h4>
                                {test.isRemedial && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Remedial
                                  </span>
                                )}
                                {test.difficulty && (
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    test.difficulty === 'BEGINNER' ? 'bg-green-100 text-green-800' :
                                    test.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {test.difficulty}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{test.description}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {test.duration} minutes
                                </div>
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                  </svg>
                                  {(test as any).module || 'Remedial'}
                                </div>
                                {(test as any).remedialType && (
                                  <div className="flex items-center">
                                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                                      {(test as any).remedialType.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center">
                                  {test.status !== 'COMPLETED' && (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      test.status === 'AVAILABLE'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {test.status}
                                    </span>
                                  )}
                                  {test.completionInfo?.autoScore && (
                                    <span className="ml-2 text-xs font-semibold text-green-600">
                                      (Band {test.completionInfo.autoScore})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              {test.status === 'COMPLETED' ? (
                                <Link 
                                  href={`/student/results/${test.id}`}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90"
                                  style={{ backgroundColor: '#25c994' }}
                                >
                                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  View Analysis
                                </Link>
                              ) : (
                                <button
                                  onClick={() => handleStartListeningTest(test)}
                                  disabled={startingTest === test.id}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {startingTest === test.id ? (
                                    <>
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Starting...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Start Test
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
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


