import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../useActor';
import { ScheduleEvent } from '../../backend';

export function useGetScheduleEventsByProgram(programId: string | undefined, enabled: boolean = true) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ScheduleEvent[]>({
    queryKey: ['scheduleEvents', programId],
    queryFn: async () => {
      if (!actor || !programId) return [];
      return actor.listScheduleEvents(programId);
    },
    enabled: !!actor && !actorFetching && !!programId && enabled,
  });
}

export function useCreateScheduleEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: ScheduleEvent) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createScheduleEvent(event);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scheduleEvents', variables.programId] });
    },
  });
}

export function useArchiveScheduleEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, programId, event }: { eventId: string; programId: string; event: ScheduleEvent }) => {
      if (!actor) throw new Error('Actor not available');
      const archivedEvent = { ...event, isArchived: true };
      return actor.updateScheduleEvent(eventId, archivedEvent);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scheduleEvents', variables.programId] });
    },
  });
}
