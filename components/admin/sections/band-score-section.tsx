"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

interface BandScoreSectionProps {
  scores: any[]
  onAdd: (score: any) => void
  onRemove: (id: number) => void
}

export default function BandScoreSection({ scores, onAdd, onRemove }: BandScoreSectionProps) {
  const [formData, setFormData] = useState({
    minScore: 0,
    band: 9.0,
  })

  const handleAddScore = () => {
    if (formData.minScore < 0 || formData.band < 0 || formData.band > 9) {
      alert("Please enter valid values")
      return
    }
    onAdd(formData)
    setFormData({
      minScore: formData.minScore + 2,
      band: Math.max(0, formData.band - 0.5),
    })
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Add Band Score Range</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-score">Minimum Score</Label>
              <Input
                id="min-score"
                type="number"
                min="0"
                max="40"
                value={formData.minScore}
                onChange={(e) => setFormData((prev) => ({ ...prev, minScore: Number.parseInt(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="band">Band Score</Label>
              <Input
                id="band"
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={formData.band}
                onChange={(e) => setFormData((prev) => ({ ...prev, band: Number.parseFloat(e.target.value) }))}
              />
            </div>
          </div>

          <Button onClick={handleAddScore} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Add Band Score
          </Button>
        </div>
      </Card>

      {scores.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Added Band Scores ({scores.length})</h3>
          <div className="space-y-2">
            {[...scores]
              .sort((a, b) => b.minScore - a.minScore)
              .map((score) => (
                <div key={score.id} className="p-3 border rounded flex items-center justify-between bg-muted/30">
                  <div>
                    <p className="font-medium">Band {score.band}</p>
                    <p className="text-sm text-muted-foreground">Minimum {score.minScore} points</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onRemove(score.id)}>
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
