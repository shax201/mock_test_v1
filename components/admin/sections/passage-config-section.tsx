"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PassageConfigSectionProps {
  configs: any[]
  onAdd: (config: any) => void
  onRemove: (id: number) => void
  onUpdate?: (id: number, config: any) => void
}

export default function PassageConfigSection({ configs, onAdd, onRemove, onUpdate }: PassageConfigSectionProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    part: "1",
    total: 13,
    start: 1,
  })

  const handleAddConfig = () => {
    if (!formData.part || formData.total === undefined || formData.start === undefined) {
      alert("Please fill in all fields")
      return
    }
    
    if (editingId !== null && onUpdate) {
      onUpdate(editingId, {
        part: Number.parseInt(formData.part),
        total: formData.total,
        start: formData.start,
      })
      setEditingId(null)
      // Reset form after update
      setFormData({
        part: "1",
        total: 13,
        start: 1,
      })
    } else {
      onAdd({
        part: Number.parseInt(formData.part),
        total: formData.total,
        start: formData.start,
      })
      // Auto-increment for next config
      const nextPart = Number.parseInt(formData.part) + 1
      setFormData({
        part: String(nextPart > 3 ? 1 : nextPart),
        total: 13,
        start: formData.start + formData.total,
      })
    }
  }

  const handleEditConfig = (config: any) => {
    setEditingId(config.id)
    setFormData({
      part: String(config.part || 1),
      total: config.total ?? 0,
      start: config.start ?? 1,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      part: "1",
      total: 13,
      start: 1,
    })
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">
          {editingId !== null ? "Edit Passage Configuration" : "Add Passage Configuration"}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="part">Part Number</Label>
              <Select value={formData.part} onValueChange={(v) => setFormData((prev) => ({ ...prev, part: v }))}>
                <SelectTrigger id="part">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Part 1</SelectItem>
                  <SelectItem value="2">Part 2</SelectItem>
                  <SelectItem value="3">Part 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total">Total Questions</Label>
              <Input
                id="total"
                type="number"
                min="1"
                value={formData.total}
                onChange={(e) => setFormData((prev) => ({ ...prev, total: Number.parseInt(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start">Start Question #</Label>
              <Input
                id="start"
                type="number"
                min="1"
                value={formData.start}
                onChange={(e) => setFormData((prev) => ({ ...prev, start: Number.parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {editingId !== null && (
              <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                Cancel
              </Button>
            )}
            <Button onClick={handleAddConfig} className={editingId !== null ? "flex-1 gap-2" : "w-full gap-2"}>
              <Plus className="w-4 h-4" />
              {editingId !== null ? "Update Configuration" : "Add Configuration"}
            </Button>
          </div>
        </div>
      </Card>

      {configs.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Added Configurations ({configs.length})</h3>
          <div className="space-y-2">
            {configs.map((config) => {
              const endQuestion = config.start + (config.total || 0) - 1
              return (
                <div key={config.id} className="p-3 border rounded bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Part {config.part}</p>
                      <p className="text-sm text-muted-foreground">
                        Questions {config.start} - {endQuestion} ({config.total || 0} total)
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {onUpdate && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditConfig(config)}
                          disabled={editingId === config.id}
                        >
                          Edit
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => onRemove(config.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
