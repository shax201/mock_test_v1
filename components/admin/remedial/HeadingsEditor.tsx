'use client'

interface HeadingsEditorProps {
  headings: string[]
  onAdd: () => void
  onUpdate: (index: number, value: string) => void
  onRemove: (index: number) => void
}

export default function HeadingsEditor({ headings, onAdd, onUpdate, onRemove }: HeadingsEditorProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Headings
        </label>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          + Add Heading
        </button>
      </div>

      <div className="space-y-2">
        {headings.map((heading, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 w-8">
              {String.fromCharCode(65 + index)}.
            </span>
            <input
              type="text"
              value={heading}
              onChange={(e) => onUpdate(index, e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter heading"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}


