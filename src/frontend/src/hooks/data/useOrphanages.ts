import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../useActor';
import { Orphanage } from '../../backend';
import { sampleOrphanages } from '../../sampleData/sampleData';

export function useOrphanages() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Orphanage[]>({
    queryKey: ['orphanages'],
    queryFn: async () => {
      if (!actor) return [];
      const backendOrphanages = await actor.listOrphanages();
      
      // Filter active orphanages
      const activeOrphanages = backendOrphanages.filter(o => o.isActive);
      
      // If no backend orphanages, show sample data
      if (activeOrphanages.length === 0) {
        return sampleOrphanages;
      }
      
      return activeOrphanages;
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetOrphanage(id: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Orphanage | null>({
    queryKey: ['orphanage', id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getOrphanage(id);
    },
    enabled: !!actor && !actorFetching && !!id,
  });
}

export function useCreateOrphanage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orphanage: Orphanage) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createOrphanage(orphanage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orphanages'] });
    },
  });
}

export function useUpdateOrphanage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orphanage: Orphanage) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateOrphanage(orphanage.id, orphanage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orphanages'] });
    },
  });
}

export function useArchiveOrphanage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orphanageId, orphanage }: { orphanageId: string; orphanage: Orphanage }) => {
      if (!actor) throw new Error('Actor not available');
      const archivedOrphanage = { ...orphanage, isActive: false };
      return actor.updateOrphanage(orphanageId, archivedOrphanage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orphanages'] });
    },
  });
}
