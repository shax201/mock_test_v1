'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Field interface for storing input field data
 */
export interface ChartField {
  id: string
  x: number
  y: number
  width: number
  height: number
  value: string
  questionNumber?: number // Optional question number for each field
}

/**
 * Props for ImageChartEditor component
 */
interface ImageChartEditorProps {
  /** Default width for input fields in pixels */
  defaultFieldWidth?: number
  /** Default height for input fields in pixels */
  defaultFieldHeight?: number
  /** Callback function when fields are saved */
  onSave?: (fields: ChartField[]) => void
  /** Callback function when image URL changes */
  onImageChange?: (imageUrl: string) => void
  /** Initial fields to load (for edit mode) */
  initialFields?: ChartField[]
  /** Initial image URL (for edit mode) */
  initialImageUrl?: string
  /** Starting question number for displaying question numbers on fields */
  startingQuestionNumber?: number
}

/**
 * ImageChartEditor Component
 * 
 * Allows admins to upload an image and create dynamic input fields
 * by clicking anywhere on the image. Fields are positioned absolutely
 * over the image and can be edited inline.
 * 
 * @example
 * ```tsx
 * <ImageChartEditor
 *   defaultFieldWidth={140}
 *   onSave={(fields) => console.log('Saved fields:', fields)}
 * />
 * ```
 */
