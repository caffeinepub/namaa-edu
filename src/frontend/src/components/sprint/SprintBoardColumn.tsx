import { Activity, Program, UserProfile } from '../../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SprintBoardCard from './SprintBoardCard';

interface SprintBoardColumnProps {
  title: string;
  activities: Activity[];
  programs: Program[];
  profilesMap: Map<string, UserProfile | null> | undefined;
  isDetailed: boolean;
  onActivityClick: (activity: Activity) => void;
  onActivityMove?: (activity: Activity, newStatus: string) => void;
  targetStatus: string;
  isAuthenticated: boolean;
}

export default function SprintBoardColumn({
  title,
  activities,
  programs,
  profilesMap,
  isDetailed,
  onActivityClick,
  onActivityMove,
  targetStatus,
  isAuthenticated,
}: SprintBoardColumnProps) {
  const getProgramForActivity = (activity: Activity): Program | null => {
    return programs.find(p => p.id === activity.programId) || null;
  };

  const handleDragStart = (e: React.DragEvent, activity: Activity) => {
    if (!isAuthenticated || activity.id.startsWith('sample-')) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(activity));
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAuthenticated) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isAuthenticated || !onActivityMove) return;
    e.preventDefault();
    
    try {
      const activityData = e.dataTransfer.getData('application/json');
      const activity: Activity = JSON.parse(activityData);
      
      if (activity.status !== targetStatus && !activity.id.startsWith('sample-')) {
        onActivityMove(activity, targetStatus);
      }
    } catch (error) {
      console.error('Failed to parse dropped activity:', error);
    }
  };

  return (
    <div 
      className="flex flex-col h-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Card className="flex-1 flex flex-col bg-muted/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {activities.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-2 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              No activities
            </div>
          ) : (
            activities.map((activity) => {
              const ownerProfile = profilesMap?.get(activity.owner.toString());
              return (
                <div
                  key={activity.id}
                  draggable={isAuthenticated && !activity.id.startsWith('sample-')}
                  onDragStart={(e) => handleDragStart(e, activity)}
                  className={isAuthenticated && !activity.id.startsWith('sample-') ? 'cursor-move' : ''}
                >
                  <SprintBoardCard
                    activity={activity}
                    program={getProgramForActivity(activity)}
                    ownerProfile={ownerProfile}
                    isDetailed={isDetailed}
                    onClick={() => onActivityClick(activity)}
                    isDraggable={isAuthenticated && !activity.id.startsWith('sample-')}
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
