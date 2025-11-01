'use client'

interface CorrectAnswerInputProps {
  value: string
  onChange: (value: string) => void
}

export default function CorrectAnswerInput({ value, onChange }: CorrectAnswerInputProps) {
  return (
    <div className="mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Correct Answer
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter correct answer"
      />
    </div>
  )
}


