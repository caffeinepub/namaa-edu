import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../useActor';
import { Person } from '../../backend';

export function usePeople() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Person[]>({
    queryKey: ['people'],
    queryFn: async () => {
      if (!actor) return [];
      const allPeople = await actor.listPeople();
      return allPeople.filter(p => p.isActive && !p.isArchived);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSearchPeople() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (searchTerm: string) => {
      if (!actor) throw new Error('Actor not available');
      const allPeople = await actor.listPeople();
      if (!searchTerm) return allPeople.filter(p => p.isActive && !p.isArchived);
      
      const lowerSearch = searchTerm.toLowerCase();
      return allPeople.filter(person => 
        person.isActive && 
        !person.isArchived && 
        person.name.toLowerCase().includes(lowerSearch)
      );
    },
  });
}

export function useCreatePerson() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (person: Omit<Person, 'id' | 'idText'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPerson({
        id: BigInt(0),
        idText: '',
        ...person,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });
}

export function useArchivePerson() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ personId, person }: { personId: bigint; person: Person }) => {
      if (!actor) throw new Error('Actor not available');
      const archivedPerson = { ...person, isArchived: true, isActive: false };
      return actor.updatePerson(personId, archivedPerson);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });
}
