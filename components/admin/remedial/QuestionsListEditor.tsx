'use client'

interface QuestionsListEditorProps {
  questions: string[]
  onAdd: () => void
  onUpdate: (index: number, value: string) => void
  onRemove: (index: number) => void
  label?: string
}

export default function QuestionsListEditor({ questions, onAdd, onUpdate, onRemove, label = 'Questions' }: QuestionsListEditorProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          + Add Question
        </button>
      </div>

      <div className="space-y-2">
        {questions.map((question, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 w-8">
              {index + 1}.
            </span>
            <input
              type="text"
              value={question}
              onChange={(e) => onUpdate(index, e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter question"
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


