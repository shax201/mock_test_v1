'use client'

import { useState } from 'react'

interface NotesItem {
  id: string
  content: string
  hasBlank: boolean
  blankAnswer?: string
  blankPosition?: number
}

interface NotesCompletionData {
  title: string
  instructions: string
  notes: NotesItem[]
}

interface NotesCompletionEditorProps {
  data: NotesCompletionData
  onChange: (data: NotesCompletionData) => void
}

export default function NotesCompletionEditor({ data, onChange }: NotesCompletionEditorProps) {
  const [localData, setLocalData] = useState<NotesCompletionData>(data)

  const updateData = (updates: Partial<NotesCompletionData>) => {
    const newData = { ...localData, ...updates }
    setLocalData(newData)
    onChange(newData)
  }

  const addNoteItem = () => {
    const newItem: NotesItem = {
      id: `note-${Date.now()}`,
      content: '',
      hasBlank: false
    }
    updateData({
      notes: [...localData.notes, newItem]
    })
  }

  const updateNoteItem = (id: string, updates: Partial<NotesItem>) => {
    const updatedNotes = localData.notes.map(note => 
      note.id === id ? { ...note, ...updates } : note
    )
    updateData({ notes: updatedNotes })
  }

  const removeNoteItem = (id: string) => {
    updateData({
      notes: localData.notes.filter(note => note.id !== id)
    })
  }

  const toggleBlank = (id: string) => {
    const note = localData.notes.find(n => n.id === id)
    if (note) {
      updateNoteItem(id, { 
        hasBlank: !note.hasBlank,
        blankAnswer: !note.hasBlank ? '' : undefined
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title
        </label>
        <input
          type="text"
          value={localData.title}
          onChange={(e) => updateData({ title: e.target.value })}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter the title for the notes completion task"
        />
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions
        </label>
        <textarea
          rows={3}
          value={localData.instructions}
          onChange={(e) => updateData({ instructions: e.target.value })}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter instructions for the notes completion task"
        />
      </div>

      {/* Notes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Notes</h3>
          <button
            type="button"
            onClick={addNoteItem}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Note
          </button>
        </div>

        <div className="space-y-4">
          {localData.notes.map((note, index) => (
            <div key={note.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Note {index + 1}
                  </span>
                  {note.hasBlank && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Has Blank
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => toggleBlank(note.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-md ${
                      note.hasBlank
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {note.hasBlank ? 'Remove Blank' : 'Add Blank'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNoteItem(note.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note Content
                  </label>
                  <textarea
                    rows={2}
                    value={note.content}
                    onChange={(e) => updateNoteItem(note.id, { content: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter the note content..."
                  />
                </div>

                {note.hasBlank && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correct Answer
                    </label>
                    <input
                      type="text"
                      value={note.blankAnswer || ''}
                      onChange={(e) => updateNoteItem(note.id, { blankAnswer: e.target.value })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter the correct answer for this blank"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      {localData.notes.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3">Preview</h4>
          <div className="space-y-3">
            <div>
              <h5 className="font-medium text-blue-800 mb-2">{localData.title || 'Notes Completion'}</h5>
              <p className="text-sm text-blue-700 mb-3">{localData.instructions || 'Complete the notes below.'}</p>
            </div>
            <div className="space-y-2">
              {localData.notes.map((note, index) => (
                <div key={note.id} className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mt-1">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm text-blue-700">
                      {note.content || `Note ${index + 1}`}
                      {note.hasBlank && (
                        <span className="inline-block mx-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded border-2 border-dashed border-yellow-300 text-xs">
                          [BLANK]
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}