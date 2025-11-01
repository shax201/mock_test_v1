'use client'

import { useState } from 'react'
import QuestionRenderer from './QuestionRenderer'

// Sample questions demonstrating different question types
const sampleQuestions = [
  {
    id: 'q1',
    type: 'FIB' as const,
    content: 'Complete the following sentences using information from the passage.',
    fibData: {
      content: 'Gerald Lawson was born in the <span class="blank-field" data-blank-id="blank-1">[BLANK]</span>s and grew up in a community that valued <span class="blank-field" data-blank-id="blank-2">[BLANK]</span> and technical skills.',
      blanks: [
        {
          id: 'blank-1',
          position: 1,
          correctAnswer: '1940',
          alternatives: ['1940s'],
          caseSensitive: false
        },
        {
          id: 'blank-2',
          position: 2,
          correctAnswer: 'education',
          alternatives: ['learning', 'knowledge'],
          caseSensitive: false
        }
      ],
      instructions: 'Write ONE WORD ONLY from the passage for each answer.'
    },
    correctAnswer: '1940, education',
    points: 2
  },
  {
    id: 'q2',
    type: 'TRUE_FALSE' as const,
    content: 'Lawson launched his own radio station as a teenager.',
    correctAnswer: 'TRUE',
    points: 1
  },
  {
    id: 'q3',
    type: 'NOT_GIVEN' as const,
    content: 'Lawson won a Nobel Prize for his contributions to technology.',
    correctAnswer: 'NOT_GIVEN',
    points: 1
  },
  {
    id: 'q4',
    type: 'MCQ' as const,
    content: 'What was Lawson\'s most significant contribution to video gaming?',
    options: [
      'A) Creating the first video game console',
      'B) Developing interchangeable game cartridges',
      'C) Inventing the first video game',
      'D) Starting the first video game company'
    ],
    correctAnswer: 'B) Developing interchangeable game cartridges',
    points: 1
  },
  {
    id: 'q5',
    type: 'MATCHING' as const,
    content: 'Match the following events with the correct time periods.',
    matchingData: {
      leftItems: [
        { id: 'event-1', label: '1', content: 'Lawson was born' },
        { id: 'event-2', label: '2', content: 'Lawson launched radio station' },
        { id: 'event-3', label: '3', content: 'Lawson worked on Fairchild Channel F' }
      ],
      rightItems: [
        { id: 'period-1', label: 'A', content: '1940s' },
        { id: 'period-2', label: 'B', content: '1960s' },
        { id: 'period-3', label: 'C', content: '1970s' }
      ]
    },
    correctAnswer: {
      'event-1': 'period-1',
      'event-2': 'period-2', 
      'event-3': 'period-3'
    },
    points: 3
  }
]

export default function ReadingQuestionExamples() {
  const [answers, setAnswers] = useState<Record<string, string | Record<string, string>>>({})

  const handleAnswerChange = (questionId: string, answer: string | Record<string, string>) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">IELTS Reading Question Types Demo</h1>
        <p className="text-gray-600">
          This demonstrates the different types of reading questions that can be created in the IELTS mock test system.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Sample Reading Passage</h2>
        <div className="prose max-w-none mb-8">
          <h3 className="text-lg font-bold mb-4">Gerald "Jerry" Lawson: Video Game Pioneer</h3>
          <p className="mb-4">
            Gerald "Jerry" Lawson was an African American engineer who played a crucial role in the development of home video game consoles. Born in the 1940s to a black longshoreman's family, Lawson grew up in a community that valued education and technical skills. His early exposure to electronics and radio technology would later prove invaluable in his career.
          </p>
          <p className="mb-4">
            Lawson's journey into technology began in Jamaica, where he launched his own radio station as a teenager. This entrepreneurial spirit, combined with his technical knowledge, led him to make a living by selling walkie-talkies that were modified for amateur radio use. His understanding of both hardware and software would become a defining characteristic of his work in the video game industry.
          </p>
          <p className="mb-4">
            After studying electronics in two different colleges in New York, Lawson worked as an engineer for several organizations throughout the 1960s. His expertise in semiconductor technology and digital systems made him a valuable asset in the rapidly evolving field of consumer electronics. Later in the decade, he moved to the West Coast, where the burgeoning technology sector offered new opportunities for innovation.
          </p>
          <p className="mb-4">
            The 1970s marked a turning point in Lawson's career when he advanced his position in Silicon Valley by creating a new gaming department. This was a time when video games were transitioning from arcade machines to home consoles, and Lawson's vision was instrumental in this transformation. His work would eventually lead to the development of cartridge-based gaming systems that could play multiple games.
          </p>
          <p>
            Lawson's most significant contribution came through his work on the Fairchild Channel F console, which featured interchangeable game cartridges. This innovation allowed consumers to purchase different games without buying entirely new systems, fundamentally changing how video games were distributed and consumed. His pioneering work in this area laid the groundwork for future gaming consoles and established the cartridge-based model that dominated the industry for decades.
          </p>
        </div>

        <div className="space-y-8">
          {sampleQuestions.map((question, index) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              questionNumber={index + 1}
              onAnswerChange={handleAnswerChange}
              initialAnswer={answers[question.id]}
              disabled={false}
              showInstructions={true}
            />
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Current Answers:</h3>
          <pre className="text-sm text-gray-600 overflow-auto">
            {JSON.stringify(answers, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
