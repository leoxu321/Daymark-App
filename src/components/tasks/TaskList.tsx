import { CheckSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskItem } from './TaskItem'
import { TaskForm } from './TaskForm'
import { useTasks } from '@/hooks/useTasks'
import { getTodayDateString } from '@/utils/dateUtils'

interface TaskListProps {
  date?: string
}

export function TaskList({ date }: TaskListProps) {
  const targetDate = date || getTodayDateString()
  const {
    tasks,
    pendingTasks,
    completedTasks,
    addTask,
    completeTask,
    deleteTask,
  } = useTasks(targetDate)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckSquare className="h-5 w-5" />
          Tasks
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {completedTasks.length}/{tasks.length} done
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <TaskForm onSubmit={addTask} date={targetDate} />

        {pendingTasks.length > 0 && (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={() => completeTask(task.id)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>
        )}

        {completedTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium pt-2">
              Completed
            </p>
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={() => {}}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>
        )}

        {tasks.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No tasks yet. Add your first task above!
          </p>
        )}
      </CardContent>
    </Card>
  )
}
