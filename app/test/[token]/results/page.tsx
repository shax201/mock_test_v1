'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DetailedScoreResult {
  moduleType: 'READING' | 'LISTENING' | 'WRITING'
  bandScore: number
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  partScores: {
    part1: { score: number; total: number; correct: number; bandScore: number }
    part2: { score: number; total: number; correct: number; bandScore: number }
    part3: { score: number; total: number; correct: number; bandScore: number }
  }
  questionTypeScores: {
    type: string
    correct: number
    total: number
    accuracy: number
    bandScore: number
  }[]
}

interface Assignment {
  id: string
  candidateNumber: string
  studentName: string
  mockTitle: string
}

export default function TestResults({ params }: { params: Promise<{ token: string }> }) {
  const [loading, setLoading] = useState(true)
  const [detailedScore, setDetailedScore] = useState<DetailedScoreResult | null>(null)
  const [assignment, setAssignment] = useState<any>(null)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { token } = await params
        const response = await fetch(`/api/student/submission-scores?token=${encodeURIComponent(token)}`)
        
        if (response.ok) {
          const data = await response.json()
          setAssignment({
            candidateNumber: data.candidateNumber,
            studentName: data.studentName,
            mockTitle: data.testTitle
          })

          // Get the most recent module score (assuming single module for now)
          const moduleScores = data.detailedScores
          const moduleType = Object.keys(moduleScores)[0]
          const moduleScore = moduleScores[moduleType]
          
          if (moduleScore) {
            setDetailedScore(moduleScore)
            
            // Animate the score
            const targetScore = moduleScore.bandScore
            const duration = 2000
            const startTime = Date.now()
            
            const animate = () => {
              const elapsed = Date.now() - startTime
              const progress = Math.min(elapsed / duration, 1)
              const easeOut = 1 - Math.pow(1 - progress, 3)
              const currentScore = targetScore * easeOut
              
              setAnimatedScore(Math.round(currentScore * 10) / 10)
              
              if (progress < 1) {
                requestAnimationFrame(animate)
              }
            }
            
            requestAnimationFrame(animate)
          }
        } else {
          setError('Failed to load results')
        }
      } catch (error) {
        console.error('Error fetching results:', error)
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [params])

  const getModuleIcon = () => {
    if (!detailedScore) return null
    
    switch (detailedScore.moduleType) {
      case 'READING':
        return (
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      case 'LISTENING':
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )
      case 'WRITING':
        return (
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getBandColor = (band: number) => {
    if (band >= 7.0) return 'text-green-600 bg-green-100'
    if (band >= 6.0) return 'text-yellow-600 bg-yellow-100'
    if (band >= 5.0) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getBandDescription = (band: number) => {
    if (band >= 9.0) return 'Expert User'
    if (band >= 8.0) return 'Very Good User'
    if (band >= 7.0) return 'Good User'
    if (band >= 6.0) return 'Competent User'
    if (band >= 5.0) return 'Modest User'
    if (band >= 4.0) return 'Limited User'
    if (band >= 3.0) return 'Extremely Limited User'
    if (band >= 2.0) return 'Intermittent User'
    if (band >= 1.0) return 'Non User'
    return 'Did not attempt'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Calculating Your Score</h3>
          <p className="text-sm text-gray-600">Please wait while we process your results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/test')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Test Entry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/student" className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-lg">R</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                      RADIANCE
                    </h1>
                    <p className="text-sm text-gray-500 -mt-1">A Touch of Quality Education</p>
                    <p className="text-lg font-bold text-red-600 -mt-1">EDUCATION</p>
                  </div>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Test Results</span>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              {getModuleIcon()}
            </div>
            <div>
              <h1 className="text-3xl font-bold">Test Results</h1>
              <p className="text-blue-100">{detailedScore?.moduleType} Module</p>
            </div>
          </div>
          
          {assignment && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-200">Candidate:</span>
                <span className="ml-2 font-medium">{assignment.candidateNumber}</span>
              </div>
              <div>
                <span className="text-blue-200">Test:</span>
                <span className="ml-2 font-medium">{assignment.mockTitle}</span>
              </div>
              <div>
                <span className="text-blue-200">Completed:</span>
                <span className="ml-2 font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Overall Score */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-6">
            <div className="text-5xl font-bold text-gray-900">
              {animatedScore}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Band Score</h2>
          <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-medium ${getBandColor(animatedScore)}`}>
            {getBandDescription(animatedScore)}
          </div>
        </div>

        {/* Detailed Results */}
        {detailedScore && (
          <div className="space-y-8">
            {/* Performance Overview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{detailedScore.correctAnswers}</div>
                  <div className="text-sm font-medium text-blue-600">Correct Answers</div>
                </div>
                <div className="bg-green-50 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{detailedScore.totalQuestions}</div>
                  <div className="text-sm font-medium text-green-600">Total Questions</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{detailedScore.accuracy}%</div>
                  <div className="text-sm font-medium text-purple-600">Accuracy</div>
                </div>
              </div>
            </div>

            {/* Part-wise Performance */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Part-wise Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(detailedScore.partScores).map(([part, data]) => (
                  <div key={part} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900 capitalize">{part}</h4>
                      <span className={`text-lg font-bold px-3 py-1 rounded-full ${getBandColor(data.bandScore)}`}>
                        {data.bandScore}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      {data.correct}/{data.total} correct
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${(data.correct / data.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Type Performance */}
            {detailedScore.questionTypeScores.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Question Type Performance</h3>
                <div className="space-y-4">
                  {detailedScore.questionTypeScores.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-lg font-medium text-gray-900">{item.type}</div>
                        <div className="text-sm text-gray-500">{item.correct}/{item.total} correct</div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="w-32 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${item.accuracy}%` }}
                          ></div>
                        </div>
                        <div className="text-lg font-medium text-gray-900 w-16 text-right">
                          {item.accuracy}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

   
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <p className="text-lg font-bold text-gray-900">Radiance Education</p>
            <p className="text-sm text-gray-500 mt-2">A Touch of Quality Education</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
