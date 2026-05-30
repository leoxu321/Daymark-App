import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import {
  buildPipelineOptimizerReport,
  createPipelineTask,
  fetchPipelineApplications,
  fetchPipelineTasks,
  makeFollowUpTask,
  makeInterviewPrepTask,
} from '@/services/jobPipelineOptimizer'
import type { FollowUpDraft, InterviewPrepGuide } from '@/types/jobPipelineAgent'

export function useJobPipelineOptimizer() {
  const { userId, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const applicationsQuery = useQuery({
    queryKey: ['job-pipeline-agent', 'applications', userId],
    queryFn: () => fetchPipelineApplications(userId!),
    enabled: isAuthenticated && !!userId,
  })

  const tasksQuery = useQuery({
    queryKey: ['job-pipeline-agent', 'tasks', userId],
    queryFn: () => fetchPipelineTasks(userId!),
    enabled: isAuthenticated && !!userId,
  })

  const report = useMemo(() => {
    return buildPipelineOptimizerReport(applicationsQuery.data || [], tasksQuery.data || [])
  }, [applicationsQuery.data, tasksQuery.data])

  const createTaskMutation = useMutation({
    mutationFn: async (item: InterviewPrepGuide | FollowUpDraft) => {
      if (!userId) throw new Error('Not authenticated')

      const task = 'interviewDate' in item
        ? makeInterviewPrepTask(item)
        : makeFollowUpTask(item)

      return createPipelineTask(userId, task)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
      queryClient.invalidateQueries({ queryKey: ['job-pipeline-agent', 'tasks', userId] })
    },
  })

  return {
    report,
    isLoading: applicationsQuery.isLoading || tasksQuery.isLoading,
    error: applicationsQuery.error || tasksQuery.error,
    createTask: createTaskMutation.mutate,
    isCreatingTask: createTaskMutation.isPending,
  }
}
