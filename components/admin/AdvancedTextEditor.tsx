'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface AdvancedTextEditorProps {
  data: string
  onChange: (data: string) => void
  placeholder?: string
  disabled?: boolean
  minHeight?: number
  maxHeight?: number
}

export default function AdvancedTextEditor({ 
  data, 
  onChange, 
  placeholder = 'Start typing your content here...',
  disabled = false,
  minHeight = 200,
  maxHeight = 600
}: AdvancedTextEditorProps) {
  const [localData, setLocalData] = useState(data)
  const [isFocused, setIsFocused] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const [selectedText, setSelectedText] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    setLocalData(data)
  }, [data])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setLocalData(value)
    onChange(value)
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  const handleSelection = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selected = localData.substring(start, end)
      setSelectedText(selected)
      setCursorPosition(start)
    }
  }, [localData])

  const insertText = (text: string, replaceSelection = true) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      
      let newText: string
      if (replaceSelection && selectedText) {
        newText = localData.substring(0, start) + text + localData.substring(end)
      } else {
        newText = localData.substring(0, start) + text + localData.substring(end)
      }
      
      setLocalData(newText)
      onChange(newText)
      
      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.focus()
        const newCursorPos = start + text.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
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
      let newCursorPos = start
      
      switch (format) {
        case 'bold':
          formattedText = `**${selectedText}**`
          newCursorPos = start + 2
          break
        case 'italic':
          formattedText = `*${selectedText}*`
          newCursorPos = start + 1
          break
        case 'underline':
          formattedText = `__${selectedText}__`
          newCursorPos = start + 2
          break
        case 'strikethrough':
          formattedText = `~~${selectedText}~~`
          newCursorPos = start + 2
          break
        case 'code':
          formattedText = `\`${selectedText}\``
          newCursorPos = start + 1
          break
        case 'heading1':
          formattedText = `# ${selectedText}`
          newCursorPos = start + 2
          break
        case 'heading2':
          formattedText = `## ${selectedText}`
          newCursorPos = start + 3
          break
        case 'heading3':
          formattedText = `### ${selectedText}`
          newCursorPos = start + 4
          break
        case 'quote':
          formattedText = `> ${selectedText}`
          newCursorPos = start + 2
          break
        case 'link':
          formattedText = `[${selectedText}](url)`
          newCursorPos = start + selectedText.length + 3
          break
        case 'image':
          formattedText = `![${selectedText}](image-url)`
          newCursorPos = start + selectedText.length + 4
          break
      }
      
      const newText = localData.substring(0, start) + formattedText + localData.substring(end)
      setLocalData(newText)
      onChange(newText)
      
      // Set cursor position after formatted text
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    }
  }

  const insertList = (type: 'bullet' | 'numbered' | 'todo') => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = localData.substring(start, end)
      
      let listItem = ''
      switch (type) {
        case 'bullet':
          listItem = `• ${selectedText}`
          break
        case 'numbered':
          listItem = `1. ${selectedText}`
          break
        case 'todo':
          listItem = `- [ ] ${selectedText}`
          break
      }
      
      const newText = localData.substring(0, start) + listItem + localData.substring(end)
      setLocalData(newText)
      onChange(newText)
      
      setTimeout(() => {
        textarea.focus()
        const newCursorPos = start + listItem.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    }
  }

  const insertTable = () => {
    const tableText = `| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`
    insertText(tableText)
  }

  const insertHorizontalRule = () => {
    insertText('\n---\n')
  }

  const alignText = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = localData.substring(start, end)
      
      let alignedText = selectedText
      switch (alignment) {
        case 'left':
          alignedText = `\n<div style="text-align: left;">${selectedText}</div>\n`
          break
        case 'center':
          alignedText = `\n<div style="text-align: center;">${selectedText}</div>\n`
          break
        case 'right':
          alignedText = `\n<div style="text-align: right;">${selectedText}</div>\n`
          break
        case 'justify':
          alignedText = `\n<div style="text-align: justify;">${selectedText}</div>\n`
          break
      }
      
      const newText = localData.substring(0, start) + alignedText + localData.substring(end)
      setLocalData(newText)
      onChange(newText)
      
      setTimeout(() => {
        textarea.focus()
        const newCursorPos = start + alignedText.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
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
        case 'k':
          e.preventDefault()
          formatText('link')
          break
        case 's':
          e.preventDefault()
          // Save functionality can be added here
          break
      }
    }
    
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      insertText('  ') // Two spaces for indentation
    }
  }

  const getWordCount = () => {
    return localData.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const getCharacterCount = () => {
    return localData.length
  }

  const getLineCount = () => {
    return localData.split('\n').length
  }

  if (!isClient) {
    return (
      <div className="w-full min-h-[200px] p-4 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Enhanced Toolbar - Always Visible */}
      <div 
        ref={toolbarRef}
        className="bg-white border border-gray-300 rounded-t-lg shadow-sm mb-0"
      >
        <div className="flex flex-wrap items-center gap-1 p-3">
            {/* Text Formatting */}
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
              <button
                type="button"
                onClick={() => formatText('bold')}
                className="px-2 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Bold (Ctrl+B)"
                disabled={disabled}
              >
                B
              </button>
              <button
                type="button"
                onClick={() => formatText('italic')}
                className="px-2 py-1 text-sm italic border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Italic (Ctrl+I)"
                disabled={disabled}
              >
                I
              </button>
              <button
                type="button"
                onClick={() => formatText('underline')}
                className="px-2 py-1 text-sm underline border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Underline (Ctrl+U)"
                disabled={disabled}
              >
                U
              </button>
              <button
                type="button"
                onClick={() => formatText('strikethrough')}
                className="px-2 py-1 text-sm line-through border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Strikethrough"
                disabled={disabled}
              >
                S
              </button>
              <button
                type="button"
                onClick={() => formatText('code')}
                className="px-2 py-1 text-sm font-mono border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Code"
                disabled={disabled}
              >
                {'</>'}
              </button>
            </div>
            
            {/* Headings */}
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
              <button
                type="button"
                onClick={() => formatText('heading1')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Heading 1"
                disabled={disabled}
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => formatText('heading2')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Heading 2"
                disabled={disabled}
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => formatText('heading3')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Heading 3"
                disabled={disabled}
              >
                H3
              </button>
            </div>
            
            {/* Lists */}
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
              <button
                type="button"
                onClick={() => insertList('bullet')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Bullet List"
                disabled={disabled}
              >
                •
              </button>
              <button
                type="button"
                onClick={() => insertList('numbered')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Numbered List"
                disabled={disabled}
              >
                1.
              </button>
              <button
                type="button"
                onClick={() => insertList('todo')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Todo List"
                disabled={disabled}
              >
                ☐
              </button>
            </div>
            
            {/* Links and Media */}
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
              <button
                type="button"
                onClick={() => formatText('link')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Link (Ctrl+K)"
                disabled={disabled}
              >
                🔗
              </button>
              <button
                type="button"
                onClick={() => formatText('image')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Image"
                disabled={disabled}
              >
                🖼️
              </button>
            </div>
            
            {/* Text Alignment */}
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
              <button
                type="button"
                onClick={() => alignText('left')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Align Left"
                disabled={disabled}
              >
                ⬅️
              </button>
              <button
                type="button"
                onClick={() => alignText('center')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Align Center"
                disabled={disabled}
              >
                ↔️
              </button>
              <button
                type="button"
                onClick={() => alignText('right')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Align Right"
                disabled={disabled}
              >
                ➡️
              </button>
              <button
                type="button"
                onClick={() => alignText('justify')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Justify"
                disabled={disabled}
              >
                ⬌
              </button>
            </div>
            
            {/* Advanced Features */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => formatText('quote')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Quote"
                disabled={disabled}
              >
                "
              </button>
              <button
                type="button"
                onClick={insertTable}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Table"
                disabled={disabled}
              >
                ⚏
              </button>
              <button
                type="button"
                onClick={insertHorizontalRule}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Horizontal Rule"
                disabled={disabled}
              >
                —
              </button>
            </div>
          </div>
        </div>
      
      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={localData}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSelect={handleSelection}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full p-4 border border-gray-300 border-t-0 rounded-b-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
          isFocused ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{ 
          fontFamily: 'inherit',
          lineHeight: '1.6',
          fontSize: '14px',
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`
        }}
      />
      
      {/* Enhanced Status Bar */}
      <div className="flex justify-between items-center px-3 py-2 text-xs text-gray-500 bg-gray-50 border border-gray-300 border-t-0 rounded-b-lg">
        <div className="flex items-center gap-4">
          <span>Characters: {getCharacterCount()}</span>
          <span>Words: {getWordCount()}</span>
          <span>Lines: {getLineCount()}</span>
          {selectedText && (
            <span className="text-blue-600">Selected: {selectedText.length} chars</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Ctrl+B: Bold</span>
          <span>Ctrl+I: Italic</span>
          <span>Ctrl+U: Underline</span>
          <span>Ctrl+K: Link</span>
        </div>
      </div>
    </div>
  )
}
