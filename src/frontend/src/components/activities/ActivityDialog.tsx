import { useState, useEffect } from 'react';
import { useCreateActivity, useUpdateActivityStatus } from '../../hooks/data/useActivities';
import { usePrograms } from '../../hooks/data/usePrograms';
import { useOrphanages } from '../../hooks/data/useOrphanages';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity } from '../../backend';
import { ALL_STATUS_OPTIONS } from '../../constants/activityStatuses';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Principal } from '@dfinity/principal';

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity | null;
}

const ORPHANAGE_NONE_SENTINEL = 'NONE';

export default function ActivityDialog({ open, onOpenChange, activity }: ActivityDialogProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<string>(ALL_STATUS_OPTIONS[0]);
  const [programId, setProgramId] = useState('');
  const [orphanageId, setOrphanageId] = useState<string>(ORPHANAGE_NONE_SENTINEL);
  
  const { identity } = useInternetIdentity();
  const { data: programs = [], isLoading: programsLoading } = usePrograms();
  const { data: orphanages = [] } = useOrphanages();
  const createActivity = useCreateActivity();
  const updateStatus = useUpdateActivityStatus();

  const isEditing = !!activity;
  const isAuthenticated = !!identity;

  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setStatus(activity.status);
      setProgramId(activity.programId);
      setOrphanageId(activity.orphanageId || ORPHANAGE_NONE_SENTINEL);
    } else {
      setTitle('');
      setStatus(ALL_STATUS_OPTIONS[0]);
      setProgramId('');
      setOrphanageId(ORPHANAGE_NONE_SENTINEL);
    }
  }, [activity, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('You must be logged in to create activities');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter an activity title');
      return;
    }

    if (!programId) {
      toast.error('Please select a program');
      return;
    }

    try {
      if (isEditing) {
        if (status !== activity.status) {
          await updateStatus.mutateAsync({
            activityId: activity.id,
            newStatus: status,
            activity,
          });
          toast.success('Activity status updated successfully');
        }
      } else {
        const finalOrphanageId = orphanageId === ORPHANAGE_NONE_SENTINEL ? undefined : orphanageId;
        const ownerPrincipal = identity!.getPrincipal();
        
        await createActivity.mutateAsync({
          id: `act-${Date.now()}`,
          title: title.trim(),
          status,
          programId,
          orphanageId: finalOrphanageId,
          isArchived: false,
          owner: ownerPrincipal,
        });
        toast.success('Activity created successfully');
      }
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.message || (isEditing ? 'Failed to update activity' : 'Failed to create activity');
      if (errorMessage.includes('Unauthorized')) {
        toast.error('You do not have permission to perform this action');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const selectedOrphanage = orphanages.find(o => o.id === (activity?.orphanageId || (orphanageId !== ORPHANAGE_NONE_SENTINEL ? orphanageId : undefined)));
  const canSubmit = isAuthenticated && !createActivity.isPending && !updateStatus.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Activity Details' : 'Create New Activity'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'View and update activity information' : 'Add a new activity to track your program execution'}
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to create activities.
            </AlertDescription>
          </Alert>
        )}

        {isAuthenticated && !isEditing && programs.length === 0 && !programsLoading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No programs available. Please create a program first before adding activities.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Activity Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Ramadan Micro Camp at Panti Asuhan Al-Ikhlas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isEditing && activity?.id.startsWith('sample-')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="program">Program *</Label>
            {programsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading programs...
              </div>
            ) : (
              <Select value={programId} onValueChange={setProgramId} disabled={isEditing || programs.length === 0}>
                <SelectTrigger id="program">
                  <SelectValue placeholder={programs.length === 0 ? "No programs available" : "Select a program"} />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="orphanage">Orphanage Partner</Label>
            <Select value={orphanageId} onValueChange={setOrphanageId} disabled={isEditing}>
              <SelectTrigger id="orphanage">
                <SelectValue placeholder="Select an orphanage (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ORPHANAGE_NONE_SENTINEL}>None</SelectItem>
                {orphanages.map((orphanage) => (
                  <SelectItem key={orphanage.id} value={orphanage.id}>
                    {orphanage.name} - {orphanage.region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditing && selectedOrphanage && (
              <p className="text-xs text-muted-foreground">
                Partner: {selectedOrphanage.name}, {selectedOrphanage.region}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={setStatus} disabled={activity?.id.startsWith('sample-')}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Activity workflow: Backlog → Planning → Scheduled → In Progress → Completed
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isEditing ? 'Close' : 'Cancel'}
            </Button>
            {(!isEditing || !activity?.id.startsWith('sample-')) && (
              <Button 
                type="submit" 
                disabled={!canSubmit || (programs.length === 0 && !isEditing)}
              >
                {createActivity.isPending || updateStatus.isPending
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Status'
                  : 'Create Activity'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
