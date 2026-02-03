import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../useActor';
import { Program } from '../../backend';
import { samplePrograms } from '../../sampleData/sampleData';

export function usePrograms() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Program[]>({
    queryKey: ['programs'],
    queryFn: async () => {
      if (!actor) return [];
      
      const backendPrograms = await actor.listPrograms();
      
      // Filter out archived programs and fallback to sample data if empty
      const activePrograms = backendPrograms.filter(p => !p.isArchived);
      if (activePrograms.length === 0) {
        return samplePrograms;
      }
      
      return activePrograms;
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateProgram() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (program: Program) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createProgram(program);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}

export function useUpdateProgram() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, program }: { id: string; program: Program }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProgram(id, program);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}

export function useArchiveProgram() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ programId, program }: { programId: string; program: Program }) => {
      if (!actor) throw new Error('Actor not available');
      const archivedProgram = { ...program, isArchived: true };
      return actor.updateProgram(programId, archivedProgram);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}
