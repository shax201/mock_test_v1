"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"

interface PassageSectionProps {
  passages: any[]
  onAdd: (passage: any) => void
  onRemove: (id: number) => void
}

export default function PassageSection({ passages, onAdd, onRemove }: PassageSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [formData, setFormData] = useState({
    title: "",
    order: 1,
    contents: [{ contentId: "A", text: "" }],
    questions: [],
  })

  const handleAddContent = () => {
    const nextId = String.fromCharCode(65 + formData.contents.length)
    setFormData((prev) => ({
      ...prev,
      contents: [...prev.contents, { contentId: nextId, text: "" }],
    }))
  }

  const handleRemoveContent = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      contents: prev.contents.filter((_, i) => i !== index),
    }))
  }

  const handleContentChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const newContents = [...prev.contents]
      newContents[index] = { ...newContents[index], [field]: value }
      return { ...prev, contents: newContents }
    })
  }

  const handleAddPassage = () => {
    if (!formData.title || formData.contents.some((c) => !c.text)) {
      alert("Please fill in all fields")
      return
    }
    onAdd(formData)
    setFormData({
      title: "",
      order: passages.length + 2,
      contents: [{ contentId: "A", text: "" }],
      questions: [],
    })
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Add New Passage</h3>
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passage-title">Passage Title</Label>
              <Input
                id="passage-title"
                placeholder="e.g., Passage 1: The Future of Technology"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Passage Content</Label>
              {formData.contents.map((content, index) => (
                <div key={index} className="space-y-2 p-3 border rounded bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="font-mono text-sm">Segment {content.contentId}</Label>
                    {formData.contents.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveContent(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder={`Enter content for segment ${content.contentId}`}
                    value={content.text}
                    onChange={(e) => handleContentChange(index, "text", e.target.value)}
                    rows={4}
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddContent} className="gap-2 bg-transparent">
                <Plus className="w-4 h-4" />
                Add Content Segment
              </Button>
            </div>

            <Button onClick={handleAddPassage} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Add Passage
            </Button>
          </div>
        )}
      </Card>

      {passages.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Added Passages ({passages.length})</h3>
          <div className="space-y-3">
            {passages.map((passage, index) => (
              <div key={passage.id} className="p-3 border rounded flex items-start justify-between bg-muted/30">
                <div className="flex-1">
                  <p className="font-medium">{passage.title}</p>
                  <p className="text-sm text-muted-foreground">{passage.contents.length} content segments</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onRemove(passage.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