export default function ImageChartEditor({
  defaultFieldWidth = 140,
  defaultFieldHeight = 32,
  onSave,
  onImageChange,
  initialFields = [],
  initialImageUrl = '',
  startingQuestionNumber
}: ImageChartEditorProps) {
  // State for image
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl)
  const [imageError, setImageError] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [publicId, setPublicId] = useState<string>('')
  
  // State for fields - filter out invalid/empty initial fields
  // Also ensure height is set (for backward compatibility)
  const [fields, setFields] = useState<ChartField[]>(
    initialFields
      .filter(field => 
        field.x >= 0 && 
        field.y >= 0 && 
        field.width > 0 &&
        (field.height || defaultFieldHeight) > 0 &&
        field.id && 
        field.id.trim() !== ''
      )
      .map(field => ({
        ...field,
        height: field.height || defaultFieldHeight
      }))
  )
  
  // State for editing
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  
  // Ref for image container to calculate click positions
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync imageUrl when initialImageUrl prop changes
  useEffect(() => {
    if (initialImageUrl && initialImageUrl !== imageUrl) {
      setImageUrl(initialImageUrl)
    }
  }, [initialImageUrl, imageUrl])

  // Sync fields when initialFields prop changes (but filter out invalid/empty fields)
  useEffect(() => {
    const validFields = initialFields
      .filter(field => 
        field.x >= 0 && 
        field.y >= 0 && 
        field.width > 0 &&
        (field.height || defaultFieldHeight) > 0 &&
        field.id && 
        field.id.trim() !== ''
      )
      .map(field => ({
        ...field,
        height: field.height || defaultFieldHeight
      }))
    // Only update if there are valid fields and they're different
    const currentFieldsStr = JSON.stringify(fields)
    const validFieldsStr = JSON.stringify(validFields)
    if (validFieldsStr !== currentFieldsStr) {
      setFields(validFields)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFields, defaultFieldHeight])

  /**
   * Handle image file selection and upload to Cloudinary
   */
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImageError('Image size must be less than 10MB')
      return
    }

    setImageError('')
    setUploading(true)
    
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('image', file)

      // Upload file to API (which uploads to Cloudinary)
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      const cloudinaryUrl = result.url
      const cloudinaryPublicId = result.public_id

      setImageUrl(cloudinaryUrl)
      setPublicId(cloudinaryPublicId)
      
      // Notify parent of image change with Cloudinary URL
      if (onImageChange) {
        onImageChange(cloudinaryUrl)
      }
      
      // Clear fields when new image is uploaded
      setFields([])
    } catch (err: any) {
      console.error('Image upload error:', err)
      setImageError(err.message || 'Failed to upload image to Cloudinary')
      
      // Fallback: use local preview if upload fails (for development/testing)
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImageUrl(result)
        if (onImageChange) {
          onImageChange(result)
        }
      }
      reader.onerror = () => {
        setImageError('Failed to read image file')
      }
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }, [onImageChange])

  /**
   * Handle click on image to create a new input field
   */
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    // Don't create field if clicking on an existing input field
    if ((e.target as HTMLElement).tagName === 'INPUT') {
      return
    }

    const imageElement = e.currentTarget
    const rect = imageElement.getBoundingClientRect()
    
    // Calculate position relative to image
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Create new field
    const newField: ChartField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x,
      y,
      width: defaultFieldWidth,
      height: defaultFieldHeight,
      value: ''
    }

    setFields(prev => [...prev, newField])
    setEditingFieldId(newField.id)
  }, [defaultFieldWidth, defaultFieldHeight])

  /**
   * Handle input field value change
   */
  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setFields(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, value } : field
      )
    )
  }, [])

  /**
   * Handle question number change for a field
   */
  const handleQuestionNumberChange = useCallback((fieldId: string, questionNumber: number | undefined) => {
    setFields(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, questionNumber: questionNumber || undefined } : field
      )
    )
  }, [])

  /**
   * Handle input field width change
   */
  const handleFieldWidthChange = useCallback((fieldId: string, newWidth: number) => {
    setFields(prev =>
      prev.map(field => {
        if (field.id === fieldId) {
          const clampedWidth = Math.max(80, Math.min(300, newWidth))
          return { ...field, width: clampedWidth }
        }
        return field
      })
    )
  }, [])

  /**
   * Handle input field height change
   */
  const handleFieldHeightChange = useCallback((fieldId: string, newHeight: number) => {
    setFields(prev =>
      prev.map(field => {
        if (field.id === fieldId) {
          const clampedHeight = Math.max(20, Math.min(100, newHeight))
          return { ...field, height: clampedHeight }
        }
        return field
      })
    )
  }, [])

  /**
   * Handle field deletion
   */
  const handleDeleteField = useCallback((fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFields(prev => prev.filter(field => field.id !== fieldId))
    if (editingFieldId === fieldId) {
      setEditingFieldId(null)
    }
  }, [editingFieldId])

  /**
   * Handle field drag start
   */
  const handleFieldDragStart = useCallback((fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const field = fields.find(f => f.id === fieldId)
    if (!field) return

    const startX = e.clientX
    const startY = e.clientY
    const startFieldX = field.x
    const startFieldY = field.y

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const imageContainer = imageContainerRef.current
      if (!imageContainer) return

      const containerRect = imageContainer.getBoundingClientRect()
      const imageElement = imageContainer.querySelector('img')
      if (!imageElement) return

      const imageRect = imageElement.getBoundingClientRect()
      
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      const newX = Math.max(0, Math.min(
        imageRect.width - field.width,
        startFieldX + deltaX
      ))
      const newY = Math.max(0, Math.min(
        imageRect.height,
        startFieldY + deltaY
      ))

      setFields(prev =>
        prev.map(f =>
          f.id === fieldId ? { ...f, x: newX, y: newY } : f
        )
      )
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [fields])

  /**
   * Handle save button click
   */
  const handleSave = useCallback(() => {
    console.log('📊 Flow Chart Fields:', fields)
    console.log('📊 Fields JSON:', JSON.stringify(fields, null, 2))
    
    if (onSave) {
      onSave(fields)
    }
  }, [fields, onSave])

  /**
   * Handle clear all fields
   */
  const handleClearAll = useCallback(() => {
    if (confirm('Are you sure you want to clear all fields?')) {
      setFields([])
      setEditingFieldId(null)
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Flow Chart Completion Editor
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Upload an image and click anywhere to create input fields
          </p>
        </div>
        <div className="flex space-x-2">
          {fields.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Clear All
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={fields.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Fields ({fields.length})
          </button>
        </div>
      </div>

      {/* Image Upload Section */}
      {!imageUrl && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <div className="space-y-4">
              <svg
                className="animate-spin mx-auto h-12 w-12 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-600">Uploading to Cloudinary...</p>
            </div>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload Image to Cloudinary
                </button>
                <p className="mt-2 text-sm text-gray-600">
                  or drag and drop an image here
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Images are uploaded to Cloudinary and stored securely
                </p>
              </div>
            </>
          )}
          {imageError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{imageError}</p>
            </div>
          )}
        </div>
      )}

      {/* Image Editor Section */}
      {imageUrl && (
        <div className="space-y-4">
          {/* Image Controls */}
          <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-md">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {fields.length} field{fields.length !== 1 ? 's' : ''} created
              </span>
              {imageUrl && imageUrl.startsWith('http') && (
                <span className="text-xs text-gray-500">
                  Cloudinary URL
                </span>
              )}
              <button
                onClick={() => {
                  setImageUrl('')
                  setFields([])
                  setImageError('')
                  setPublicId('')
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Remove Image
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Replace Image'}
              </button>
            </div>
          </div>
          
          {/* Show Cloudinary URL if available */}
          {imageUrl && imageUrl.startsWith('http') && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
              <p className="text-xs text-blue-800">
                <strong>Image URL:</strong> <span className="font-mono break-all">{imageUrl}</span>
              </p>
            </div>
          )}

          {/* Image Container with Fields */}
          <div
            ref={imageContainerRef}
            className="relative inline-block border border-gray-300 rounded-lg overflow-hidden bg-gray-50"
          >
            <img
              src={imageUrl}
              alt="Flow chart"
              onClick={handleImageClick}
              className="max-w-full h-auto cursor-crosshair select-none"
              draggable={false}
            />

            {/* Render all fields over the image - only show fields with valid positions */}
            {fields
              .filter(field => field.x >= 0 && field.y >= 0 && field.width > 0 && field.height > 0)
              .map((field, index) => {
                // Use field's questionNumber if set, otherwise calculate from startingQuestionNumber + index
                const questionNumber = field.questionNumber !== undefined 
                  ? field.questionNumber 
                  : (startingQuestionNumber !== undefined ? startingQuestionNumber + index : null);
                
                return (
              <div
                key={field.id}
                className={`absolute ${
                  editingFieldId === field.id
                    ? 'border-2 border-dashed border-blue-500'
                    : 'border border-gray-300'
                }`}
                style={{
                  left: `${field.x}px`,
                  top: `${field.y}px`,
                  width: `${field.width}px`,
                  height: `${field.height}px`
                }}
              >
                {/* Question Number Label */}
                {questionNumber !== null && (
                  <div
                    className="absolute -top-6 left-0 bg-blue-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-t z-20"
                    style={{ minWidth: '24px', textAlign: 'center' }}
                  >
                    Q{questionNumber}
                  </div>
                )}
                
                {/* Input Field */}
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  onFocus={() => setEditingFieldId(field.id)}
                  onBlur={(e) => {
                    // Don't blur if clicking on controls - use a small delay to check
                    setTimeout(() => {
                      const activeElement = document.activeElement as HTMLElement
                      // Check if the new active element is within any controls toolbar
                      if (activeElement && activeElement.closest('.field-controls-toolbar')) {
                        // Keep focus on input to prevent blur
                        e.target.focus()
                        return
                      }
                      // Only hide controls if we're not clicking on them
                      setEditingFieldId(null)
                    }, 200)
                  }}
                  className={`w-full h-full px-2 py-1 text-sm border-2 ${
                    editingFieldId === field.id
                      ? 'border-dashed border-blue-500 bg-blue-50'
                      : 'border-dashed border-gray-400 bg-white'
                  } rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`}
                  placeholder={questionNumber !== null ? `Q${questionNumber} - Enter answer...` : "Enter answer..."}
                  onClick={(e) => e.stopPropagation()}
                  style={{ height: '100%' }}
                />

                {/* Field Controls */}
                {editingFieldId === field.id && (
                  <div 
                    className="absolute -top-8 left-0 flex items-center space-x-1 bg-white border border-gray-300 rounded shadow-lg p-1 z-10 field-controls-toolbar"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    {/* Delete Button */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteField(field.id, e)
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete field"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    {/* Width Control */}
                    <div className="flex items-center space-x-1 px-1 border-r border-gray-300 pr-1">
                      <span className="text-xs text-gray-500">W:</span>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleFieldWidthChange(field.id, field.width - 10)
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className="px-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Decrease width"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="text-xs text-gray-600 min-w-[2.5rem] text-center">
                        {field.width}
                      </span>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleFieldWidthChange(field.id, field.width + 10)
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className="px-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Increase width"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Height Control */}
                    <div className="flex items-center space-x-1 px-1 border-r border-gray-300 pr-1">
                      <span className="text-xs text-gray-500">H:</span>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleFieldHeightChange(field.id, field.height - 5)
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className="px-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Decrease height"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="text-xs text-gray-600 min-w-[2.5rem] text-center">
                        {field.height}
                      </span>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleFieldHeightChange(field.id, field.height + 5)
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className="px-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Increase height"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Question Number Control */}
                    <div className="flex items-center space-x-1 px-1 border-r border-gray-300 pr-1">
                      <span className="text-xs text-gray-500">Q#:</span>
                      <input
                        type="number"
                        min="1"
                        value={field.questionNumber !== undefined ? field.questionNumber : (startingQuestionNumber !== undefined ? startingQuestionNumber + index : '')}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                          handleQuestionNumberChange(field.id, value)
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.currentTarget.select()
                        }}
                        className="w-12 px-1 py-0.5 text-xs border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Auto"
                        title="Question number for this field"
                      />
                    </div>

                    {/* Drag Handle */}
                    <div
                      onMouseDown={(e) => handleFieldDragStart(field.id, e)}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded cursor-move"
                      title="Drag to move"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            )})}

            {/* Click Hint */}
            {fields.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
                  Click anywhere on the image to create an input field
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Click on the image to create input fields. 
              Click on a field to edit it. Use the controls to adjust width, move, or delete fields.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

