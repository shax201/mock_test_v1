'use client'

import { useState, useEffect } from 'react'

interface RainwaterTableProps {
  initialAnswers?: Record<number, string>
  onAnswersChange?: (answers: Record<number, string>) => void
  readOnly?: boolean
  questionNumbers?: Record<number, number> // Map blank number (1-9) to question number
}

// Helper function to create styled input boxes
const inputBox = (blankId: number, questionNumber: number | undefined, width: number = 120, value: string, onChange: (value: string) => void, readOnly: boolean = false) => {
  const inputId = questionNumber ? `q${questionNumber}` : `table-blank-${blankId}`
  return (
    <input
      type="text"
      id={inputId}
      className="answer-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      disabled={readOnly}
      spellCheck={false}
      autoComplete="off"
      style={{
        width: `${width}px`,
        border: '2px solid #007bff',
        borderRadius: '4px',
        padding: '4px',
        display: 'inline-block',
        margin: '0 2px',
        fontSize: '14px',
        textAlign: 'center',
        backgroundColor: readOnly ? '#f5f5f5' : '#fff',
        cursor: readOnly ? 'not-allowed' : 'text',
        boxSizing: 'border-box'
      }}
    />
  )
}

export default function RainwaterTable({ initialAnswers = {}, onAnswersChange, readOnly = false, questionNumbers }: RainwaterTableProps) {
  const [answers, setAnswers] = useState<Record<number, string>>(initialAnswers)

  // Sync with initialAnswers when they change
  useEffect(() => {
    setAnswers(initialAnswers)
  }, [initialAnswers])

  const handleAnswerChange = (id: number, value: string) => {
    const newAnswers = { ...answers, [id]: value }
    setAnswers(newAnswers)
    if (onAnswersChange) {
      onAnswersChange(newAnswers)
    }
  }

  return (
    <div style={{ width: '100%', marginTop: 20 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
        <thead>
          <tr>
            <th colSpan={2} style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', fontSize: '18px', fontWeight: 'bold' }}>
              RAINWATER HARVESTING
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Definition Row */}
          <tr>
            <td style={{ padding: '12px', border: '1px solid #ddd', width: '30%', verticalAlign: 'top', fontWeight: 'bold' }}>
              Definition
            </td>
            <td style={{ padding: '12px', border: '1px solid #ddd', verticalAlign: 'top' }}>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>
                  • Mindful {inputBox(1, questionNumbers?.[1], 100, answers[1] || '', (val) => handleAnswerChange(1, val), readOnly)} and storage of rainwater.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  • Meeting the demand for drinking and irrigation.
                </li>
              </ul>
            </td>
          </tr>

          {/* Purposes Row */}
          <tr>
            <td style={{ padding: '12px', border: '1px solid #ddd', width: '30%', verticalAlign: 'top', fontWeight: 'bold' }}>
              Purposes
            </td>
            <td style={{ padding: '12px', border: '1px solid #ddd', verticalAlign: 'top' }}>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>
                  • Stop decline in water availability.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  • {inputBox(2, questionNumbers?.[2], 100, answers[2] || '', (val) => handleAnswerChange(2, val), readOnly)} the water resources.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  • Reduce effects of soil erosion.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  • Develop the habit of water {inputBox(3, questionNumbers?.[3], 100, answers[3] || '', (val) => handleAnswerChange(3, val), readOnly)}.
                </li>
              </ul>
            </td>
          </tr>

          {/* Effective Water Management Row */}
          <tr>
            <td style={{ padding: '12px', border: '1px solid #ddd', width: '30%', verticalAlign: 'top', fontWeight: 'bold' }}>
              Effective Water Management
            </td>
            <td style={{ padding: '12px', border: '1px solid #ddd', verticalAlign: 'top' }}>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>
                  • Revival of conventional aquifers.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  • Replenishing {inputBox(4, questionNumbers?.[4], 100, answers[4] || '', (val) => handleAnswerChange(4, val), readOnly)} water table.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  • Understanding the importance of water for survival.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  • Lackadaisical approach of the governments and {inputBox(5, questionNumbers?.[5], 120, answers[5] || '', (val) => handleAnswerChange(5, val), readOnly)}.
                </li>
              </ul>
            </td>
          </tr>

          {/* Components of the system Row */}
          <tr>
            <td style={{ padding: '12px', border: '1px solid #ddd', width: '30%', verticalAlign: 'top', fontWeight: 'bold' }}>
              Components of the system
            </td>
            <td style={{ padding: '12px', border: '1px solid #ddd', verticalAlign: 'top' }}>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>
                  • Catchment area: it is a {inputBox(6, questionNumbers?.[6], 120, answers[6] || '', (val) => handleAnswerChange(6, val), readOnly)} that receives the downpour.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  • Transportation: water moves to the storage area through {inputBox(7, questionNumbers?.[7], 120, answers[7] || '', (val) => handleAnswerChange(7, val), readOnly)}.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  • First flush: the water is passed through this.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  • Filter: it removes contaminants and can consist of charcoal, sand, gravel, PVC pipes or {inputBox(8, questionNumbers?.[8], 100, answers[8] || '', (val) => handleAnswerChange(8, val), readOnly)} filters.
                </li>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{inputBox(9, questionNumbers?.[9], 200, answers[9] || '', (val) => handleAnswerChange(9, val), readOnly)}</span>
                  <span>rainwater harvesting</span>
                </li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

