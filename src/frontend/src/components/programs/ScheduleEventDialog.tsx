import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateScheduleEvent } from '../../hooks/data/useScheduleEvents';
import { ScheduleEvent } from '../../backend';
import { showSuccessToast, showErrorToast, SUCCESS_MESSAGES } from '../../utils/mutationFeedback';
import { Loader2 } from 'lucide-react';

interface ScheduleEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  selectedDate?: Date;
}

export default function ScheduleEventDialog({
  open,
  onOpenChange,
  programId,
  selectedDate,
}: ScheduleEventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createEvent = useCreateScheduleEvent();

  useEffect(() => {
    if (open) {
      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
      } else {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
      }
      setTitle('');
      setDescription('');
      setStartTime('09:00');
      setEndTime('10:00');
      setLocation('');
    }
  }, [open, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard against double-submit
    if (isSubmitting) return;

    if (!title.trim()) {
      showErrorToast(new Error('Validation'), 'Please enter an event title');
      return;
    }

    if (!date) {
      showErrorToast(new Error('Validation'), 'Please select a date');
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse date and times
      const [year, month, day] = date.split('-').map(Number);
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startDate = new Date(year, month - 1, day, startHour, startMinute);
      const endDate = new Date(year, month - 1, day, endHour, endMinute);

      // Convert to nanoseconds timestamp
      const startTimestamp = BigInt(startDate.getTime() * 1_000_000);
      const endTimestamp = BigInt(endDate.getTime() * 1_000_000);

      const event: ScheduleEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        programId,
        title: title.trim(),
        description: description.trim(),
        startTimestamp,
        endTimestamp,
        location: location.trim() || undefined,
        isArchived: false,
      };

      await createEvent.mutateAsync(event);
      showSuccessToast(SUCCESS_MESSAGES.eventCreated);
      onOpenChange(false);
    } catch (error: unknown) {
      showErrorToast(error, 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = createEvent.isPending || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Schedule Event</DialogTitle>
          <DialogDescription>
            Add a new event to the program schedule
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Workshop Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Main Hall"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Event details and notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Creating...' : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
