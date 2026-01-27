import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import * as applicationsApi from '@/lib/supabase/api/applications'
import type { ApplicationStatus } from '@/types'
import { APPLICATION_STATUS_CONFIG } from '@/types'
import { useMemo } from 'react'

export function useApplications() {
  const { userId, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  // Query applications
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['applications', userId],
    queryFn: () => applicationsApi.fetchApplications(userId!),
    enabled: isAuthenticated && !!userId,
  })

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      if (!userId) throw new Error('Not authenticated')
      return applicationsApi.updateApplication(userId, id, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', userId] })
    },
  })

  // Delete application mutation
  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Not authenticated')
      return applicationsApi.deleteApplication(userId, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', userId] })
    },
  })

  // Get stats grouped by ApplicationStatus
  const stats = useMemo(() => {
    const statsByStatus: Record<ApplicationStatus, number> = {
      not_applied: 0,
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      accepted: 0,
      rejected: 0,
      ghosted: 0,
      withdrawn: 0,
    }

    applications.forEach(app => {
      statsByStatus[app.status] = (statsByStatus[app.status] || 0) + 1
    })

    return statsByStatus
  }, [applications])

  return {
    applications,
    isLoading,
    error,
    updateStatus: (id: string, status: ApplicationStatus) =>
      updateStatusMutation.mutate({ id, status }),
    deleteApplication: (id: string) => deleteApplicationMutation.mutate(id),
    getStats: () => stats,
    stats,
  }
}
