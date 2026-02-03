import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

export default function LoginCard() {
  const { login, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'User is already authenticated') {
        queryClient.clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to Namaa.Edu</CardTitle>
        <CardDescription>
          Internal operations dashboard for the Namaa.Edu team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full"
          size="lg"
        >
          {isLoggingIn ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in with Internet Identity
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Only authorized team members can access this dashboard
        </p>
      </CardContent>
    </Card>
  );
}
