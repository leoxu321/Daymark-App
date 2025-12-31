import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TaskInput, TaskCategory } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { TASK_CATEGORIES, TIME_SLOTS } from '@/utils/constants'

interface TaskFormProps {
  onSubmit: (task: TaskInput) => void
  date: string
}

export function TaskForm({ onSubmit, date }: TaskFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(30)
  const [category, setCategory] = useState<TaskCategory>('personal')
  const [timeSlot, setTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSubmit({
      title: title.trim(),
      date,
      duration,
      category,
      preferredTimeSlot: timeSlot,
    })

    setTitle('')
    setDuration(30)
    setCategory('personal')
    setIsExpanded(false)
  }

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setIsExpanded(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add a task...
      </Button>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Duration (min)
              </label>
              <Input
                type="number"
                min={5}
                max={480}
                step={5}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
              >
                {TASK_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Preferred Time
            </label>
            <div className="flex gap-2">
              {TIME_SLOTS.map((slot) => (
                <Button
                  key={slot.value}
                  type="button"
                  variant={timeSlot === slot.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeSlot(slot.value as typeof timeSlot)}
                >
                  {slot.value.charAt(0).toUpperCase() + slot.value.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsExpanded(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Add Task
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
