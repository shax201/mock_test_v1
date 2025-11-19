'use client'

import { useState, useEffect } from 'react'

export interface TableCell {
  id: string
  type: 'text' | 'blank'
  content: string
  blankId?: number // For blank cells, maps to question number (1-9)
  width?: number // Width in pixels for blank cells
}

export interface TableRow {
  id: string
  columns: TableCell[][] // Array of columns, each column contains an array of cells
}

export interface TableStructure {
  title: string
  columns: { label: string; width?: string }[]
  rows: TableRow[]
}

interface DynamicTableEditorProps {
  structure: TableStructure
  onStructureChange: (structure: TableStructure) => void
  initialAnswers?: Record<number, string>
  onAnswersChange?: (answers: Record<number, string>) => void
  readOnly?: boolean
  questionNumbers?: Record<number, number> // Map blank number (1-9) to question number
}

// Helper function to create styled input boxes
const inputBox = (
  blankId: number,
  questionNumber: number | undefined,
  width: number = 120,
  value: string,
  onChange: (value: string) => void,
  readOnly: boolean = false
) => {
  const inputId = questionNumber ? `q${questionNumber}` : `table-blank-${blankId}`
  const placeholder = questionNumber ? String(questionNumber) : ''
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
      placeholder={placeholder}
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

export default function DynamicTableEditor({
  structure,
  onStructureChange,
  initialAnswers = {},
  onAnswersChange,
  readOnly = false,
  questionNumbers
}: DynamicTableEditorProps) {
  const [answers, setAnswers] = useState<Record<number, string>>(initialAnswers)
  const [localStructure, setLocalStructure] = useState<TableStructure>(structure)

  // Sync with structure and initialAnswers when they change
  useEffect(() => {
    setLocalStructure(structure)
  }, [structure])

  useEffect(() => {
    setAnswers(initialAnswers)
  }, [initialAnswers])

  const handleAnswerChange = (blankId: number, value: string) => {
    const newAnswers = { ...answers, [blankId]: value }
    setAnswers(newAnswers)
    if (onAnswersChange) {
      onAnswersChange(newAnswers)
    }
  }

  const handleStructureChange = (newStructure: TableStructure) => {
    setLocalStructure(newStructure)
    onStructureChange(newStructure)
  }

  // Render a cell based on its type
  const renderCell = (cell: TableCell) => {
    if (cell.type === 'blank' && cell.blankId !== undefined) {
      const answerValue = answers[cell.blankId] || ''
      const questionNumber = questionNumbers?.[cell.blankId]
      return inputBox(
        cell.blankId,
        questionNumber,
        cell.width || 120,
        answerValue,
        (val) => handleAnswerChange(cell.blankId!, val),
        readOnly
      )
    } else {
      return <span>{cell.content}</span>
    }
  }

  // Ensure row has columns array matching the number of columns in structure
  const getRowColumns = (row: TableRow) => {
    const columnCount = localStructure.columns.length
    const rowColumns = row.columns || []
    
    // Ensure we have the right number of columns
    while (rowColumns.length < columnCount) {
      rowColumns.push([])
    }
    
    return rowColumns.slice(0, columnCount)
  }

  return (
    <div style={{ width: '100%', marginTop: 20 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
        <thead>
          <tr>
            {localStructure.columns.length > 0 ? (
              <th
                colSpan={localStructure.columns.length}
                style={{
                  textAlign: 'center',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #ddd',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                {localStructure.title}
              </th>
            ) : (
              <th
                style={{
                  textAlign: 'center',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #ddd',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                {localStructure.title}
              </th>
            )}
          </tr>
          {localStructure.columns.length > 0 && (
            <tr>
              {localStructure.columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    textAlign: 'left',
                    padding: '10px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    width: col.width || 'auto'
                  }}
                >
                  {col.label || `Column ${idx + 1}`}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {localStructure.rows.map((row) => {
            const rowColumns = getRowColumns(row)
            return (
              <tr key={row.id}>
                {localStructure.columns.map((col, colIdx) => {
                  const columnCells = rowColumns[colIdx] || []
                  return (
                    <td
                      key={colIdx}
                      style={{
                        padding: '12px',
                        border: '1px solid #ddd',
                        width: col.width || 'auto',
                        verticalAlign: 'top',
                        fontWeight: colIdx === 0 ? 'bold' : 'normal'
                      }}
                    >
                      {columnCells.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: colIdx === 0 ? '0' : '20px' }}>
                          {columnCells.map((cell, cellIdx) => (
                            <li key={cell.id || cellIdx} style={{ marginBottom: '8px', display: 'inline' }}>
                              {renderCell(cell)}
                              {cellIdx < columnCells.length - 1 && ' '}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: '#999' }}>No content</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

