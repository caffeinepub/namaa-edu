import { useIsCallerAdmin } from '../../hooks/queries/useCurrentUser';
import { DashboardSection } from './DashboardLayout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Users, Building2, Calendar, FileText, Settings, Kanban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SideNavProps {
  currentSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

export default function SideNav({ currentSection, onSectionChange }: SideNavProps) {
  const { data: isAdmin } = useIsCallerAdmin();

  const navItems = [
    { id: 'sprintBoard' as DashboardSection, label: 'Sprint Board', icon: Kanban },
    { id: 'programs' as DashboardSection, label: 'Programs', icon: BookOpen },
    { id: 'activities' as DashboardSection, label: 'Activities', icon: Calendar },
    { id: 'organizations' as DashboardSection, label: 'Orphanages', icon: Building2 },
    { id: 'people' as DashboardSection, label: 'People', icon: Users },
    { id: 'documentation' as DashboardSection, label: 'Documentation', icon: FileText },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <h1 className="text-xl font-semibold text-foreground">Namaa.Edu</h1>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentSection === item.id ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start',
                currentSection === item.id && 'bg-secondary text-secondary-foreground'
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
        {isAdmin && (
          <>
            <Separator className="my-4" />
            <Button
              variant={currentSection === 'admin' ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start',
                currentSection === 'admin' && 'bg-secondary text-secondary-foreground'
              )}
              onClick={() => onSectionChange('admin')}
            >
              <Settings className="mr-3 h-4 w-4" />
              Admin
            </Button>
          </>
        )}
      </nav>
    </aside>
  );
}
