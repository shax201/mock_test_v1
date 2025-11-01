'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ImmediateResultsProps {
  token: string | Promise<string>
  moduleType: 'READING' | 'LISTENING' | 'WRITING'
  submissionData: {
    submissionId: string
    score?: {
      correctCount: number
      totalQuestions: number
      bandScore: number
    }
  }
  onClose: () => void
}

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

export default function ImmediateResults({ token, moduleType, submissionData, onClose }: ImmediateResultsProps) {
  const [loading, setLoading] = useState(true)
  const [detailedScore, setDetailedScore] = useState<DetailedScoreResult | null>(null)
  const [animatedScore, setAnimatedScore] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const fetchDetailedScore = async () => {
      try {
        const resolvedToken = typeof token === 'string' ? token : await token
        const response = await fetch(`/api/student/submission-scores?token=${encodeURIComponent(resolvedToken)}`)
        if (response.ok) {
          const data = await response.json()
          const moduleScore = data.detailedScores?.[moduleType.toLowerCase()]
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
        }
      } catch (error) {
        console.error('Error fetching detailed score:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDetailedScore()
  }, [token, moduleType])

  const getModuleIcon = () => {
    switch (moduleType) {
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Calculating Your Score</h3>
            <p className="text-sm text-gray-600">Please wait while we process your results...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                {getModuleIcon()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">Test Results</h2>
                <p className="text-blue-100">{moduleType} Module</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Overall Score */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-4">
              <div className="text-4xl font-bold text-gray-900">
                {animatedScore}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Band Score</h3>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getBandColor(animatedScore)}`}>
              {getBandDescription(animatedScore)}
            </div>
          </div>

          {/* Detailed Results */}
          {detailedScore && (
            <div className="space-y-6">
              {/* Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{detailedScore.correctAnswers}</div>
                  <div className="text-sm font-medium text-blue-600">Correct Answers</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{detailedScore.totalQuestions}</div>
                  <div className="text-sm font-medium text-green-600">Total Questions</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{detailedScore.accuracy}%</div>
                  <div className="text-sm font-medium text-purple-600">Accuracy</div>
                </div>
              </div>

              {/* Part-wise Performance */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Part-wise Performance</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(detailedScore.partScores).map(([part, data]) => (
                    <div key={part} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900 capitalize">{part}</h5>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${getBandColor(data.bandScore)}`}>
                          {data.bandScore}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {data.correct}/{data.total} correct
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(data.correct / data.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Type Performance */}
              {detailedScore.questionTypeScores.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Question Type Performance</h4>
                  <div className="space-y-3">
                    {detailedScore.questionTypeScores.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{item.type}</div>
                          <div className="text-xs text-gray-500">{item.correct}/{item.total} correct</div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${item.accuracy}%` }}
                            ></div>
                          </div>
                          <div className="text-sm font-medium text-gray-900 w-12 text-right">
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              onClick={async () => {
                const resolvedToken = typeof token === 'string' ? token : await token
                router.push(`/test/${resolvedToken}/complete`)
              }}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Complete Results
            </button>
            
            <button
              onClick={async () => {
                const resolvedToken = typeof token === 'string' ? token : await token
                router.push(`/test/${resolvedToken}`)
              }}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Continue to Next Module
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
