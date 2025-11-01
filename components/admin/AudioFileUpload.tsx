'use client'

import { useState, useRef, useEffect } from 'react'

interface AudioFileUploadProps {
  onFileChange: (file: File | null, url?: string, publicId?: string) => void
  initialUrl?: string
  initialPublicId?: string
  accept?: string
  maxSize?: number // in MB
}

export default function AudioFileUpload({ 
  onFileChange, 
  initialUrl = '', 
  initialPublicId = '',
  accept = 'audio/*',
  maxSize = 25 
}: AudioFileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState(initialUrl)
  const [publicId, setPublicId] = useState(initialPublicId)
  
  // Debug logging
  console.log('AudioFileUpload received initialUrl:', initialUrl)
  console.log('AudioFileUpload received initialPublicId:', initialPublicId)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update URL when initialUrl prop changes
  useEffect(() => {
    if (initialUrl !== url) {
      console.log('Updating URL from initialUrl:', initialUrl)
      setUrl(initialUrl)
    }
    if (initialPublicId !== publicId) {
      console.log('Updating publicId from initialPublicId:', initialPublicId)
      setPublicId(initialPublicId)
    }
  }, [initialUrl, initialPublicId])

  const handleFileSelect = async (selectedFile: File) => {
    setError(null)
    
    // Validate file size (updated to 25MB for better reliability)
    const actualMaxSize = Math.min(maxSize, 25) // Cap at 25MB for reliability
    if (selectedFile.size > actualMaxSize * 1024 * 1024) {
      setError(`File size must be less than ${actualMaxSize}MB. Please compress your audio file.`)
      return
    }

    // Validate file type
    if (!selectedFile.type.startsWith('audio/')) {
      setError('Please select an audio file')
      return
    }

    setFile(selectedFile)
    setUploading(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('audio', selectedFile)

      // Upload file to API
      const response = await fetch('/api/admin/upload-audio', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      const audioUrl = result.url
      const audioPublicId = result.public_id

      setUrl(audioUrl)
      setPublicId(audioPublicId)
      onFileChange(selectedFile, audioUrl, audioPublicId)
    } catch (err: any) {
      // Use the specific error message from the server
      setError(err.message || 'Failed to upload audio file')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    setPublicId('') // Clear public ID when using URL
    onFileChange(null, newUrl, '')
  }

  const removeFile = async () => {
    // If we have a public ID, delete from Cloudinary
    if (publicId) {
      try {
        await fetch('/api/admin/delete-audio', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ public_id: publicId }),
        })
      } catch (err) {
        console.error('Error deleting from Cloudinary:', err)
      }
    }

    setFile(null)
    setUrl('')
    setPublicId('')
    onFileChange(null, '', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                {uploading ? 'Uploading...' : 'Upload audio file'}
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                or drag and drop
              </span>
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            MP3, WAV, OGG up to {Math.min(maxSize, 25)}MB
          </p>
        </div>
      </div>

      {/* URL Input Alternative */}
      <div className="border-t pt-4">
        <label htmlFor="audio-url" className="block text-sm font-medium text-gray-700 mb-2">
          Or enter audio URL
        </label>
        <input
          type="url"
          id="audio-url"
          value={url}
          onChange={handleUrlInputChange}
          placeholder="https://example.com/audio.mp3"
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* File Info */}
      {file && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">{file.name}</p>
                <p className="text-xs text-green-600">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Audio Preview */}
      {url && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audio Preview
          </label>
          <audio controls className="w-full">
            <source src={url} type="audio/mpeg" />
            <source src={url} type="audio/wav" />
            <source src={url} type="audio/ogg" />
            Your browser does not support the audio element.
          </audio>
          <p className="mt-2 text-xs text-gray-500">
            Audio URL: <span className="font-mono break-all">{url}</span>
          </p>
        </div>
      )}
    </div>
  )
}
