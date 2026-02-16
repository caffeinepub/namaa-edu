import { useState } from 'react';
import { useActivities, useUpdateActivityStatus } from '../../hooks/data/useActivities';
import { usePrograms } from '../../hooks/data/usePrograms';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetUserProfiles } from '../../hooks/queries/useUserProfiles';
import { useSessionStorageState } from '../../hooks/useSessionStorageState';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Activity } from '../../backend';
import { SIMPLE_COLUMNS, DETAILED_COLUMNS } from '../../constants/activityStatuses';
import SprintBoardColumn from '../../components/sprint/SprintBoardColumn';
import ActivityDialog from '../../components/activities/ActivityDialog';
import { AlertCircle, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';

type ViewMode = 'simple' | 'detailed';

export default function SprintBoardPage() {
  const { data: activities = [], isLoading: activitiesLoading } = useActivities();
  const { data: programs = [], isLoading: programsLoading } = usePrograms();
  const updateStatus = useUpdateActivityStatus();
  const { identity } = useInternetIdentity();
  
  const [viewMode, setViewMode] = useSessionStorageState<ViewMode>('sprintBoardViewMode', 'simple');
  const [mineOnlyFilter, setMineOnlyFilter] = useSessionStorageState<boolean>('mineOnlyFilter', false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isAuthenticated = !!identity;
  const isLoading = activitiesLoading || programsLoading;

  // Batch fetch owner profiles for all activities
  const ownerPrincipals = activities.map(a => a.owner);
  const { data: profilesMap } = useGetUserProfiles(ownerPrincipals);

  const columns = viewMode === 'simple' ? SIMPLE_COLUMNS : DETAILED_COLUMNS;

  // Apply mine-only filter to all activities before distributing to columns
  const filteredActivities = mineOnlyFilter && isAuthenticated
    ? activities.filter(activity => activity.owner.toString() === identity?.getPrincipal().toString())
    : activities;

  const getActivitiesForColumn = (columnStatuses: string[]) => {
    return filteredActivities.filter(activity => columnStatuses.includes(activity.status));
  };

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDialogOpen(true);
  };

  const handleActivityMove = async (activity: Activity, newStatus: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to move activities');
      return;
    }

    if (activity.id.startsWith('sample-')) {
      toast.error('Cannot modify sample data');
      return;
    }

    try {
      await updateStatus.mutateAsync({
        activityId: activity.id,
        newStatus,
        activity,
      });
      toast.success(`Activity moved to ${newStatus}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update activity status';
      if (errorMessage.includes('Unauthorized')) {
        toast.error('You do not have permission to update activities');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'simple' ? 'detailed' : 'simple');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Sprint Board</h3>
          <p className="text-sm text-muted-foreground">
            Kanban-style view of all active activities across programs
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 border rounded-md bg-background">
            <Switch
              id="mine-only-filter-board"
              checked={mineOnlyFilter}
              onCheckedChange={setMineOnlyFilter}
              disabled={!isAuthenticated}
            />
            <Label 
              htmlFor="mine-only-filter-board" 
              className="text-sm font-normal cursor-pointer whitespace-nowrap"
            >
              Mine only
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="view-mode" className="text-sm font-normal cursor-pointer">
              {viewMode === 'simple' ? 'Simple' : 'Detailed'} View
            </Label>
            <Switch
              id="view-mode"
              checked={viewMode === 'detailed'}
              onCheckedChange={toggleViewMode}
            />
            <List className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {!isAuthenticated && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are viewing in read-only mode. Please log in to move activities between columns.
          </AlertDescription>
        </Alert>
      )}

      {activities.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No activities found. Create activities from the Activities page to see them here.
          </AlertDescription>
        </Alert>
      ) : filteredActivities.length === 0 && mineOnlyFilter ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No activities owned by you. Turn off "Mine only" to see all activities.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex-1 overflow-hidden">
          <div className={`grid gap-4 h-full ${viewMode === 'simple' ? 'grid-cols-3' : 'grid-cols-5'}`}>
            {columns.map((column) => (
              <SprintBoardColumn
                key={column.id}
                title={column.label}
                activities={getActivitiesForColumn(column.statuses)}
                programs={programs}
                profilesMap={profilesMap}
                isDetailed={viewMode === 'detailed'}
                onActivityClick={handleActivityClick}
                onActivityMove={handleActivityMove}
                targetStatus={column.id}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        </div>
      )}

      <ActivityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        activity={selectedActivity}
      />
    </div>
  );
}
