import { ReactNode } from 'react';
import { UserRole } from '../../backend';

interface AuthGateProps {
  children: ReactNode;
  userRole?: UserRole;
}

export default function AuthGate({ children, userRole }: AuthGateProps) {
  // TEMPORARY: Allow all authenticated users during testing phase
  // TODO: Re-enable role-based access control before production
  // Original logic: if (!userRole || userRole === UserRole.guest) { show access denied }
  
  // For now, just render children for any authenticated user
  return <>{children}</>;
}
