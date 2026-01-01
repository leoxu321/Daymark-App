import { useState } from 'react'
import { Plus, Trash2, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFitnessStore } from '@/store/fitnessStore'

function formatNumber(num: number): string {
  return num.toLocaleString()
}

export function FitnessGoalManager() {
  const { goals, addGoal, removeGoal, resetToDefaults } = useFitnessStore()
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [newUnit, setNewUnit] = useState('')

  const handleAdd = () => {
    if (newName.trim() && newTarget) {
      addGoal({
        name: newName.trim(),
        target: Number(newTarget),
        unit: newUnit.trim() || 'reps',
      })
      setNewName('')
      setNewTarget('')
      setNewUnit('')
      setIsAdding(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Exercise Goals</CardTitle>
          <Button variant="ghost" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div>
              <p className="font-medium">{goal.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatNumber(goal.target)} {goal.unit}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeGoal(goal.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {isAdding ? (
          <div className="space-y-2 p-3 border rounded-lg">
            <Input
              placeholder="Exercise name (e.g., Pull-ups)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Target"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Unit (e.g., reps, km)"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} className="flex-1">
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAdding(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Exercise
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
