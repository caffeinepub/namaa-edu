import { useQuery } from '@tanstack/react-query';
import { useActor } from '../useActor';
import { Program, ProgramMediaAttachment } from '../../backend';
import { useGetActiveKidContext } from './useKidContext';

export function useKidAssignedPrograms() {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: activeKidContext } = useGetActiveKidContext();

  return useQuery<Program[]>({
    queryKey: ['kidAssignedPrograms', activeKidContext?.id],
    queryFn: async () => {
      if (!actor || !activeKidContext) return [];
      // Backend already filters programs based on active kid context
      return actor.listPrograms();
    },
    enabled: !!actor && !actorFetching && !!activeKidContext,
  });
}

export function useKidProgramAttachments(programId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: activeKidContext } = useGetActiveKidContext();

  return useQuery<ProgramMediaAttachment[]>({
    queryKey: ['kidProgramAttachments', programId, activeKidContext?.id],
    queryFn: async () => {
      if (!actor || !programId || !activeKidContext) return [];
      // Backend verifies kid has access to this program
      return actor.listProgramMediaAttachments(programId);
    },
    enabled: !!actor && !actorFetching && !!programId && !!activeKidContext,
  });
}
