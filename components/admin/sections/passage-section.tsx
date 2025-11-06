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
  onUpdate?: (id: number, passage: any) => void
}

export default function PassageSection({ passages, onAdd, onRemove, onUpdate }: PassageSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
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
    if (editingId !== null && onUpdate) {
      onUpdate(editingId, formData)
      setEditingId(null)
    } else {
      onAdd(formData)
    }
    setFormData({
      title: "",
      order: passages.length + 2,
      contents: [{ contentId: "A", text: "" }],
      questions: [],
    })
  }

  const handleEditPassage = (passage: any) => {
    setEditingId(passage.id)
    setFormData({
      title: passage.title || "",
      order: passage.order || 1,
      contents: passage.contents && passage.contents.length > 0 
        ? passage.contents.map((c: any, idx: number) => ({
            contentId: c.contentId || String.fromCharCode(65 + idx),
            text: c.text || "",
            order: c.order || idx
          }))
        : [{ contentId: "A", text: "" }],
      questions: [],
    })
    setIsExpanded(true)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
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
          <h3 className="font-semibold text-lg">
            {editingId !== null ? "Edit Passage" : "Add New Passage"}
          </h3>
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="passage-order">Order</Label>
                <Input
                  id="passage-order"
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                />
              </div>
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

            <div className="flex gap-2">
              {editingId !== null && (
                <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button onClick={handleAddPassage} className={editingId !== null ? "flex-1 gap-2" : "w-full gap-2"}>
                <Plus className="w-4 h-4" />
                {editingId !== null ? "Update Passage" : "Add Passage"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {passages.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Added Passages ({passages.length})</h3>
          <div className="space-y-3">
            {passages.map((passage, index) => (
              <div key={passage.id} className="p-3 border rounded bg-muted/30">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium">{passage.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Order: {passage.order} • {passage.contents?.length || 0} content segments
                    </p>
                    {passage.contents && passage.contents.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {passage.contents.slice(0, 2).map((content: any, idx: number) => (
                          <p key={idx} className="text-xs text-muted-foreground line-clamp-2">
                            <span className="font-mono">{content.contentId}:</span> {content.text?.substring(0, 100)}
                            {content.text?.length > 100 ? '...' : ''}
                          </p>
                        ))}
                        {passage.contents.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{passage.contents.length - 2} more segments
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    {onUpdate && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditPassage(passage)}
                        disabled={editingId === passage.id}
                      >
                        Edit
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onRemove(passage.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
