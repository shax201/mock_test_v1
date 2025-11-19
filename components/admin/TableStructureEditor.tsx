'use client'

import { useState } from 'react'
import { TableStructure, TableRow, TableCell } from './DynamicTableEditor'

interface TableStructureEditorProps {
  structure: TableStructure
  onStructureChange: (structure: TableStructure) => void
  questionNumbers?: Record<number, number>
}

export default function TableStructureEditor({
  structure,
  onStructureChange,
  questionNumbers
}: TableStructureEditorProps) {
  const [localStructure, setLocalStructure] = useState<TableStructure>(structure)

  const updateStructure = (newStructure: TableStructure) => {
    setLocalStructure(newStructure)
    onStructureChange(newStructure)
  }

  const updateTitle = (title: string) => {
    updateStructure({ ...localStructure, title })
  }

  const addColumn = () => {
    const newColumn = {
      label: `Column ${localStructure.columns.length + 1}`,
      width: 'auto'
    }
    updateStructure({
      ...localStructure,
      columns: [...localStructure.columns, newColumn],
      rows: localStructure.rows.map(row => {
        const currentColumns = row.columns || []
        return {
          ...row,
          columns: [...currentColumns, []] // Add empty column cells
        }
      })
    })
  }

  const removeColumn = (colIndex: number) => {
    if (localStructure.columns.length <= 1) return // Keep at least one column
    
    updateStructure({
      ...localStructure,
      columns: localStructure.columns.filter((_, idx) => idx !== colIndex),
      rows: localStructure.rows.map(row => {
        const currentColumns = row.columns || []
        return {
          ...row,
          columns: currentColumns.filter((_, idx) => idx !== colIndex)
        }
      })
    })
  }

  const updateColumn = (colIndex: number, updates: { label?: string; width?: string }) => {
    updateStructure({
      ...localStructure,
      columns: localStructure.columns.map((col, idx) => 
        idx === colIndex ? { ...col, ...updates } : col
      )
    })
  }

  const addRow = () => {
    const newRow: TableRow = {
      id: `row-${Date.now()}`,
      columns: localStructure.columns.map(() => [
        { id: `cell-${Date.now()}-${Math.random()}`, type: 'text', content: '' }
      ])
    }
    updateStructure({
      ...localStructure,
      rows: [...localStructure.rows, newRow]
    })
  }

  const removeRow = (rowId: string) => {
    updateStructure({
      ...localStructure,
      rows: localStructure.rows.filter(r => r.id !== rowId)
    })
  }

  // Helper function to get next available blank ID
  const getNextBlankId = (): number => {
    const allBlankIds = new Set<number>()
    localStructure.rows.forEach(r => {
      (r.columns || []).forEach(col => {
        col.forEach(c => {
          if (c.type === 'blank' && c.blankId !== undefined) {
            allBlankIds.add(c.blankId)
          }
        })
      })
    })
    let nextBlankId = 1
    while (allBlankIds.has(nextBlankId)) {
      nextBlankId++
    }
    return nextBlankId
  }

  const addCell = (rowId: string, colIndex: number, afterCellId?: string) => {
    const newCell: TableCell = {
      id: `cell-${Date.now()}-${Math.random()}`,
      type: 'text',
      content: ''
    }
    updateStructure({
      ...localStructure,
      rows: localStructure.rows.map(row => {
        if (row.id !== rowId) return row
        const currentColumns = row.columns || []
        const columnCells = currentColumns[colIndex] || []
        
        if (afterCellId) {
          const index = columnCells.findIndex(c => c.id === afterCellId)
          const newCells = [...columnCells]
          newCells.splice(index + 1, 0, newCell)
          const newColumns = [...currentColumns]
          newColumns[colIndex] = newCells
          return { ...row, columns: newColumns }
        }
        
        const newColumns = [...currentColumns]
        newColumns[colIndex] = [...columnCells, newCell]
        return { ...row, columns: newColumns }
      })
    })
  }

  // Add a blank cell directly to a specific column in a row
  const addBlankToRow = (rowId: string, colIndex: number, afterCellId?: string) => {
    const nextBlankId = getNextBlankId()
    const newBlankCell: TableCell = {
      id: `cell-${Date.now()}-${Math.random()}`,
      type: 'blank',
      content: '',
      blankId: nextBlankId,
      width: 120
    }
    updateStructure({
      ...localStructure,
      rows: localStructure.rows.map(row => {
        if (row.id !== rowId) return row
        const currentColumns = row.columns || []
        const columnCells = currentColumns[colIndex] || []
        
        if (afterCellId) {
          const index = columnCells.findIndex(c => c.id === afterCellId)
          const newCells = [...columnCells]
          newCells.splice(index + 1, 0, newBlankCell)
          const newColumns = [...currentColumns]
          newColumns[colIndex] = newCells
          return { ...row, columns: newColumns }
        }
        
        const newColumns = [...currentColumns]
        newColumns[colIndex] = [...columnCells, newBlankCell]
        return { ...row, columns: newColumns }
      })
    })
  }

  const removeCell = (rowId: string, colIndex: number, cellId: string) => {
    updateStructure({
      ...localStructure,
      rows: localStructure.rows.map(row => {
        if (row.id !== rowId) return row
        const currentColumns = row.columns || []
        const newColumns = [...currentColumns]
        newColumns[colIndex] = (newColumns[colIndex] || []).filter(c => c.id !== cellId)
        return { ...row, columns: newColumns }
      })
    })
  }

  const updateCell = (rowId: string, colIndex: number, cellId: string, updates: Partial<TableCell>) => {
    updateStructure({
      ...localStructure,
      rows: localStructure.rows.map(row => {
        if (row.id !== rowId) return row
        const currentColumns = row.columns || []
        const newColumns = [...currentColumns]
        newColumns[colIndex] = (newColumns[colIndex] || []).map(cell => {
          if (cell.id !== cellId) return cell
          return { ...cell, ...updates }
        })
        return { ...row, columns: newColumns }
      })
    })
  }

  const toggleCellType = (rowId: string, colIndex: number, cellId: string) => {
    const row = localStructure.rows.find(r => r.id === rowId)
    const columnCells = row?.columns?.[colIndex] || []
    const cell = columnCells.find(c => c.id === cellId)
    if (!cell) return

    if (cell.type === 'text') {
      // Convert to blank - need to assign a blankId
      const nextBlankId = getNextBlankId()
      updateCell(rowId, colIndex, cellId, {
        type: 'blank',
        blankId: nextBlankId,
        content: '',
        width: 120
      })
    } else {
      // Convert to text
      updateCell(rowId, colIndex, cellId, {
        type: 'text',
        blankId: undefined,
        width: undefined,
        content: ''
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Table Title */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Table Title
        </label>
        <input
          type="text"
          value={localStructure.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="TABLE TITLE"
        />
      </div>

      {/* Columns Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-gray-700">
            Table Columns
          </label>
          <button
            type="button"
            onClick={addColumn}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            + Add Column
          </button>
        </div>

        {localStructure.columns.map((col, colIndex) => (
          <div key={colIndex} className="border border-gray-200 rounded-lg p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 flex items-center gap-2 mr-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Column {colIndex + 1} Label
                  </label>
                  <input
                    type="text"
                    value={col.label || ''}
                    onChange={(e) => updateColumn(colIndex, { label: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder={`Column ${colIndex + 1}`}
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Width
                  </label>
                  <input
                    type="text"
                    value={col.width || 'auto'}
                    onChange={(e) => updateColumn(colIndex, { width: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="30% or auto"
                  />
                </div>
              </div>
              {localStructure.columns.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeColumn(colIndex)}
                  className="text-xs text-red-600 hover:text-red-800 mt-6"
                >
                  Remove Column
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Rows Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-gray-700">
            Table Rows
          </label>
          <button
            type="button"
            onClick={addRow}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            + Add Row
          </button>
        </div>

        {localStructure.rows.map((row, rowIndex) => {
          const rowColumns = row.columns || []
          // Ensure row has columns for all structure columns
          const paddedColumns = localStructure.columns.map((_, colIdx) => 
            rowColumns[colIdx] || []
          )
          
          return (
            <div key={row.id} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-medium text-gray-700">
                  Row {rowIndex + 1}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Add blank to the last column (usually where answers go)
                      const targetColIndex = localStructure.columns.length > 1 
                        ? localStructure.columns.length - 1 
                        : 0
                      addBlankToRow(row.id, targetColIndex)
                    }}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    title="Add blank to this row"
                  >
                    + Add Blank
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove Row
                  </button>
                </div>
              </div>

              {/* Columns for this row */}
              <div className="space-y-3">
                {localStructure.columns.map((col, colIndex) => {
                  const columnCells = paddedColumns[colIndex] || []
                  return (
                    <div key={colIndex} className="border border-gray-100 rounded p-2 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-gray-700">
                          {col.label || `Column ${colIndex + 1}`}
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addBlankToRow(row.id, colIndex)}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            title="Add blank to this column"
                          >
                            + Blank
                          </button>
                          <button
                            type="button"
                            onClick={() => addCell(row.id, colIndex)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            + Text
                          </button>
                        </div>
                      </div>

                      {columnCells.map((cell, cellIndex) => (
                        <div key={cell.id} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 mb-2">
                          <div className="flex-1 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleCellType(row.id, colIndex, cell.id)}
                              className={`text-xs px-2 py-1 rounded ${
                                cell.type === 'blank'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {cell.type === 'blank' ? 'Blank' : 'Text'}
                            </button>

                            {cell.type === 'text' ? (
                              <input
                                type="text"
                                value={cell.content}
                                onChange={(e) => updateCell(row.id, colIndex, cell.id, { content: e.target.value })}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="Text content"
                              />
                            ) : (
                              <div className="flex-1 flex items-center gap-2">
                                <span className="text-xs text-gray-600">Blank #{cell.blankId}</span>
                                <input
                                  type="number"
                                  value={cell.width || 120}
                                  onChange={(e) => updateCell(row.id, colIndex, cell.id, { width: parseInt(e.target.value) || 120 })}
                                  className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  placeholder="Width"
                                  min="50"
                                  max="500"
                                />
                                <span className="text-xs text-gray-500">px</span>
                                {questionNumbers && cell.blankId && (
                                  <span className="text-xs text-gray-500">
                                    (Q{questionNumbers[cell.blankId] || '?'})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => addCell(row.id, colIndex, cell.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                              title="Add cell after"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCell(row.id, colIndex, cell.id)}
                              className="text-xs text-red-600 hover:text-red-800"
                              title="Remove cell"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

