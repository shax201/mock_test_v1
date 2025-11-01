'use client'

import { useState } from 'react'
import MatchingHeadingsQuestion from '@/components/test/MatchingHeadingsQuestion'

const sampleQuestion = {
  id: 'demo-q1',
  passage: {
    title: 'THE TALE OF THE PONYTAIL',
    sections: [
      {
        id: 'section-1',
        number: 1,
        content: 'The ponytail hairstyle has ancient origins, dating back to around 1600 B.C.E. in ancient Greece, where it was worn by both men and women. The style was also popular in ancient Rome and Egypt, where it was often adorned with ribbons, beads, or other decorative elements. The ponytail\'s versatility made it a practical choice for various activities, from daily work to formal occasions.',
        hasHeading: true,
        heading: 'A ground-breaking discovery.'
      },
      {
        id: 'section-2',
        number: 2,
        content: 'In the 17th century, the ponytail became a symbol of masculinity when the Manchu people of Northeast China adopted it as their signature hairstyle. When the Manchu conquered China and established the Qing dynasty, they required all Han Chinese men to wear their hair in the same style as a sign of submission. Refusing to adopt the hairstyle could result in severe penalties, including death.',
        hasHeading: true,
        heading: 'A modern trend with historical roots.'
      },
      {
        id: 'section-3',
        number: 3,
        content: 'During the 18th and 19th centuries, the ponytail became known as the "Queue" and was worn by European soldiers as a compulsory hairstyle. It was considered a symbol of masculinity and military discipline. However, as hairstyling techniques advanced and the ponytail became increasingly high-maintenance, it gradually fell out of favor among military personnel.',
        hasHeading: true,
        heading: 'Ponytails in the twentieth century.'
      },
      {
        id: 'section-4',
        number: 4,
        content: 'The ponytail experienced a decline in popularity during the 1930s and 1940s, largely due to the influence of Hollywood\'s glamorous curls and waves. However, it made a comeback in the 1950s as a "schoolgirl hairstyle," becoming associated with youth and innocence. By the 1960s, it had evolved into a "classic hairdo for the girl next door," and by the 1990s, it had transformed into a "powerhouse hairstyle" worn by successful women in various professions.',
        hasHeading: false
      },
      {
        id: 'section-5',
        number: 5,
        content: 'By 2012, the ponytail had even scored its own emoji, becoming one of the most recognizable hairstyles in digital communication. Today, it remains a versatile and practical choice for people of all ages and backgrounds, from athletes and dancers to business professionals and students. Its enduring popularity speaks to its perfect balance of functionality and style.',
        hasHeading: false
      }
    ]
  },
  headings: [
    'A common hairstyle for school girls',
    'Cross-cultural introduction of ponytail',
    'Conquest of Northeast China',
    'A strange finding',
    'A symbol of masculinity',
    'An expectation for the future'
  ],
  correctAnswers: {
    'section-4': 'A common hairstyle for school girls',
    'section-5': 'An expectation for the future'
  },
  instructions: 'Read the text below and answer questions 1-6. Choose the correct heading for each section and move it into the gap.'
}

export default function TestMatchingHeadings() {
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const handleAnswerChange = (newAnswers: Record<string, string>) => {
    setAnswers(newAnswers)
    console.log('Answers updated:', newAnswers)
  }

  return (
    <div className="h-screen">
      <div className="absolute top-4 left-4 z-10 bg-white p-2 rounded shadow">
        <p className="text-xs text-gray-600">Answers: {JSON.stringify(answers)}</p>
        <button 
          onClick={() => {
            const testAnswers = { 'section-4': 'A common hairstyle for school girls' }
            setAnswers(testAnswers)
            handleAnswerChange(testAnswers)
          }}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded mt-1"
        >
          Test Fill Gap 4
        </button>
      </div>
      <MatchingHeadingsQuestion
        question={sampleQuestion}
        onAnswerChange={handleAnswerChange}
        initialAnswers={answers}
        disabled={false}
      />
    </div>
  )
}
