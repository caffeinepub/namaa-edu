import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../useActor';
import { DocumentationEntry } from '../../backend';

export function useDocumentationByActivity(activityId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DocumentationEntry[]>({
    queryKey: ['documentation', activityId],
    queryFn: async () => {
      if (!actor) return [];
      const allEntries = await actor.listDocumentationEntries();
      return allEntries.filter(entry => entry.activityId === activityId && !entry.isArchived);
    },
    enabled: !!actor && !actorFetching && !!activityId,
  });
}

export function useSearchDocumentation() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (searchTerm: string) => {
      if (!actor) throw new Error('Actor not available');
      const allEntries = await actor.listDocumentationEntries();
      if (!searchTerm) return allEntries.filter(e => !e.isArchived);
      
      const lowerSearch = searchTerm.toLowerCase();
      return allEntries.filter(entry => 
        !entry.isArchived && (
          entry.content.toLowerCase().includes(lowerSearch) ||
          entry.author.toLowerCase().includes(lowerSearch)
        )
      );
    },
  });
}

export function useCreateDocumentationEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<DocumentationEntry, 'id' | 'idText'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createDocumentationEntry({
        id: BigInt(0),
        idText: '',
        ...entry,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentation', variables.activityId] });
      queryClient.invalidateQueries({ queryKey: ['documentation'] });
      // Invalidate all program timelines since we don't know which program this activity belongs to
      queryClient.invalidateQueries({ queryKey: ['programTimeline'] });
    },
  });
}

export function useArchiveDocumentationEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, entry }: { entryId: bigint; entry: DocumentationEntry }) => {
      if (!actor) throw new Error('Actor not available');
      const archivedEntry = { ...entry, isArchived: true };
      return actor.updateDocumentationEntry(entryId, archivedEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentation'] });
      // Invalidate all program timelines since we don't know which program this activity belongs to
      queryClient.invalidateQueries({ queryKey: ['programTimeline'] });
    },
  });
}

export function useAllDocumentation() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DocumentationEntry[]>({
    queryKey: ['documentation'],
    queryFn: async () => {
      if (!actor) return [];
      const allEntries = await actor.listDocumentationEntries();
      return allEntries.filter(e => !e.isArchived);
    },
    enabled: !!actor && !actorFetching,
  });
}
