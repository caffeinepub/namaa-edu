import { useQuery } from '@tanstack/react-query';
import { useActor } from '../useActor';
import { UserProfile } from '../../backend';
import { Principal } from '@dfinity/principal';

/**
 * Hook to fetch a user profile by principal.
 * Returns the profile if available, or null if not found or access denied.
 */
export function useGetUserProfile(principal: Principal | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      try {
        return await actor.getUserProfile(principal);
      } catch (error) {
        // If access is denied or profile doesn't exist, return null
        console.warn(`Could not fetch profile for ${principal.toString()}:`, error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!principal,
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to fetch multiple user profiles by principals.
 * Returns a map of principal string to UserProfile or null.
 */
export function useGetUserProfiles(principals: (Principal | undefined)[]) {
  const { actor, isFetching: actorFetching } = useActor();

  // Filter out undefined principals and deduplicate
  const uniquePrincipals = Array.from(
    new Set(
      principals
        .filter((p): p is Principal => p !== undefined)
        .map(p => p.toString())
    )
  ).map(str => Principal.fromText(str));

  return useQuery<Map<string, UserProfile | null>>({
    queryKey: ['userProfiles', uniquePrincipals.map(p => p.toString()).sort()],
    queryFn: async () => {
      if (!actor) return new Map();
      
      const profileMap = new Map<string, UserProfile | null>();
      
      // Fetch all profiles in parallel
      await Promise.all(
        uniquePrincipals.map(async (principal) => {
          try {
            const profile = await actor.getUserProfile(principal);
            profileMap.set(principal.toString(), profile);
          } catch (error) {
            // If access is denied or profile doesn't exist, store null
            console.warn(`Could not fetch profile for ${principal.toString()}:`, error);
            profileMap.set(principal.toString(), null);
          }
        })
      );
      
      return profileMap;
    },
    enabled: !!actor && !actorFetching && uniquePrincipals.length > 0,
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Helper function to get a display name from a principal and profile.
 * Returns the profile name if available, otherwise the principal string.
 */
export function getActorDisplayName(
  principal: Principal | undefined,
  profile: UserProfile | null | undefined
): string {
  if (!principal) return 'Unknown';
  if (profile?.name) return profile.name;
  return principal.toString();
}
