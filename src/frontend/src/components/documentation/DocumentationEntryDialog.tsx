import { useState, useEffect } from 'react';
import { useCreateDocumentationEntry } from '../../hooks/data/useDocumentation';
import { useActivities } from '../../hooks/data/useActivities';
import { useGetCallerUserProfile } from '../../hooks/queries/useCurrentUser';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentationEntry } from '../../backend';
import { toast } from 'sonner';

interface DocumentationEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: DocumentationEntry | null;
}

export default function DocumentationEntryDialog({ open, onOpenChange, entry }: DocumentationEntryDialogProps) {
  const [activityId, setActivityId] = useState('');
  const [content, setContent] = useState('');
  
  const { data: activities = [] } = useActivities();
  const { data: userProfile } = useGetCallerUserProfile();
  const createEntry = useCreateDocumentationEntry();

  const isEditing = !!entry;

  useEffect(() => {
    if (entry) {
      setActivityId(entry.activityId);
      setContent(entry.content);
    } else {
      setActivityId('');
      setContent('');
    }
  }, [entry, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activityId) {
      toast.error('Please select an activity');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter content');
      return;
    }

    try {
      if (!isEditing) {
        await createEntry.mutateAsync({
          activityId,
          content: content.trim(),
          author: userProfile?.name || 'Unknown',
          timestamp: BigInt(Date.now()),
          isActive: true,
          isArchived: false,
        });
        toast.success('Documentation entry created successfully');
      }
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create entry';
      if (errorMessage.includes('Unauthorized')) {
        toast.error('You do not have permission to create documentation');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Documentation Entry' : 'Create Documentation Entry'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'View documentation entry details' : 'Add notes, reflections, or outcomes from an activity'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity">Activity *</Label>
            <Select value={activityId} onValueChange={setActivityId} disabled={isEditing}>
              <SelectTrigger id="activity">
                <SelectValue placeholder="Select an activity" />
              </SelectTrigger>
              <SelectContent>
                {activities.map((activity) => (
                  <SelectItem key={activity.id} value={activity.id}>
                    {activity.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Enter your notes, reflections, or outcomes here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isEditing}
              rows={8}
              className="resize-none"
            />
          </div>
          {isEditing && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Author: {entry?.author}</p>
              <p>Created: {new Date(Number(entry?.timestamp)).toLocaleString()}</p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isEditing ? 'Close' : 'Cancel'}
            </Button>
            {!isEditing && (
              <Button 
                type="submit" 
                disabled={createEntry.isPending}
              >
                {createEntry.isPending ? 'Creating...' : 'Create Entry'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
