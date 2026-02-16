import { useState, useEffect, useRef } from 'react';
import { usePrograms } from '../../hooks/data/usePrograms';
import { useProgramTimeline, useUpcomingEvents } from '../../hooks/data/useOperationalVisibility';
import { useGetUserProfiles } from '../../hooks/queries/useUserProfiles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, Activity } from 'lucide-react';
import { showErrorToast } from '../../utils/mutationFeedback';
import { humanizeTimelineEvent } from '../../utils/timelineEventFormatter';

export default function OperationalVisibilityPage() {
  const [selectedProgramId, setSelectedProgramId] = useState<string | undefined>(undefined);

  const { data: programs, isLoading: programsLoading } = usePrograms();
  const { data: upcomingEvents, isLoading: upcomingLoading, error: upcomingError } = useUpcomingEvents(604800); // 7 days
  const { data: timelineEvents, isLoading: timelineLoading, error: timelineError } = useProgramTimeline(selectedProgramId);

  // Extract unique actor principals from timeline events
  const actorPrincipals = timelineEvents?.map(event => event.actorPrincipal).filter((p): p is NonNullable<typeof p> => p !== undefined) || [];
  const { data: userProfiles } = useGetUserProfiles(actorPrincipals);

  // Track last notified errors to prevent repeated toasts
  const lastUpcomingErrorRef = useRef<string | null>(null);
  const lastTimelineErrorRef = useRef<string | null>(null);

  // Show error toasts only when error state changes
  useEffect(() => {
    if (upcomingError) {
      const errorMessage = upcomingError instanceof Error ? upcomingError.message : 'Unknown error';
      if (lastUpcomingErrorRef.current !== errorMessage) {
        lastUpcomingErrorRef.current = errorMessage;
        showErrorToast(upcomingError, 'Failed to load upcoming events');
      }
    } else {
      // Clear tracker when error is resolved
      lastUpcomingErrorRef.current = null;
    }
  }, [upcomingError]);

  useEffect(() => {
    if (timelineError) {
      const errorMessage = timelineError instanceof Error ? timelineError.message : 'Unknown error';
      if (lastTimelineErrorRef.current !== errorMessage) {
        lastTimelineErrorRef.current = errorMessage;
        showErrorToast(timelineError, 'Failed to load program timeline');
      }
    } else {
      // Clear tracker when error is resolved
      lastTimelineErrorRef.current = null;
    }
  }, [timelineError]);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* What's Coming Up This Week */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            What's Coming Up This Week
          </CardTitle>
          <CardDescription>
            Schedule events for the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !upcomingEvents || upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No upcoming events scheduled for this week</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Events will appear here when they are scheduled
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const program = programs?.find(p => p.id === event.programId);
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground">{event.title}</h4>
                      {program && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Program: {program.name}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(event.startTimestamp)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(event.startTimestamp)} - {formatTime(event.endTimestamp)}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Program Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Program Timeline
          </CardTitle>
          <CardDescription>
            View audit log and activity history for a specific program
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Program Selector */}
          <div className="flex items-center gap-3">
            <label htmlFor="program-select" className="text-sm font-medium text-foreground whitespace-nowrap">
              Select Program:
            </label>
            <Select
              value={selectedProgramId || ''}
              onValueChange={(value) => setSelectedProgramId(value || undefined)}
            >
              <SelectTrigger id="program-select" className="w-full max-w-md">
                <SelectValue placeholder="Choose a program to view timeline..." />
              </SelectTrigger>
              <SelectContent>
                {programsLoading ? (
                  <SelectItem value="loading" disabled>Loading programs...</SelectItem>
                ) : !programs || programs.length === 0 ? (
                  <SelectItem value="empty" disabled>No programs available</SelectItem>
                ) : (
                  programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Timeline Events */}
          {!selectedProgramId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Select a program to view its timeline</p>
            </div>
          ) : timelineLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !timelineEvents || timelineEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No timeline events for this program yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Events will appear here as activities are created and updated
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {timelineEvents.map((event) => {
                const actorProfile = event.actorPrincipal 
                  ? userProfiles?.get(event.actorPrincipal.toString())
                  : undefined;
                const humanizedMessage = humanizeTimelineEvent(event, actorProfile);

                return (
                  <div
                    key={event.id.toString()}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {humanizedMessage}
                          </p>
                          {event.relatedId && (
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              ID: {event.relatedId}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(BigInt(event.timestamp))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
