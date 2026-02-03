import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../useActor';
import { KidProfile } from '../../backend';

export function useListMyKidProfiles() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<KidProfile[]>({
    queryKey: ['myKidProfiles'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyKidProfiles();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetActiveKidContext() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<KidProfile | null>({
    queryKey: ['activeKidContext'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getActiveKidContext();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSelectKidContext() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (kidId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.selectKidContext(kidId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeKidContext'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}

export function useClearKidContext() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearKidContext();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeKidContext'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}
