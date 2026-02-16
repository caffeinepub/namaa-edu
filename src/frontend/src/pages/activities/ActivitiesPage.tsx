import { useState } from 'react';
import { useActivities, useCreateActivity, useArchiveActivity } from '../../hooks/data/useActivities';
import { useOrphanages } from '../../hooks/data/useOrphanages';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetUserProfiles } from '../../hooks/queries/useUserProfiles';
import { useSessionStorageState } from '../../hooks/useSessionStorageState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Search, Archive, Calendar, MapPin, AlertCircle } from 'lucide-react';
import ActivityDialog from '../../components/activities/ActivityDialog';
import ArchiveConfirmDialog from '../../components/common/ArchiveConfirmDialog';
import OwnerIndicator from '../../components/common/OwnerIndicator';
import { Activity } from '../../backend';
import { ALL_STATUS_OPTIONS, ACTIVITY_STATUS_COLORS } from '../../constants/activityStatuses';
import { showSuccessToast, showErrorToast, SUCCESS_MESSAGES } from '../../utils/mutationFeedback';

export default function ActivitiesPage() {
  const { data: activities = [], isLoading } = useActivities();
  const { data: orphanages = [] } = useOrphanages();
  const createActivity = useCreateActivity();
  const archiveActivity = useArchiveActivity();
  const { identity } = useInternetIdentity();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orphanageFilter, setOrphanageFilter] = useState<string>('all');
  const [mineOnlyFilter, setMineOnlyFilter] = useSessionStorageState<boolean>('mineOnlyFilter', false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Activity | null>(null);

  const isAuthenticated = !!identity;

  // Batch fetch owner profiles for all activities
  const ownerPrincipals = activities.map(a => a.owner);
  const { data: profilesMap } = useGetUserProfiles(ownerPrincipals);

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    const matchesOrphanage = orphanageFilter === 'all' || activity.orphanageId === orphanageFilter;
    const matchesOwner = !mineOnlyFilter || !isAuthenticated || activity.owner.toString() === identity?.getPrincipal().toString();
    return matchesSearch && matchesStatus && matchesOrphanage && matchesOwner;
  });

  const handleCreate = () => {
    if (!isAuthenticated) {
      showErrorToast(new Error('Unauthorized'), 'Please log in to create activities');
      return;
    }
    setSelectedActivity(null);
    setIsDialogOpen(true);
  };

  const handleView = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDialogOpen(true);
  };

  const handleArchive = async () => {
    if (!archiveTarget || archiveActivity.isPending) return;
    
    try {
      await archiveActivity.mutateAsync({
        activityId: archiveTarget.id,
        activity: archiveTarget,
      });
      showSuccessToast(SUCCESS_MESSAGES.activityArchived);
      setArchiveTarget(null);
    } catch (error: unknown) {
      showErrorToast(error, 'Failed to archive activity');
      setArchiveTarget(null);
    }
  };

  const getOrphanageName = (orphanageId?: string) => {
    if (!orphanageId) return null;
    const orphanage = orphanages.find(o => o.id === orphanageId);
    return orphanage ? `${orphanage.name}, ${orphanage.region}` : null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Activity Log</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage your program activities from planning to completion
          </p>
        </div>
        <Button onClick={handleCreate} disabled={!isAuthenticated}>
          <Plus className="mr-2 h-4 w-4" />
          New Activity
        </Button>
      </div>

      {!isAuthenticated && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to create and manage activities.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ALL_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={orphanageFilter} onValueChange={setOrphanageFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by orphanage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orphanages</SelectItem>
            {orphanages.map((orphanage) => (
              <SelectItem key={orphanage.id} value={orphanage.id}>
                {orphanage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 px-3 border rounded-md bg-background">
          <Switch
            id="mine-only-filter"
            checked={mineOnlyFilter}
            onCheckedChange={setMineOnlyFilter}
            disabled={!isAuthenticated}
          />
          <Label 
            htmlFor="mine-only-filter" 
            className="text-sm font-normal cursor-pointer whitespace-nowrap"
          >
            Mine only
          </Label>
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No activities found</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all' || orphanageFilter !== 'all' || mineOnlyFilter ? 'Try adjusting your filters' : 'Get started by creating your first activity'}
            </p>
            {!searchQuery && statusFilter === 'all' && orphanageFilter === 'all' && !mineOnlyFilter && isAuthenticated && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Activity
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => {
            const orphanageName = getOrphanageName(activity.orphanageId);
            const ownerProfile = profilesMap?.get(activity.owner.toString());
            
            return (
              <Card key={activity.id} className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleView(activity)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{activity.title}</CardTitle>
                        {activity.id.startsWith('sample-') && (
                          <Badge variant="outline" className="text-xs">Sample data</Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm space-y-1">
                        <div>Program ID: {activity.programId}</div>
                        {orphanageName && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {orphanageName}
                          </div>
                        )}
                        <div className="pt-1">
                          <OwnerIndicator 
                            owner={activity.owner} 
                            profile={ownerProfile}
                            size="sm"
                          />
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={ACTIVITY_STATUS_COLORS[activity.status] || ''} variant="secondary">
                        {activity.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setArchiveTarget(activity);
                        }}
                        disabled={activity.id.startsWith('sample-') || !isAuthenticated}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      <ActivityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        activity={selectedActivity}
      />

      <ArchiveConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Archive Activity"
        description={`Are you sure you want to archive "${archiveTarget?.title}"? This action can be undone later.`}
        isPending={archiveActivity.isPending}
      />
    </div>
  );
}
