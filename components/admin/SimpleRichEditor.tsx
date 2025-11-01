'use client'

import { useState, useRef, useEffect } from 'react'

interface SimpleRichEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export default function SimpleRichEditor({
  content,
  onChange,
  placeholder = 'Enter text...',
  className = ''
}: SimpleRichEditorProps) {
  const [isFocused, setIsFocused] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content
    }
  }, [content])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      document.execCommand('insertHTML', false, '<br>')
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const toolbarButtons = [
    { command: 'bold', icon: 'B', title: 'Bold' },
    { command: 'italic', icon: 'I', title: 'Italic' },
    { command: 'underline', icon: 'U', title: 'Underline' },
    { command: 'insertUnorderedList', icon: '•', title: 'Bullet List' },
    { command: 'insertOrderedList', icon: '1.', title: 'Numbered List' },
    { command: 'justifyLeft', icon: '←', title: 'Align Left' },
    { command: 'justifyCenter', icon: '↔', title: 'Align Center' },
    { command: 'justifyRight', icon: '→', title: 'Align Right' },
    { command: 'justifyFull', icon: '↔', title: 'Justify' }
  ]

  return (
    <div className={`border border-gray-300 rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {toolbarButtons.map((button) => (
          <button
            key={button.command}
            type="button"
            onClick={() => execCommand(button.command)}
            className="px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={button.title}
          >
            {button.icon}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`min-h-[100px] p-3 focus:outline-none ${
          isFocused ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{ minHeight: '100px' }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Placeholder */}
      {!content && !isFocused && (
        <div className="absolute top-3 left-3 text-gray-400 pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  )
}