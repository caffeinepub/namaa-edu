import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/queries/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardSection } from './DashboardLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';

interface HeaderProps {
  currentSection: DashboardSection;
}

const sectionTitles: Record<DashboardSection, string> = {
  programs: 'Programs',
  activities: 'Activities',
  organizations: 'Orphanages',
  people: 'People',
  documentation: 'Documentation',
  admin: 'Admin',
  sprintBoard: 'Sprint Board',
};

export default function Header({ currentSection }: HeaderProps) {
  const { clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const initials = userProfile?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h2 className="text-2xl font-semibold text-foreground">{sectionTitles[currentSection]}</h2>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{userProfile?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{userProfile?.role || 'Member'}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
