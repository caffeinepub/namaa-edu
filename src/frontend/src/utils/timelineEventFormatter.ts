import { TimelineEvent } from '../backend';
import { UserProfile } from '../backend';

/**
 * Humanize timeline event types into friendly, intimate messages
 * using the actor's name when available.
 */
export function humanizeTimelineEvent(
  event: TimelineEvent,
  actorProfile?: UserProfile | null
): string {
  const actorName = actorProfile?.name || 'Someone';

  switch (event.eventType) {
    case 'ProgramCreated':
      return `${actorName} created the program`;
    
    case 'ProgramUpdated':
      return `${actorName} changed the program details`;
    
    case 'ProgramDeleted':
      return `${actorName} deleted the program`;
    
    case 'ActivityCreated':
      return `${actorName} created an activity`;
    
    case 'ActivityUpdated':
      return `${actorName} updated an activity`;
    
    case 'ActivityDeleted':
      return `${actorName} removed an activity`;
    
    case 'AttachmentUploaded':
      return `${actorName} uploaded a file`;
    
    case 'AttachmentDeleted':
      return `${actorName} removed a file`;
    
    case 'ScheduleEventCreated':
      return `${actorName} scheduled an event`;
    
    case 'ScheduleEventUpdated':
      return `${actorName} changed an event`;
    
    case 'ScheduleEventDeleted':
      return `${actorName} cancelled an event`;
    
    case 'DocumentationEntryCreated':
      return `${actorName} added documentation`;
    
    case 'DocumentationEntryUpdated':
      return `${actorName} updated documentation`;
    
    case 'DocumentationEntryDeleted':
      return `${actorName} removed documentation`;
    
    default:
      // Fallback for unknown event types
      return `${actorName} made a change`;
  }
}
