import { useEffect } from 'react';
import { useListMyKidProfiles, useSelectKidContext } from '../../hooks/kidMode/useKidContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Loader2 } from 'lucide-react';

export default function KidModeSelector() {
  const { data: kidProfiles, isLoading } = useListMyKidProfiles();
  const selectKidContext = useSelectKidContext();

  // Auto-select if exactly one kid profile exists
  useEffect(() => {
    if (kidProfiles && kidProfiles.length === 1 && !selectKidContext.isPending) {
      selectKidContext.mutate(kidProfiles[0].id);
    }
  }, [kidProfiles]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading profiles...</p>
        </div>
      </div>
    );
  }

  // Auto-selecting single profile
  if (kidProfiles && kidProfiles.length === 1) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">
            Loading {kidProfiles[0].firstName}'s programs...
          </p>
        </div>
      </div>
    );
  }

  // No kid profiles
  if (!kidProfiles || kidProfiles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>No Kid Profiles Found</CardTitle>
            <CardDescription>
              There are no kid profiles associated with your account. Please contact your administrator to set up a kid profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Multiple kid profiles - show selection
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Select a Profile</CardTitle>
          <CardDescription>
            Choose which kid profile you'd like to view programs for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {kidProfiles.map((kid) => (
              <Button
                key={kid.id}
                variant="outline"
                className="h-auto flex-col items-start gap-2 p-4 text-left"
                onClick={() => selectKidContext.mutate(kid.id)}
                disabled={selectKidContext.isPending}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    {kid.firstName[0]}{kid.lastName[0]}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {kid.firstName} {kid.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Age {Number(kid.age)}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
