import { ReactNode } from 'react';
import { UserRole } from '../../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface AuthGateProps {
  children: ReactNode;
  userRole?: UserRole;
}

export default function AuthGate({ children, userRole }: AuthGateProps) {
  // If role is guest or undefined, show access denied
  if (!userRole || userRole === UserRole.guest) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p>
              This is an internal workspace for the Namaa.Edu team. If you believe you should have access, please contact an administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
