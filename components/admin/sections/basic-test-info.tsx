"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface BasicTestInfoProps {
  testData: {
    title: string
    totalQuestions: number
    totalTimeMinutes: number
    isActive: boolean
  }
  onChange: (field: string, value: any) => void
}

export default function BasicTestInfo({ testData, onChange }: BasicTestInfoProps) {
  return (
    <Card className="p-4 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Test Title</Label>
        <Input
          id="title"
          placeholder="e.g., IELTS Academic Reading Test 1"
          value={testData.title}
          onChange={(e) => onChange("title", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="questions">Total Questions</Label>
          <Input
            id="questions"
            type="number"
            value={testData.totalQuestions}
            onChange={(e) => onChange("totalQuestions", Number.parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Total Time (minutes)</Label>
          <Input
            id="time"
            type="number"
            value={testData.totalTimeMinutes}
            onChange={(e) => onChange("totalTimeMinutes", Number.parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
        <Label htmlFor="active" className="cursor-pointer">
          Active
        </Label>
        <Switch id="active" checked={testData.isActive} onCheckedChange={(value) => onChange("isActive", value)} />
      </div>
    </Card>
  )
}
