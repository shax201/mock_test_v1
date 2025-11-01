'use client'

import { PassageSection, QuestionData } from './types'

interface PassageEditorProps {
  passage: QuestionData['passage']
  onAddSection: (hasHeading: boolean) => void
  onUpdateSection: (sectionId: string, field: string, value: string) => void
  onRemoveSection: (sectionId: string) => void
  onUpdateTitle: (value: string) => void
}

export default function PassageEditor({ passage, onAddSection, onUpdateSection, onRemoveSection, onUpdateTitle }: PassageEditorProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Reading Passage
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => onAddSection(false)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Gap Section
          </button>
          <button
            type="button"
            onClick={() => onAddSection(true)}
            className="text-sm text-green-600 hover:text-green-700"
          >
            + Add Section with Heading
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={passage?.title || ''}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
          placeholder="Passage Title"
        />
      </div>

      <div className="space-y-4">
        {passage?.sections.map((section: PassageSection) => (
          <div key={section.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  Section {section.number}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${
                  section.hasHeading 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {section.hasHeading ? 'With Heading' : 'Gap Section'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveSection(section.id)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>

            {section.hasHeading && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Heading
                </label>
                <input
                  type="text"
                  value={section.heading || ''}
                  onChange={(e) => onUpdateSection(section.id, 'heading', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter section heading"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section Content
              </label>
              <textarea
                value={section.content}
                onChange={(e) => onUpdateSection(section.id, 'content', e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter section content"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


