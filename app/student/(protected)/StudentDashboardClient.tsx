'use client'

import Link from 'next/link'
import StudentHeader from '@/components/student/StudentHeader'

interface TestResult {
  id: string
  testTitle: string
  overallBand: number
  listeningBand: number
  readingBand: number
  writingBand: number
  speakingBand: number
  completedAt: string
  status: string
}

interface ParticipationHistoryItem {
  id: string
  testTitle: string
  testDescription: string
  candidateNumber: string
  status: string
  assignedAt: string
  validFrom: string
  validUntil: string
  completedAt: string | null
  testDuration: number | null
  progressPercentage: number
  moduleStatus: Array<{
    module: string
    status: string
    submittedAt: string | null
    autoScore: number | null
    instructorMarked: boolean
  }>
  overallBand: number | null
  moduleBands: {
    listening: number | null
    reading: number | null
    writing: number | null
    speaking: number | null
  }
  hasResult: boolean
  isExpired: boolean
  canRetake: boolean
}

interface DashboardStats {
  totalTests: number
  activeTestsCount: number
  averageBand: number
  highestBand: number
  moduleAverages: {
    listening: number
    reading: number
    writing: number
    speaking: number
  }
  recentResults: TestResult[]
  activeTests: Array<{
    id: string
    title: string
    token: string
    validUntil: string
  }>
}

interface SummaryStats {
  totalTests: number
  completedTests: number
  activeTests: number
  expiredTests: number
  averageBand: number
  totalTestTime: number
}

interface StudentDashboardClientProps {
  initialStats: DashboardStats | null
  initialParticipationHistory: ParticipationHistoryItem[]
  initialSummaryStats: SummaryStats | null
  error: string
}

