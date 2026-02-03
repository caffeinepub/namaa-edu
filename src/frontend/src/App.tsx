import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';
import { useGetCallerUserProfile, useGetCallerUserRole } from './hooks/queries/useCurrentUser';
import { useListMyKidProfiles, useGetActiveKidContext } from './hooks/kidMode/useKidContext';
import LoginCard from './components/auth/LoginCard';
import AuthGate from './components/auth/AuthGate';
import ProfileSetupDialog from './components/auth/ProfileSetupDialog';
import DashboardLayout from './components/layout/DashboardLayout';
import KidModeSelector from './components/kidMode/KidModeSelector';
import KidModeLayout from './components/kidMode/KidModeLayout';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: userRole, isLoading: roleLoading } = useGetCallerUserRole();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: kidProfiles, isLoading: kidProfilesLoading } = useListMyKidProfiles();
  const { data: activeKidContext, isLoading: kidContextLoading } = useGetActiveKidContext();

  const isAuthenticated = !!identity;
  const isLoading = isInitializing || actorFetching || (isAuthenticated && (roleLoading || profileLoading));

  // Show loading state
  if (isLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <LoginCard />
        </div>
      </ThemeProvider>
    );
  }

  // Show profile setup if authenticated but no profile
  const showProfileSetup = isAuthenticated && !profileLoading && profileFetched && userProfile === null;

  // After authentication and profile setup, check for kid mode
  const isKidProfilesReady = !kidProfilesLoading && !kidContextLoading;
  
  // If kid context is active, show kid mode layout
  if (isKidProfilesReady && activeKidContext) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthGate userRole={userRole}>
          <KidModeLayout />
        </AuthGate>
        <Toaster />
      </ThemeProvider>
    );
  }

  // If kid profiles exist but no active context, show selector
  if (isKidProfilesReady && kidProfiles && kidProfiles.length > 0 && !activeKidContext) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthGate userRole={userRole}>
          <KidModeSelector />
        </AuthGate>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Default: show internal dashboard (no kid profiles or user chose not to enter kid mode)
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthGate userRole={userRole}>
        <DashboardLayout />
        {showProfileSetup && <ProfileSetupDialog />}
      </AuthGate>
      <Toaster />
    </ThemeProvider>
  );
}
