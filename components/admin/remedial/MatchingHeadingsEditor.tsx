'use client'

import { useState } from 'react'
import { PassageSection, QuestionData } from './types'

interface MatchingHeadingsEditorProps {
  question: QuestionData
  onQuestionChange: (field: string, value: any) => void
}

export default function MatchingHeadingsEditor({ question, onQuestionChange }: MatchingHeadingsEditorProps) {
  const [passageTitle, setPassageTitle] = useState(question.passage?.title || '')
  const [sections, setSections] = useState<PassageSection[]>(question.passage?.sections || [])
  const [headings, setHeadings] = useState<string[]>(question.headings || [])
  const [instructions, setInstructions] = useState(question.instructions || '')

  const addPassageSection = (hasHeading: boolean = false) => {
    const newSection: PassageSection = {
      id: `section-${sections.length + 1}`,
      number: sections.length + 1,
      content: '',
      hasHeading,
      heading: hasHeading ? '' : undefined
    }
    const updatedSections = [...sections, newSection]
    setSections(updatedSections)
    onQuestionChange('passage', { ...question.passage, title: passageTitle, sections: updatedSections })
  }

  const updatePassageSection = (sectionId: string, field: string, value: string) => {
    const updatedSections = sections.map(section => 
      section.id === sectionId ? { ...section, [field]: value } : section
    )
    setSections(updatedSections)
    onQuestionChange('passage', { ...question.passage, title: passageTitle, sections: updatedSections })
  }

  const removePassageSection = (sectionId: string) => {
    const updatedSections = sections.filter(section => section.id !== sectionId)
    setSections(updatedSections)
    onQuestionChange('passage', { ...question.passage, title: passageTitle, sections: updatedSections })
  }

  const addHeading = () => {
    const updatedHeadings = [...headings, '']
    setHeadings(updatedHeadings)
    onQuestionChange('headings', updatedHeadings)
  }

  const updateHeading = (index: number, value: string) => {
    const updatedHeadings = headings.map((heading, i) => i === index ? value : heading)
    setHeadings(updatedHeadings)
    onQuestionChange('headings', updatedHeadings)
  }

  const removeHeading = (index: number) => {
    const updatedHeadings = headings.filter((_, i) => i !== index)
    setHeadings(updatedHeadings)
    onQuestionChange('headings', updatedHeadings)
  }

  const handlePassageTitleChange = (value: string) => {
    setPassageTitle(value)
    onQuestionChange('passage', { ...question.passage, title: value, sections })
  }

  const handleInstructionsChange = (value: string) => {
    setInstructions(value)
    onQuestionChange('instructions', value)
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions
        </label>
        <textarea
          value={instructions}
          onChange={(e) => handleInstructionsChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Enter instructions for the matching headings question..."
        />
      </div>

      {/* Passage Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Passage Title
        </label>
        <input
          type="text"
          value={passageTitle}
          onChange={(e) => handlePassageTitleChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter the passage title..."
        />
      </div>

      {/* Passage Sections */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Passage Sections
          </label>
          <div className="space-x-2">
            <button
              type="button"
              onClick={() => addPassageSection(false)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Add Section
            </button>
            <button
              type="button"
              onClick={() => addPassageSection(true)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              + Add Section with Heading Gap
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={section.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Section {section.number}
                  {section.hasHeading && ' (with heading gap)'}
                </span>
                <button
                  type="button"
                  onClick={() => removePassageSection(section.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
              
              {section.hasHeading && (
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">
                    Heading Gap (students will drag a heading here)
                  </label>
                  <div className="bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-md p-3 text-center text-yellow-700">
                    [Heading Gap {section.number}]
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Section Content
                </label>
                <textarea
                  value={section.content}
                  onChange={(e) => updatePassageSection(section.id, 'content', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Enter the section content..."
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Headings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Headings (for students to match)
          </label>
          <button
            type="button"
            onClick={addHeading}
            className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            + Add Heading
          </button>
        </div>

        <div className="space-y-3">
          {headings.map((heading, index) => (
            <div key={index} className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700 w-8">
                {String.fromCharCode(65 + index)}.
              </span>
              <input
                type="text"
                value={heading}
                onChange={(e) => updateHeading(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter heading ${String.fromCharCode(65 + index)}...`}
              />
              <button
                type="button"
                onClick={() => removeHeading(index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      {sections.length > 0 && headings.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-4">{passageTitle}</h4>
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div key={section.id} className="border-l-4 border-blue-200 pl-4">
                  {section.hasHeading && (
                    <div className="bg-yellow-100 border border-yellow-300 rounded-md p-2 mb-2 text-center text-yellow-800 font-medium">
                      [Heading Gap {section.number}]
                    </div>
                  )}
                  <p className="text-gray-700 whitespace-pre-wrap">{section.content}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h5 className="font-medium text-gray-900 mb-3">Headings to choose from:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {headings.map((heading, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-md p-2">
                    <span className="font-medium text-blue-900">
                      {String.fromCharCode(65 + index)}. {heading}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