export default function StudentDashboardClient({
  initialStats,
  initialParticipationHistory,
  initialSummaryStats,
  error
}: StudentDashboardClientProps) {
  const stats = initialStats || {
    totalTests: 0,
    activeTestsCount: 0,
    averageBand: 0,
    highestBand: 0,
    moduleAverages: {
      listening: 0,
      reading: 0,
      writing: 0,
      speaking: 0
    },
    recentResults: [],
    activeTests: []
  }
  const participationHistory = initialParticipationHistory
  const summaryStats = initialSummaryStats || {
    totalTests: 0,
    completedTests: 0,
    activeTests: 0,
    expiredTests: 0,
    averageBand: 0,
    totalTestTime: 0
  }

  return (
    <>
      <StudentHeader />
      <div className="space-y-6 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Your IELTS Portal</h1>
            <p className="text-gray-600">
              Track your progress, view results, and access your test history.
            </p>
          </div>
        </div>

        {error && (
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
        )}

        {/* Motivational Header */}
        <div className="text-center">
          <p className="text-lg text-gray-700 font-medium">
            Hey Student, week after week, witness compounded growth!
          </p>
        </div>

        {/* Where You Stand Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Where You Stand</h2>
            
            {/* Skill Navigation Buttons */}
            <div className="flex space-x-4 mb-6">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                Listening
              </button>
              <button className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Reading
              </button>
              <button className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Writing
              </button>
              <button className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Speaking
              </button>
            </div>

            {/* Performance Graph */}
            <div className="relative">
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                  Band Score
                </span>
              </div>
              
              {/* Graph Container */}
              <div className="bg-gray-50 rounded-lg p-4 h-80 relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                  <span>9</span>
                  <span>8</span>
                  <span>7</span>
                  <span>6</span>
                  <span>5</span>
                  <span>4</span>
                  <span>3</span>
                  <span>2</span>
                  <span>1</span>
                  <span>0</span>
                </div>
                
                {/* Graph Area */}
                <div className="ml-8 h-full relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                      <div key={i} className="absolute w-full border-t border-gray-200" style={{ top: `${(9-i) * 11.11}%` }}></div>
                    ))}
                    {Array.from({length: 20}, (_, i) => (
                      <div key={i} className="absolute h-full border-l border-gray-200" style={{ left: `${i * 5}%` }}></div>
                    ))}
                  </div>
                  
                  {/* Sample Data Lines */}
                  <svg className="absolute inset-0 w-full h-full">
                    {/* Score Trend Line (Grey) */}
                    <polyline
                      points="0,60 50,60 100,60 150,60 200,60 250,60 300,60 350,60 400,60 450,60 500,60 550,60 600,60 650,60 700,60 750,60 800,60 850,60 900,60 950,60"
                      fill="none"
                      stroke="#6B7280"
                      strokeWidth="2"
                    />
                    
                    {/* Score Line (Red) */}
                    <polyline
                      points="0,180 50,120 100,100 150,80 200,100 250,120 300,140 350,120 400,100 450,80 500,100 550,120 600,140 650,160 700,180 750,200 800,180 850,160 900,140 950,120"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="3"
                    />
                    
                    {/* Score Line Fill */}
                    <polygon
                      points="0,180 0,180 50,120 100,100 150,80 200,100 250,120 300,140 350,120 400,100 450,80 500,100 550,120 600,140 650,160 700,180 750,200 800,180 850,160 900,140 950,120 950,180"
                      fill="rgba(239, 68, 68, 0.1)"
                    />
                    
                    {/* Data Points */}
                    {[
                      {x: 0, y: 180}, {x: 50, y: 120}, {x: 100, y: 100}, {x: 150, y: 80}, {x: 200, y: 100},
                      {x: 250, y: 120}, {x: 300, y: 140}, {x: 350, y: 120}, {x: 400, y: 100}, {x: 450, y: 80},
                      {x: 500, y: 100}, {x: 550, y: 120}, {x: 600, y: 140}, {x: 650, y: 160}, {x: 700, y: 180},
                      {x: 750, y: 200}, {x: 800, y: 180}, {x: 850, y: 160}, {x: 900, y: 140}, {x: 950, y: 120}
                    ].map((point, index) => (
                      <circle key={index} cx={point.x} cy={point.y} r="4" fill="#EF4444" />
                    ))}
                  </svg>
                  
                  {/* X-axis labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
                    {Array.from({length: 21}, (_, i) => (
                      <span key={i} className="transform -rotate-45 origin-left" style={{ marginLeft: `${i * 4.5}%` }}>
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center mt-4 space-x-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Score</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Score Trend</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed Tests</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalTests}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Tests</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeTestsCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Average Band</dt>
                    <dd className="text-lg font-medium text-gray-900">{Math.round(stats.averageBand)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Highest Band</dt>
                    <dd className="text-lg font-medium text-gray-900">{Math.round(stats.highestBand)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module Performance */}
        {stats && stats.moduleAverages && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Module Performance</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(stats.moduleAverages.listening)}</div>
                  <div className="text-sm text-gray-500">Listening</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{Math.round(stats.moduleAverages.reading)}</div>
                  <div className="text-sm text-gray-500">Reading</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{Math.round(stats.moduleAverages.writing)}</div>
                  <div className="text-sm text-gray-500">Writing</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{Math.round(stats.moduleAverages.speaking)}</div>
                  <div className="text-sm text-gray-500">Speaking</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Tests */}
        {stats && stats.activeTests && Array.isArray(stats.activeTests) && stats.activeTests.length > 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Available Tests</h2>
              <div className="space-y-3">
                {stats.activeTests.map((test, index) => {
                  if (!test || typeof test !== 'object' || !test.id) {
                    return null
                  }
                  return (
                    <div key={test.id || index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{test.title || 'Untitled Test'}</h3>
                        <p className="text-xs text-gray-500">
                          Valid until: {test.validUntil ? new Date(test.validUntil).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <Link
                        href={`/test/${test.token || ''}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Start Test
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Participation History */}
        {participationHistory && participationHistory.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Recent Test Participation</h2>
                <Link href="/student/participation-history" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                  View All →
                </Link>
              </div>
              <div className="space-y-4">
                {participationHistory.slice(0, 3).map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{item.testTitle}</h3>
                        <p className="text-xs text-gray-500">
                          Candidate: {item.candidateNumber} • Assigned: {new Date(item.assignedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          item.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                          item.isExpired ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status === 'COMPLETED' ? 'Completed' :
                           item.status === 'ACTIVE' ? 'Active' :
                           item.isExpired ? 'Expired' : item.status}
                        </span>
                        {item.overallBand && (
                          <span className="text-lg font-bold text-blue-600">{Math.round(item.overallBand)}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{item.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${item.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Module Status */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {item.moduleStatus.map((module) => (
                        <div key={module.module} className="text-xs">
                          <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center mb-1 ${
                            module.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                            module.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            {module.status === 'COMPLETED' ? '✓' : 
                             module.status === 'IN_PROGRESS' ? '⏳' : '○'}
                          </div>
                          <div className="text-gray-500 capitalize">{module.module}</div>
                          {module.autoScore && (
                            <div className="text-xs font-medium">{Math.round(module.autoScore)}</div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Test Duration */}
                    {item.testDuration && (
                      <div className="mt-3 text-xs text-gray-500">
                        Duration: {item.testDuration} minutes
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assigned Tests Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Assigned Tests</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr.No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No Record Found
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Five Recently Attempted Tests Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Five Recently Attempted Tests</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr.No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempted Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Band</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentResults && stats.recentResults.length > 0 ? (
                    stats.recentResults.map((result, index) => (
                      <tr key={result.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.testTitle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(result.completedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Overall: {result.overallBand.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link href={`/student/results/${result.id}`} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">View Analysis</Link>
                            <button className="bg-green-600 text-white px-3 py-1 rounded text-xs">Download Score Card</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No tests attempted yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* View More Button */}
            {stats.recentResults && stats.recentResults.length > 0 && (
              <div className="text-center mt-6">
                <Link href="/student/results" className="bg-blue-600 text-white px-6 py-2 rounded">
                  View More
                </Link>
              </div>
            )}
            
            {/* Disclaimer */}
            <div className="text-center mt-4">
              <p className="text-xs text-gray-500">
                *All the test names are registered trademarks of their respective owners. They neither sponsor nor endorse this product
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-white">
          <div className="text-center py-8">
            <p className="text-lg font-bold text-gray-900">Radiance Education</p>
          </div>
        </div>
      </div>
    </>
  )
}

