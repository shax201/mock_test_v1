'use client'

import AudioFileUpload from '../AudioFileUpload'

interface QuestionAudio {
  url: string
  publicId?: string
}

interface QuestionAudioListEditorProps {
  questions: string[]
  audios: QuestionAudio[]
  onChange: (index: number, file: File | null, url?: string, publicId?: string) => void
  onDeleteUploaded?: (publicId: string) => Promise<void> | void
}

export default function QuestionAudioListEditor({ questions, audios, onChange }: QuestionAudioListEditorProps) {
  const getAudio = (index: number): QuestionAudio => audios[index] || { url: '' }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Question Audios</label>
      {questions.map((_, index) => {
        const a = getAudio(index)
        return (
          <div key={index} className="border border-gray-200 rounded-md p-4">
            <div className="mb-2 text-sm font-medium text-gray-700">Question {index + 1} Audio</div>
            <AudioFileUpload
              onFileChange={(file, url, publicId) => onChange(index, file, url, publicId)}
              initialUrl={a.url || ''}
              initialPublicId={a.publicId || ''}
              accept="audio/*"
              maxSize={25}
            />
          </div>
        )
      })}
    </div>
  )
}


