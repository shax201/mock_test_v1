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
}

export default function PassageConfigSection({ configs, onAdd, onRemove }: PassageConfigSectionProps) {
  const [formData, setFormData] = useState({
    part: "1",
    total: 13,
    start: 1,
  })

  const handleAddConfig = () => {
    if (!formData.part || !formData.total || !formData.start) {
      alert("Please fill in all fields")
      return
    }
    onAdd(formData)
    setFormData({
      part: String(Number.parseInt(formData.part) + 1),
      total: 13,
      start: formData.start + formData.total,
    })
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Add Passage Configuration</h3>
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

          <Button onClick={handleAddConfig} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Add Configuration
          </Button>
        </div>
      </Card>

      {configs.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Added Configurations ({configs.length})</h3>
          <div className="space-y-2">
            {configs.map((config) => (
              <div key={config.id} className="p-3 border rounded flex items-center justify-between bg-muted/30">
                <div>
                  <p className="font-medium">Part {config.part}</p>
                  <p className="text-sm text-muted-foreground">
                    Questions {config.start} - {config.start + config.total - 1} ({config.total} total)
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onRemove(config.id)}>
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
