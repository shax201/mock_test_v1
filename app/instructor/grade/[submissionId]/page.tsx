'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BandMarkingForm from '@/components/instructor/BandMarkingForm'

interface WritingSubmission {
  id: string
  candidateNumber: string
  studentName: string
  testTitle: string
  tasks: {
    id: string
    title: string
    content: string
    wordCount: number
  }[]
  submittedAt: string
}

export default function GradeWriting({ params }: { params: Promise<{ submissionId: string }> }) {
  const [submission, setSubmission] = useState<WritingSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [marks, setMarks] = useState({
    taskAchievement: 0,
    coherenceCohesion: 0,
    lexicalResource: 0,
    grammarAccuracy: 0
  })
  const [feedback, setFeedback] = useState<Array<{
    text: string
    comment: string
    range: [number, number]
  }>>([])
  const router = useRouter()

  useEffect(() => {
    const fetchSubmission = async () => {
      const resolvedParams = await params;
      // TODO: Fetch real submission data from API
      setTimeout(() => {
        setSubmission({
          id: resolvedParams.submissionId,
        candidateNumber: 'CAND001',
        studentName: 'John Doe',
        testTitle: 'IELTS Academic Mock Test 1',
        tasks: [
          {
            id: 'task1',
            title: 'Task 1',
            content: 'The chart shows the percentage of households in different income brackets in City A and City B. In City A, the majority of households (45%) fall into the middle-income bracket, while 30% are in the high-income category and 25% in the low-income group. City B shows a different pattern with 40% of households in the high-income bracket, 35% in the middle-income category, and 25% in the low-income group. Overall, City B has a higher proportion of high-income households compared to City A.',
            wordCount: 95
          },
          {
            id: 'task2',
            title: 'Task 2',
            content: 'Technology has undoubtedly transformed our lives in numerous ways. While some argue that it has made life more complicated, I believe that technology has primarily made our lives easier and more convenient. One of the most significant benefits of technology is the ease of communication. With smartphones and the internet, we can instantly connect with people around the world. This has revolutionized business, education, and personal relationships. Additionally, technology has automated many tedious tasks, from household chores to complex calculations, freeing up time for more meaningful activities. However, it is important to acknowledge that technology can sometimes create complications, such as privacy concerns and digital dependency. Nevertheless, the overall impact of technology has been overwhelmingly positive, making our lives more efficient and connected.',
            wordCount: 145
          }
        ],
        submittedAt: '2024-01-15T10:30:00Z'
      })
      setLoading(false)
    }, 1000)
    };
    fetchSubmission();
  }, [params])

  const handleMarksChange = (newMarks: typeof marks) => {
    setMarks(newMarks)
  }

  const handleFeedbackAdd = (text: string, comment: string, range: [number, number]) => {
    setFeedback(prev => [...prev, { text, comment, range }])
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/instructor/marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: (await params).submissionId,
          marks,
          feedback
        }),
      })

      if (response.ok) {
        router.push('/instructor')
      } else {
        console.error('Failed to submit marks')
      }
    } catch (error) {
      console.error('Error submitting marks:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Submission not found</h2>
        <p className="mt-2 text-gray-600">The requested submission could not be found.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grade Writing Submission</h1>
            <p className="mt-2 text-gray-600">
              {submission.studentName} - {submission.candidateNumber}
            </p>
            <p className="text-gray-500">{submission.testTitle}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Submitted</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(submission.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Writing Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {submission.tasks.map((task, index) => (
            <div key={task.id} className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {task.wordCount} words
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      task.wordCount >= (task.id === 'task1' ? 150 : 250)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.id === 'task1' ? 'Min: 150' : 'Min: 250'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {task.content}
                  </p>
                </div>
                
                {/* Feedback highlights would go here */}
                {feedback.map((fb, fbIndex) => (
                  <div key={fbIndex} className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Feedback:</strong> {fb.comment}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      On text: "{fb.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Band Marking Form */}
        <div className="lg:col-span-1">
          <BandMarkingForm
            marks={marks}
            onMarksChange={handleMarksChange}
            onFeedbackAdd={handleFeedbackAdd}
            onSubmit={handleSubmit}
            saving={saving}
          />
        </div>
      </div>
    </div>
  )
}
