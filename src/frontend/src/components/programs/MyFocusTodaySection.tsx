import { useActivities } from '../../hooks/data/useActivities';
import { useUpcomingEvents } from '../../hooks/data/useOperationalVisibility';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { Activity, ScheduleEvent } from '../../backend';

export default function MyFocusTodaySection() {
  const { identity } = useInternetIdentity();
  const { data: activities = [], isLoading: activitiesLoading } = useActivities();
  const { data: upcomingEvents = [], isLoading: eventsLoading } = useUpcomingEvents();

  // Filter activities owned by current user and not archived
  const myOpenActivities = identity
    ? activities.filter(
        (activity: Activity) =>
          activity.owner.toString() === identity.getPrincipal().toString() &&
          !activity.isArchived
      )
    : [];

  // Take only the next 3 upcoming events for a compact view
  const nextEvents = upcomingEvents.slice(0, 3);

  const isLoading = activitiesLoading || eventsLoading;

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">My focus today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          My focus today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* My Open Activities */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground/80">
            <Clock className="h-4 w-4" />
            My open activities
          </h4>
          {myOpenActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open activities assigned to you
            </p>
          ) : (
            <div className="space-y-2">
              {myOpenActivities.map((activity: Activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: {activity.status}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground/80">
            <Calendar className="h-4 w-4" />
            Upcoming events
          </h4>
          {nextEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming events
            </p>
          ) : (
            <div className="space-y-2">
              {nextEvents.map((event: ScheduleEvent) => {
                const eventDate = new Date(Number(event.startTimestamp) * 1000);
                const formattedDate = eventDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                const formattedTime = eventDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });

                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
                      <span className="text-xs font-semibold">
                        {formattedDate.split(' ')[0]}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {formattedDate.split(' ')[1]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formattedTime}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
