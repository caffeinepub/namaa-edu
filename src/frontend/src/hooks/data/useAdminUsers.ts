import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../useActor';
import { UserProfile, UserRole } from '../../backend';
import { Principal } from '@dfinity/principal';

export interface InternalUser {
  principal: string;
  profile: UserProfile | null;
}

export function useGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<InternalUser[]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      // Since backend doesn't have a getAllUsers method, we'll need to track users
      // For now, return empty array - this would need backend support
      return [];
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useUpdateUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userPrincipal, newRole }: { userPrincipal: string; newRole: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(userPrincipal);
      return actor.assignCallerUserRole(principal, newRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useGetUserProfile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (userPrincipal: string) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(userPrincipal);
      return actor.getUserProfile(principal);
    },
  });
}
