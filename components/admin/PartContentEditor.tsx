'use client'

import { useState, useEffect, useRef } from 'react'

interface PartContentEditorProps {
  data: string
  onChange: (data: string) => void
  placeholder?: string
  disabled?: boolean
  partNumber: number
}

export default function PartContentEditor({ 
  data, 
  onChange, 
  placeholder = 'Start typing your content here...',
  disabled = false,
  partNumber
}: PartContentEditorProps) {
  const [localData, setLocalData] = useState(data)
  const [isFocused, setIsFocused] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Only update local data when external data changes and it's different
  useEffect(() => {
    if (data !== localData) {
      setLocalData(data)
    }
  }, [data])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setLocalData(value)
    // Debounce the onChange to prevent rapid updates
    setTimeout(() => {
      onChange(value)
    }, 100)
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Ensure final value is saved on blur
    onChange(localData)
  }

  const insertText = (text: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newText = localData.substring(0, start) + text + localData.substring(end)
      setLocalData(newText)
      onChange(newText)
      
      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + text.length, start + text.length)
      }, 0)
    }
  }

  const formatText = (format: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = localData.substring(start, end)
      
      let formattedText = selectedText
      switch (format) {
        case 'bold':
          formattedText = `**${selectedText}**`
          break
        case 'italic':
          formattedText = `*${selectedText}*`
          break
        case 'underline':
          formattedText = `__${selectedText}__`
          break
        case 'heading':
          formattedText = `# ${selectedText}`
          break
        case 'subheading':
          formattedText = `## ${selectedText}`
          break
      }
      
      const newText = localData.substring(0, start) + formattedText + localData.substring(end)
      setLocalData(newText)
      onChange(newText)
      
      // Set cursor position after formatted text
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + formattedText.length, start + formattedText.length)
      }, 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          formatText('bold')
          break
        case 'i':
          e.preventDefault()
          formatText('italic')
          break
        case 'u':
          e.preventDefault()
          formatText('underline')
          break
      }
    }
  }

  if (!isClient) {
    return (
      <div className="w-full min-h-[200px] p-4 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading editor for Part {partNumber}...</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-300 border-b-0 rounded-t-lg">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => formatText('bold')}
            className="px-3 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            title="Bold (Ctrl+B)"
            disabled={disabled}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => formatText('italic')}
            className="px-3 py-1 text-sm italic border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            title="Italic (Ctrl+I)"
            disabled={disabled}
          >
            I
          </button>
          <button
            type="button"
            onClick={() => formatText('underline')}
            className="px-3 py-1 text-sm underline border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            title="Underline (Ctrl+U)"
            disabled={disabled}
          >
            U
          </button>
        </div>
        
        <div className="w-px h-6 bg-gray-300"></div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => formatText('heading')}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            title="Heading"
            disabled={disabled}
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => formatText('subheading')}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            title="Subheading"
            disabled={disabled}
          >
            H2
          </button>
        </div>
        
        <div className="w-px h-6 bg-gray-300"></div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertText('• ')}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            title="Bullet List"
            disabled={disabled}
          >
            •
          </button>
          <button
            type="button"
            onClick={() => insertText('1. ')}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            title="Numbered List"
            disabled={disabled}
          >
            1.
          </button>
        </div>
      </div>
      
      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={localData}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full min-h-[200px] p-4 border border-gray-300 rounded-b-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
          isFocused ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{ 
          fontFamily: 'inherit',
          lineHeight: '1.6',
          fontSize: '14px'
        }}
      />
      
      {/* Status Bar */}
      <div className="flex justify-between items-center px-3 py-2 text-xs text-gray-500 bg-gray-50 border border-gray-300 border-t-0 rounded-b-lg">
        <div className="flex items-center gap-4">
          <span>Characters: {localData.length}</span>
          <span>Lines: {localData.split('\n').length}</span>
          <span>Words: {localData.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
        </div>
        <div className="text-xs text-gray-400">
          Use **bold**, *italic*, __underline__, # heading, ## subheading
        </div>
      </div>
    </div>
  )
}
