import { Activity, Program } from '../../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ACTIVITY_STATUS_COLORS } from '../../constants/activityStatuses';
import { GripVertical } from 'lucide-react';

interface SprintBoardCardProps {
  activity: Activity;
  program: Program | null;
  isDetailed: boolean;
  onClick: () => void;
  isDraggable: boolean;
}

export default function SprintBoardCard({ activity, program, isDetailed, onClick, isDraggable }: SprintBoardCardProps) {
  const programName = program?.name || activity.programId;
  const isSample = activity.id.startsWith('sample-');

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow bg-card border-border"
      onClick={onClick}
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start gap-2">
          {isDraggable && (
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
              {activity.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-2">
        <Badge variant="outline" className="text-xs font-normal">
          {programName}
        </Badge>
        {isDetailed && (
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <Badge 
                className={`${ACTIVITY_STATUS_COLORS[activity.status] || ''} text-xs`} 
                variant="secondary"
              >
                {activity.status}
              </Badge>
            </div>
            {isSample && (
              <Badge variant="outline" className="text-xs">
                Sample data
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
