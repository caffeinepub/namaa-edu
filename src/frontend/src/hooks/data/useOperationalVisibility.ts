import { useQuery } from '@tanstack/react-query';
import { useActor } from '../useActor';
import { TimelineEvent, ScheduleEvent } from '../../backend';

export function useProgramTimeline(programId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<TimelineEvent[]>({
    queryKey: ['programTimeline', programId],
    queryFn: async () => {
      if (!actor || !programId) return [];
      return actor.getProgramTimeline(programId);
    },
    enabled: !!actor && !actorFetching && !!programId,
  });
}

export function useUpcomingEvents(timeWindowSeconds?: number) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ScheduleEvent[]>({
    queryKey: ['upcomingEvents', timeWindowSeconds],
    queryFn: async () => {
      if (!actor) return [];
      // Default to 7 days (604800 seconds) if not specified
      const window = timeWindowSeconds !== undefined ? BigInt(timeWindowSeconds) : null;
      const events = await actor.getUpcomingEventsInWindow(window);
      // Sort by start time ascending (soonest first)
      return events.sort((a, b) => Number(a.startTimestamp) - Number(b.startTimestamp));
    },
    enabled: !!actor && !actorFetching,
  });
}
