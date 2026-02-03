import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useGetScheduleEventsByProgram, useArchiveScheduleEvent } from '../../hooks/data/useScheduleEvents';
import { ScheduleEvent } from '../../backend';
import { toast } from 'sonner';
import ScheduleEventDialog from './ScheduleEventDialog';

interface ProgramScheduleCalendarProps {
  programId: string;
  isAdmin: boolean;
  isSampleData: boolean;
}

export default function ProgramScheduleCalendar({
  programId,
  isAdmin,
  isSampleData,
}: ProgramScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showEventDialog, setShowEventDialog] = useState(false);

  const { data: events = [], isLoading } = useGetScheduleEventsByProgram(programId, !isSampleData);
  const archiveEvent = useArchiveScheduleEvent();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDate = (day: number): ScheduleEvent[] => {
    const dateToCheck = new Date(year, month, day);
    return events.filter((event) => {
      const eventDate = new Date(Number(event.startTimestamp) / 1_000_000);
      return (
        eventDate.getFullYear() === dateToCheck.getFullYear() &&
        eventDate.getMonth() === dateToCheck.getMonth() &&
        eventDate.getDate() === dateToCheck.getDate()
      );
    });
  };

  const handleDayClick = (day: number) => {
    if (!isSampleData && isAdmin) {
      const clickedDate = new Date(year, month, day);
      setSelectedDate(clickedDate);
      setShowEventDialog(true);
    }
  };

  const handleArchiveEvent = async (event: ScheduleEvent) => {
    try {
      await archiveEvent.mutateAsync({ 
        eventId: event.id, 
        programId,
        event,
      });
      toast.success('Event removed successfully');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to remove event';
      if (errorMessage.includes('Unauthorized')) {
        toast.error('Only administrators can remove events');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const formatTime = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const calendarDays: React.ReactElement[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 border border-border/50" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDate(day);
    const isToday =
      day === new Date().getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear();

    calendarDays.push(
      <div
        key={day}
        className={`h-24 border border-border/50 p-2 overflow-hidden ${
          !isSampleData && isAdmin ? 'cursor-pointer hover:bg-accent/50' : ''
        } ${isToday ? 'bg-primary/5' : ''}`}
        onClick={() => handleDayClick(day)}
      >
        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
          {day}
        </div>
        <div className="space-y-1">
          {dayEvents.slice(0, 2).map((event) => (
            <div
              key={event.id}
              className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded truncate group relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate flex-1">{event.title}</span>
                {isAdmin && !isSampleData && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchiveEvent(event);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold min-w-[180px] text-center">
            {monthNames[month]} {year}
          </h3>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {isAdmin && !isSampleData && (
          <Button
            size="sm"
            onClick={() => {
              setSelectedDate(undefined);
              setShowEventDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Loading calendar...</div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-0 border border-border/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold py-2 bg-muted/50 border-b border-border/50"
              >
                {day}
              </div>
            ))}
            {calendarDays}
          </div>

          {events.length > 0 && (
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Upcoming Events</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {events
                  .sort((a, b) => Number(a.startTimestamp - b.startTimestamp))
                  .slice(0, 5)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{event.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(Number(event.startTimestamp) / 1_000_000).toLocaleDateString()} •{' '}
                          {formatTime(event.startTimestamp)}
                          {event.location && ` • ${event.location}`}
                        </div>
                        {event.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {event.description}
                          </div>
                        )}
                      </div>
                      {isAdmin && !isSampleData && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchiveEvent(event)}
                          disabled={archiveEvent.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </>
      )}

      <ScheduleEventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        programId={programId}
        selectedDate={selectedDate}
      />
    </div>
  );
}
