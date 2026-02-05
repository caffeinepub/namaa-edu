import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../useActor';
import { Activity } from '../../backend';
import { sampleActivities } from '../../sampleData/sampleData';

export function useActivities() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: async () => {
      if (!actor) return [];
      const backendActivities = await actor.listActivities();
      
      // Filter out archived activities and fallback to sample data if empty
      const activeActivities = backendActivities.filter(a => !a.isArchived);
      if (activeActivities.length === 0) {
        return sampleActivities;
      }
      
      return activeActivities;
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: Activity) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createActivity(activity);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['programTimeline', variables.programId] });
    },
  });
}

export function useUpdateActivityStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ activityId, newStatus, activity }: { activityId: string; newStatus: string; activity: Activity }) => {
      if (!actor) throw new Error('Actor not available');
      const updatedActivity = { ...activity, status: newStatus };
      return actor.updateActivity(activityId, updatedActivity);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['programTimeline', variables.activity.programId] });
    },
  });
}

export function useArchiveActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ activityId, activity }: { activityId: string; activity: Activity }) => {
      if (!actor) throw new Error('Actor not available');
      const archivedActivity = { ...activity, isArchived: true };
      return actor.updateActivity(activityId, archivedActivity);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['programTimeline', variables.activity.programId] });
    },
  });
}
